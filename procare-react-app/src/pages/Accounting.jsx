import React, { useEffect, useState } from 'react';
import { fetchDailyAccounts, fetchGeneralAccounts, fetchTreasury } from '../services/api';
import { Wallet, TrendingUp, TrendingDown, Landmark, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';
import './Dashboard.css';

const Accounting = () => {
  const [daily, setDaily] = useState(null);
  const [general, setGeneral] = useState(null);
  const [treasury, setTreasury] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dailyData, genData, treasuryData] = await Promise.all([
          fetchDailyAccounts(),
          fetchGeneralAccounts(),
          fetchTreasury()
        ]);
        setDaily(dailyData);
        setGeneral(genData);
        setTreasury(treasuryData);
      } catch (e) {
        console.error('Failed to load accounting data', e);
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
        <p>Loading Financial Intelligence...</p>
      </div>
    );
  }

  // P&L chart data
  const pnlChart = general?.monthly_pnl?.map(m => ({
    name: m.month,
    Revenue: m.revenue,
    Purchases: m.purchases,
    Gross: m.gross
  })) || [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">Accounting & Cash Flow</h1>
        <div className="date-badge">
          <Wallet size={14} style={{ marginRight: 6 }} />
          Treasury: E£ {(treasury?.grand_total || 0).toLocaleString()}
        </div>
      </div>

      {/* Treasury KPIs */}
      <div className="grid-cards kpi-grid">
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Grand Total Treasury</h3>
            <Landmark size={20} color="#00d4a8" />
          </div>
          <h2 className="stat-value">E£ {(treasury?.grand_total || 0).toLocaleString()}</h2>
        </div>
        {treasury?.branches?.map((branch, idx) => (
          <div key={idx} className="card stat-card glass">
            <div className="stat-header">
              <h3 className="text-muted">{branch.branch}</h3>
              <Wallet size={20} color="#3b82f6" />
            </div>
            <h2 className="stat-value">E£ {branch.total.toLocaleString()}</h2>
            <div className="stat-footer">
              <span className="text-muted">{branch.accounts?.length || 0} accounts</span>
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-main-content">
        {/* Monthly P&L Chart */}
        <div className="card chart-card glass">
          <div className="card-header">
            <h3>Monthly Revenue vs. Purchases (6 Months)</h3>
            <span className="badge-primary">P&L Overview</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pnlChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value) => `E£ ${value.toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="Revenue" fill="#00d4a8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Purchases" fill="#ff4d6d" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Today's Cash Movements */}
        <div className="card glass">
          <div className="card-header">
            <h3>Today's Financial Movements</h3>
          </div>
          {daily?.today_movements?.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {daily.today_movements.map((m, idx) => (
                <div key={idx} style={{ padding: '0.7rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {m.total >= 0 ? <ArrowUpRight size={16} color="#00d4a8" /> : <ArrowDownRight size={16} color="#ff4d6d" />}
                    <span style={{ fontSize: '0.9rem' }}>{m.type}</span>
                    <span className="text-muted" style={{ fontSize: '0.8rem' }}>({m.count}x)</span>
                  </div>
                  <span style={{ fontWeight: 700, color: m.total >= 0 ? '#00d4a8' : '#ff4d6d' }}>
                    E£ {Math.abs(m.total).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted" style={{ padding: '2rem', textAlign: 'center' }}>No movements recorded today yet.</div>
          )}
        </div>
      </div>

      {/* Daily Sales Summary */}
      <div className="card glass" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3>Last 7 Days — Daily Sales</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Date</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Transactions</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Sales</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Discounts</th>
              </tr>
            </thead>
            <tbody>
              {daily?.daily_summary?.map((d, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '10px 12px' }}>{d.date}</td>
                  <td style={{ padding: '10px 12px' }}>{d.tx}</td>
                  <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#00d4a8' }}>E£ {d.sales.toLocaleString()}</td>
                  <td style={{ padding: '10px 12px', color: '#f59e0b' }}>E£ {d.discounts.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Accounting;
