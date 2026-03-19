#!/usr/bin/env python3
"""Generate SHAP feature importance for time-series forecasting.

Input JSON (stdin):
{
  "transactions": [
    {"date": "2026-01-01", "amount": 1200.0, "category": "Sales"},
    ...
  ],
  "forecast": [
    {"date": "2026-04-01", "point": 2500, "lower": 2200, "upper": 2800},
    ...
  ]
}

Output JSON (stdout):
{
  "feature_importance": [
    {"feature": "month", "importance": 0.32},
    ...
  ],
  "explanation": "..."
}
"""

import json
import sys
from datetime import datetime

import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor
import shap


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

    # Rolling features to capture seasonality (weekly/monthly)
    df["rolling_7"] = df["amount"].rolling(7, min_periods=1).mean()
    df["rolling_30"] = df["amount"].rolling(30, min_periods=1).mean()
    df["lag_1"] = df["amount"].shift(1).fillna(0)
    df["lag_7"] = df["amount"].shift(7).fillna(0)
    df["lag_30"] = df["amount"].shift(30).fillna(0)

    # Kenyan holidays (approximate) - implement common patterns
    df["is_december"] = (df["month"] == 12).astype(int)
    df["is_june"] = (df["month"] == 6).astype(int)

    return df


def main():
    payload = load_input()
    transactions = payload.get("transactions", [])
    forecast = payload.get("forecast", [])

    if not transactions:
        print(json.dumps({"error": "No transaction data provided."}))
        return

    df = pd.DataFrame(transactions)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values("date")

    df = build_features(df)

    # Train small model on historical data
    target = "amount"
    feature_columns = [
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
    ]

    train_df = df.dropna(subset=[target])

    if train_df.shape[0] < 10:
        print(json.dumps({"error": "Not enough data to build a SHAP model (need 10+ days)."}))
        return

    model = LGBMRegressor(n_estimators=200, random_state=42)
    model.fit(train_df[feature_columns], train_df[target])

    explainer = shap.Explainer(model)
    shap_values = explainer(train_df[feature_columns])

    # Aggregate mean absolute SHAP value per feature
    mean_shap = np.abs(shap_values.values).mean(axis=0)

    importance = [
        {"feature": f, "importance": float(v)}
        for f, v in sorted(zip(feature_columns, mean_shap), key=lambda x: x[1], reverse=True)
    ]

    # Build a simple explanation string
    top_features = [x["feature"] for x in importance[:3]]
    explanation = (
        f"Predictions are most influenced by: {', '.join(top_features)}. "
        f"For example, transactions in December and around school terms typically drive the largest swings in cash flow. "
        f"This analysis uses a tree-based time-series model trained on your historical daily data."
    )

    # Add short descriptions for top features to make explainability more readable
    feature_descriptions = {
        "day_of_week": "Weekly patterns (e.g., weekends vs weekdays).",
        "month": "Monthly seasonality, including holiday and school-term effects.",
        "day_of_month": "Month-end / month-start cash flow behavior.",
        "is_month_start": "Cash flow changes at the beginning of the month.",
        "is_month_end": "Cash flow changes at the end of the month.",
        "rolling_7": "Short-term momentum from the last week.",
        "rolling_30": "Longer-term trend from the last month.",
        "lag_1": "Yesterday’s cash flow effect on today.",
        "lag_7": "Weekly recurrence patterns.",
        "lag_30": "Monthly recurrence patterns.",
        "is_december": "Holiday spending season (December).",
        "is_june": "Mid-year spending shifts (June).",
    }

    feature_explanations = [
        {
            "feature": f["feature"],
            "importance": f["importance"],
            "description": feature_descriptions.get(f["feature"], ""),
        }
        for f in importance[:8]
    ]

    output = {
        "feature_importance": importance,
        "feature_explanations": feature_explanations,
        "explanation": explanation,
    }

    sys.stdout.write(json.dumps(output))


if __name__ == "__main__":
    main()
