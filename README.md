# InsightAI 🚀

InsightAI is a next-generation, zero-code **Business Intelligence (BI) Platform** designed to turn raw data spreadsheets into actionable, executive-level insights instantly. 

Powered by intelligent data parsing, machine-learning forecasting, and RAG-based AI conversational analytics, InsightAI enables business leaders to monitor KPIs, discover trends, and predict future revenue without writing a single line of SQL.

![InsightAI Executive Dashboard](https://insight-zeta-orpin.vercel.app/favicon.ico) *Note: Add a real screenshot link here*

---

## ✨ Key Features

- ⚡ **Zero-Friction Ingestion:** Instantly drag & drop CSV, Excel (XLSX/XLS), or JSON datasets. Data is parsed, cleaned, and summarized entirely in the browser for unmatched speed and security.
- 📊 **Automated Executive Dashboards:** Upload a dataset and immediately get auto-generated Key Performance Indicators (KPIs) like Total Revenue, Sales Volume, and Best-Selling Products, along with smart baseline charts.
- 🛠️ **Custom Analytics Builder:** Be your own data scientist. Add custom KPI cards and choose from **17 different interactive chart types** (Bar, Line, Pie, Radar, Scatter, Area, Heatmap, Waterfall, and more) using a simple dropdown interface.
- 🔮 **Predictive Machine Learning:** Utilize built-in time-series forecasting (Scikit-Learn/Polynomial Regression simulation) to project 30-day revenue trends, complete with confidence intervals and growth velocity metrics.
- 🤖 **Chat with Your Data (RAG AI):** Built-in Conversational AI allows you to query your dataset using natural language. Ask questions like *"Which city generated the highest revenue?"* and receive intelligent text answers alongside dynamic charts generated right in the chat.
- 🔒 **Offline / Local Mode Support:** Work seamlessly even without a backend. If the API sync fails, InsightAI gracefully falls back to processing and analyzing your dataset locally via `sessionStorage`.

---

## 🏗️ Architecture & Tech Stack

InsightAI is a modern monorepo built for speed and scalable data processing.

### Frontend (Client)
- **Framework:** React + Vite
- **Styling:** Tailwind CSS + Glassmorphism UI
- **Routing:** React Router DOM
- **Data Fetching & State:** TanStack React Query (`@tanstack/react-query`) + Context API
- **Charting:** Recharts (responsive, customizable SVG charts)
- **Icons:** Lucide React
- **Data Parsing:** PapaParse (CSV) + SheetJS (XLSX)

### Backend (API)
- **Framework:** Node.js + Express
- **Storage:** In-memory mapped file store (designed to connect to PostgreSQL/Supabase)
- **AI Integration:** RAG orchestration middleware designed for LangChain + ChromaDB (with local heuristics fallback)
- **Deployment:** Vercel (Frontend) + Render (Backend API)

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- Node.js (v18+)
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/naveen123-naik/Insight.git
cd Insight
```

### 2. Setup the Backend
```bash
cd backend
npm install
npm run dev
```
*The backend API will start on http://localhost:5000*

### 3. Setup the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
*The frontend React app will start on http://localhost:5173*

---

## 🌐 Environment Variables

**Frontend (`frontend/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
# In production on Vercel, this should point to your Render backend:
# VITE_API_URL=https://insight-1-vf6e.onrender.com/api
```

**Backend (`backend/.env`):**
```env
PORT=5000
AI_SERVICE_URL=http://localhost:8000
JWT_SECRET=your_jwt_secret_here
```

---

## 📝 License
This project is proprietary and built by Naveen. All rights reserved.
