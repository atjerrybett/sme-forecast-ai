#!/usr/bin/env python3
"""Generate a forecast using a LightGBM time-series model.

Input JSON (stdin):
{
  "transactions": [
    {"date": "2026-01-01", "amount": 1200.0, "category": "Sales"},
    ...
  ],
  "horizon": 90,
  "scenario": "expected" | "best" | "worst",
  "whatIf": { "salesPct": 0, "expensesPct": 0 }
}

Output JSON (stdout):
{
  "forecast": [
    {"date": "2026-04-01", "point": 2500, "lower": 2200, "upper": 2800},
    ...
  ],
  "explanation": "...",
  "model": "lightgbm-quantile"
}
"""

import json
import sys
from datetime import timedelta

import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor


def load_input():
    raw = sys.stdin.read()
    return json.loads(raw)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values("date")
    df["day_of_week"] = df["date"].dt.weekday
    df["month"] = df["date"].dt.month
    df["day_of_month"] = df["date"].dt.day
    df["is_month_start"] = df["date"].dt.is_month_start.astype(int)
    df["is_month_end"] = df["date"].dt.is_month_end.astype(int)

    df["rolling_7"] = df["amount"].rolling(7, min_periods=1).mean()
    df["rolling_30"] = df["amount"].rolling(30, min_periods=1).mean()
    df["lag_1"] = df["amount"].shift(1).fillna(0)
    df["lag_7"] = df["amount"].shift(7).fillna(0)
    df["lag_30"] = df["amount"].shift(30).fillna(0)

    # Add scenario/what-if as features
    df["scenario_expected"] = 1
    df["scenario_best"] = 0
    df["scenario_worst"] = 0

    df["whatif_sales_pct"] = 0
    df["whatif_expenses_pct"] = 0

    return df


def create_future_frame(last_date: pd.Timestamp, horizon: int) -> pd.DataFrame:
    future_dates = [last_date + timedelta(days=i + 1) for i in range(horizon)]
    return pd.DataFrame({"date": future_dates})


def fit_quantile_models(X: pd.DataFrame, y: pd.Series):
    # Train separate quantile models for 10%, 50%, 90%
    models = {}
    for alpha in [0.1, 0.5, 0.9]:
        model = LGBMRegressor(
            objective="quantile",
            alpha=alpha,
            n_estimators=200,
            learning_rate=0.1,
            random_state=42,
            verbose=-1,
        )
        model.fit(X, y)
        models[alpha] = model
    return models


def apply_scenario_whatif(series: pd.Series, scenario: str, whatif: dict) -> pd.Series:
    factor = 1.0
    if scenario == "best":
        factor *= 1.15
    elif scenario == "worst":
        factor *= 0.85

    factor *= 1 + (whatif.get("salesPct", 0) - whatif.get("expensesPct", 0)) / 100
    factor = max(0.1, min(factor, 2.0))

    return series * factor


def main():
    payload = load_input()
    transactions = payload.get("transactions", [])
    horizon = int(payload.get("horizon", 90))
    scenario = payload.get("scenario", "expected")
    whatif = payload.get("whatIf", {"salesPct": 0, "expensesPct": 0})

    if not transactions:
        print(json.dumps({"error": "No transaction data provided."}))
        return

    df = pd.DataFrame(transactions)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")

    # Fill missing daily dates
    df = df.set_index("date").resample("D").sum().reset_index()
    df["amount"] = df["amount"].fillna(0)

    df = build_features(df)

    feature_cols = [
        "day_of_week",
        "month",
        "day_of_month",
        "is_month_start",
        "is_month_end",
        "rolling_7",
        "rolling_30",
        "lag_1",
        "lag_7",
        "lag_30",
        "is_december",
        "is_june",
        "scenario_expected",
        "scenario_best",
        "scenario_worst",
        "whatif_sales_pct",
        "whatif_expenses_pct",
    ]

    # Apply scenario/what-if flags to entire dataset
    df["scenario_expected"] = 1 if scenario == "expected" else 0
    df["scenario_best"] = 1 if scenario == "best" else 0
    df["scenario_worst"] = 1 if scenario == "worst" else 0

    df["whatif_sales_pct"] = float(whatif.get("salesPct", 0))
    df["whatif_expenses_pct"] = float(whatif.get("expensesPct", 0))

    # Train on historical daily values
    if df.shape[0] < 20:
        print(json.dumps({"error": "Not enough data to generate a reliable forecast (need at least 20 days)."}))
        return

    y = df["amount"]
    X = df[feature_cols]

    models = fit_quantile_models(X, y)

    # Capture feature importances from the median (50th percentile) model
    feature_importances = []
    if 0.5 in models:
        importance_values = models[0.5].feature_importances_
        feature_importances = sorted(
            [
                {"feature": f, "importance": float(imp)}
                for f, imp in zip(feature_cols, importance_values)
            ],
            key=lambda item: -item["importance"],
        )

    last_date = df["date"].max()
    future_df = create_future_frame(last_date, horizon)
    future_df = build_features(future_df)

    # Apply same scenario/whatif for the forecast period
    future_df["scenario_expected"] = 1 if scenario == "expected" else 0
    future_df["scenario_best"] = 1 if scenario == "best" else 0
    future_df["scenario_worst"] = 1 if scenario == "worst" else 0
    future_df["whatif_sales_pct"] = float(whatif.get("salesPct", 0))
    future_df["whatif_expenses_pct"] = float(whatif.get("expensesPct", 0))

    X_future = future_df[feature_cols]

    preds = {
        alpha: models[alpha].predict(X_future) for alpha in [0.1, 0.5, 0.9]
    }

    # Apply scenario/what-if multiplier to median prediction for extra safety
    preds[0.5] = apply_scenario_whatif(pd.Series(preds[0.5]), scenario, whatif).values

    forecast = []
    for i, date in enumerate(future_df["date"]):
        point = float(preds[0.5][i])
        lower = float(preds[0.1][i])
        upper = float(preds[0.9][i])
        forecast.append({
            "date": date.strftime("%Y-%m-%d"),
            "point": point,
            "lower": lower,
            "upper": upper,
        })

    explanation = (
        f"Forecast uses a LightGBM quantile model trained on daily cash flow. "
        f"Scenario: {scenario}. Sales adjusted by {whatif.get('salesPct', 0)}%, expenses adjusted by {whatif.get('expensesPct', 0)}%."
    )

    output = {
        "forecast": forecast,
        "explanation": explanation,
        "model": "lightgbm-quantile",
        "feature_importances": feature_importances,
    }

    sys.stdout.write(json.dumps(output))


if __name__ == "__main__":
    main()
