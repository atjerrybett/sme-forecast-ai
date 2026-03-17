# ForecastFlow 📊

**AI-Powered Financial Forecasting for SMEs**

ForecastFlow is a modern, full-stack web application that helps small and medium enterprises (SMEs) understand their financial data through intelligent analysis and predictive forecasting. Built with cutting-edge technologies, it's a portfolio project showcasing production-ready code for a Full-Stack Developer role.

![Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## ✨ Features

- **🔐 Secure Authentication**: Email/password authentication with Supabase Auth
- **📤 CSV Data Upload**: Simple drag-and-drop interface to upload financial transactions
- **📊 Data Visualization**: Interactive charts built with Recharts
- **🔮 AI Forecasting**: Predict future trends with simple linear regression analysis
- **📋 Transaction Management**: Browse, filter, and analyze transaction data
- **💡 Intelligent Insights**: Automated analysis with actionable recommendations
- **🎨 Modern UI**: Clean, responsive design with Tailwind CSS
- **🛡️ Protected Routes**: Role-based access control and data privacy

---

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **State Management**: React Hooks

### Backend & Database
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Next.js API Routes

### Development & DevOps
- **Package Manager**: npm
- **Linting**: ESLint
- **Version Control**: Git
- **Deployment**: Ready for Vercel

---

## 📋 Project Structure

```
src/
├── app/
│   ├── auth/
│   │   ├── signin/page.tsx       # Sign in page
│   │   └── signup/page.tsx       # Sign up page
│   ├── dashboard/
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Dashboard home with stats
│   │   ├── upload/page.tsx       # CSV upload page
│   │   ├── transactions/page.tsx  # Transactions browser
│   │   └── forecast/page.tsx      # Forecast & insights
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
├── lib/
│   ├── auth.ts                   # Authentication helpers
│   ├── supabase.ts               # Supabase client
│   ├── useProtectedRoute.ts       # Protected route hook
│   └── utils.ts                  # Utility functions
├── types/
│   └── index.ts                  # TypeScript types
└── public/                       # Static assets
```

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- A Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/sme-forecast-ai.git
   cd sme-forecast-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   Navigate to http://localhost:3000

---

## 📊 Database Schema

### `profiles`
```sql
id (uuid) - references auth.users
full_name (text)
created_at (timestamp)
```

### `datasets`
```sql
id (uuid)
user_id (uuid) - references profiles
name (text)
uploaded_at (timestamp)
row_count (integer)
```

### `transactions`
```sql
id (uuid)
dataset_id (uuid) - references datasets
date (date)
description (text)
amount (numeric)
category (text)
```

---

## 📤 CSV Upload Format

Your CSV file should include these columns:

| Column | Required | Format | Example |
|--------|----------|--------|---------|
| date | ✅ | YYYY-MM-DD | 2024-01-15 |
| amount | ✅ | Number | 1500 or -200 |
| description | Optional | Text | Rent Payment |
| category | Optional | Text | Expenses, Income |

### Example CSV
```csv
date,description,amount,category
2024-01-15,Rent Payment,-1500,Expenses
2024-01-20,Product Sales,5000,Income
2024-01-25,Utilities,-200,Expenses
2024-02-01,Consulting Fee,3000,Income
```

---

## 🔧 Available Scripts

```bash
# Development
npm run dev           # Start dev server (http://localhost:3000)

# Building
npm run build         # Build for production
npm run start         # Start production server

# Code Quality
npm run lint          # Run ESLint
```

---

## 🔐 Security Features

- **Row-Level Security (RLS)**: PostgreSQL RLS policies ensure users only see their own data
- **Client-Side Validation**: Input validation before sending to backend
- **Secure Authentication**: JWT-based auth with Supabase
- **Protected Routes**: Automatic redirects for unauthenticated users
- **Environment Variables**: Sensitive data stored securely

---

## 🎯 Usage Walkthrough

### 1. Sign Up
- Navigate to http://localhost:3000
- Click "Sign Up"
- Enter your email and password
- Confirm your email (check inbox)

### 2. Upload Data
- Click "Upload Data" in the sidebar
- Drag and drop your CSV file
- Enter a dataset name
- Click "Upload File"

### 3. View Transactions
- Click "Transactions" to see all uploaded data
- Filter by category
- Sort by date or amount
- View summary statistics

### 4. View Forecast
- Click "Forecast" to see predictions
- View trend analysis and insights
- See monthly forecast chart
- Review category breakdown

---

## 📈 Forecasting Algorithm

The app uses **simple linear regression** to forecast trends:

1. Aggregates transactions by month
2. Fits a linear trend line through the data
3. Projects the trend 1 month into the future
4. Calculates confidence based on data variance
5. Generates actionable insights

### Insights Include:
- 📈 Trend direction (growing/declining/stable)
- 💹 Growth rate percentage
- 🔮 Projected amount for next period
- 💡 Recommendations based on income/expense ratio

---

## 🚀 Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your repository
   - Add environment variables
   - Deploy

### Environment Variables for Production
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🛣️ Future Enhancements

- [ ] Advanced forecasting (ARIMA, Prophet)
- [ ] Python backend for ML models
- [ ] Export reports as PDF
- [ ] Real-time data sync
- [ ] Multi-currency support
- [ ] Custom chart builder
- [ ] Email notifications
- [ ] API for third-party integrations

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 📧 Contact & Support

For questions or support:
- Email: support@forecastflow.dev
- Issues: GitHub Issues
- Discussions: GitHub Discussions

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a service
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Recharts](https://recharts.org/) - Charting library

---

**Made with ❤️ for SME financial empowerment**
