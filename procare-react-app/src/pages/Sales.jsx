import React, { useState } from 'react';
import { DollarSign, TrendingUp, ShoppingBag, CreditCard, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock sales data
  const mockTransactions = [
    { id: '#TRX-001', time: '10:42 AM', items: 3, total: 450, method: 'Card', status: 'Completed' },
    { id: '#TRX-002', time: '11:05 AM', items: 1, total: 120, method: 'Cash', status: 'Completed' },
    { id: '#TRX-003', time: '11:15 AM', items: 5, total: 890, method: 'Card', status: 'Completed' },
    { id: '#TRX-004', time: '11:30 AM', items: 2, total: 65, method: 'Cash', status: 'Completed' },
  ];

  const salesData = [
    { time: '08:00', amount: 1200 },
    { time: '10:00', amount: 3400 },
    { time: '12:00', amount: 5600 },
    { time: '14:00', amount: 4100 },
    { time: '16:00', amount: 7800 },
    { time: '18:00', amount: 6200 },
  ];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">Live Sales & Transactions</h1>
        <div className="date-badge">
          <DollarSign size={14} style={{ marginRight: 6 }} />
          Today's Overview
        </div>
      </div>

      <div className="grid-cards kpi-grid">
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Today's Revenue</h3>
            <DollarSign size={20} color="#00d4a8" />
          </div>
          <h2 className="stat-value">E£ 28,365</h2>
        </div>
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Transactions</h3>
            <ShoppingBag size={20} color="#3b82f6" />
          </div>
          <h2 className="stat-value">142</h2>
        </div>
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Avg Basket Size</h3>
            <TrendingUp size={20} color="#f59e0b" />
          </div>
          <h2 className="stat-value">E£ 199</h2>
        </div>
      </div>

      <div className="dashboard-main-content">
        <div className="card chart-card glass">
          <div className="card-header">
            <h3>Hourly Sales Trend</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none' }} itemStyle={{ color: '#00d4a8' }} />
              <Bar dataKey="amount" fill="#00d4a8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card glass">
          <div className="card-header">
            <h3>Recent Transactions</h3>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '0.4rem 0.8rem', borderRadius: '8px' }}>
              <Search size={14} color="rgba(255,255,255,0.4)" style={{ marginRight: '8px' }} />
              <input type="text" placeholder="Search TRX ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.9rem' }} />
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '12px' }}>Transaction ID</th>
                <th style={{ padding: '12px' }}>Time</th>
                <th style={{ padding: '12px' }}>Items</th>
                <th style={{ padding: '12px' }}>Method</th>
                <th style={{ padding: '12px' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {mockTransactions.filter(t => t.id.toLowerCase().includes(searchTerm.toLowerCase())).map((trx, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{trx.id}</td>
                  <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{trx.time}</td>
                  <td style={{ padding: '12px' }}>{trx.items}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {trx.method === 'Card' ? <CreditCard size={14} color="#3b82f6" /> : <DollarSign size={14} color="#00d4a8" />}
                      {trx.method}
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: '#00d4a8', fontWeight: 'bold' }}>E£ {trx.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Sales;
