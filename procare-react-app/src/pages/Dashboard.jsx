import React, { useEffect, useState } from 'react';
import { fetchSummary, fetchWeekly, fetchBranches } from '../services/api';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, Users, DollarSign, Package, AlertTriangle } from 'lucide-react';
import './Dashboard.css'; // Let's make sure we have a CSS file for the dashboard styling

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [branches, setBranches] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [sumData, weekData, branchData] = await Promise.all([
          fetchSummary(),
          fetchWeekly(),
          fetchBranches()
        ]);
        setSummary(sumData);
        setWeekly(weekData);
        setBranches(branchData);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading Intelligence Data...</p>
      </div>
    );
  }

  if (!summary) {
    return <div className="error-container">Failed to load dashboard data. Ensure backend is running.</div>;
  }

  // Format chart data
  const chartData = weekly?.days?.map((day, i) => ({
    name: day.substring(5), // MM-DD
    sales: weekly.sales[i],
    transactions: weekly.transactions[i]
  })) || [];

  const COLORS = ['#00d4a8', '#ff4d6d', '#3b82f6', '#f59e0b'];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">Analytics Dashboard</h1>
        <div className="date-badge">Generated At: {summary.generated_at}</div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid-cards kpi-grid">
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Today's Sales</h3>
            <DollarSign size={20} color="#00d4a8" />
          </div>
          <h2 className="stat-value">E£ {summary.today_sales?.toLocaleString() || '0'}</h2>
          <div className="stat-footer">
            {summary.pct_vs_yesterday > 0 ? (
              <span className="text-success flex-center"><TrendingUp size={14}/> +{summary.pct_vs_yesterday}% vs yesterday</span>
            ) : (
              <span className="text-danger flex-center"><TrendingDown size={14}/> {summary.pct_vs_yesterday}% vs yesterday</span>
            )}
          </div>
        </div>

        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Transactions</h3>
            <Package size={20} color="#3b82f6" />
          </div>
          <h2 className="stat-value">{summary.today_tx?.toLocaleString() || '0'}</h2>
          <div className="stat-footer">
            <span className="text-muted">Daily Total</span>
          </div>
        </div>

        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Customers</h3>
            <Users size={20} color="#f59e0b" />
          </div>
          <h2 className="stat-value">{summary.today_customers?.toLocaleString() || '0'}</h2>
          <div className="stat-footer">
            <span className="text-muted">Unique daily visits</span>
          </div>
        </div>

        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Expiry Alerts</h3>
            <AlertTriangle size={20} color="#ff4d6d" />
          </div>
          <h2 className="stat-value">{summary.expiry_alerts || '0'}</h2>
          <div className="stat-footer">
            <span className="text-danger">Action Required</span>
          </div>
        </div>
      </div>

      <div className="dashboard-main-content">
        {/* Main Chart */}
        <div className="card chart-card glass">
          <div className="card-header">
            <h3>Weekly Sales Trend</h3>
            <span className="badge-primary">Last 7 Days</span>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend />
                <Line type="monotone" dataKey="sales" name="Sales (E£)" stroke="#00d4a8" strokeWidth={3} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Branch Share */}
        <div className="card chart-card glass">
          <div className="card-header">
            <h3>Branch Performance</h3>
          </div>
          <div className="chart-wrapper flex-center-all">
            {branches && branches.branches ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={branches.branches}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="total"
                    nameKey="name"
                  >
                    {branches.branches.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    formatter={(value) => `E£ ${value.toLocaleString()}`}
                  />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-muted">No branch data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
