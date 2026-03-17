// Database types
export interface Profile {
  id: string;
  full_name: string;
  created_at: string;
}

export interface Dataset {
  id: string;
  user_id: string;
  name: string;
  uploaded_at: string;
  row_count: number;
}

export interface Transaction {
  id: string;
  dataset_id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
}

export interface ForecastData {
  period: string;
  actual?: number;
  forecast: number;
  confidence_interval: [number, number];
}

export interface Insights {
  trend: 'increasing' | 'decreasing' | 'stable';
  growth_rate: number;
  forecast_next_period: number;
  confidence: number;
  text: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
