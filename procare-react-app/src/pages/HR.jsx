import React, { useEffect, useState } from 'react';
import { fetchStaff } from '../services/api';
import { Users, Award, Clock, UserCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const HR = () => {
  const [staff, setStaff] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const data = await fetchStaff();
        setStaff(data);
      } catch (e) {
        console.error('Failed to load HR data', e);
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
        <p>Loading HR & Employee Data...</p>
      </div>
    );
  }

  const cashierChart = staff?.cashier_performance?.map(c => ({
    name: `Cashier ${c.id}`,
    total: c.total,
    tx: c.tx
  })) || [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">HR & Employees</h1>
        <div className="date-badge">
          <Users size={14} style={{ marginRight: 6 }} />
          {staff?.staff_count || 0} Staff Members
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-cards kpi-grid">
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Total Staff</h3>
            <Users size={20} color="#3b82f6" />
          </div>
          <h2 className="stat-value">{staff?.staff_count || 0}</h2>
        </div>
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Top Cashier Revenue</h3>
            <Award size={20} color="#f59e0b" />
          </div>
          <h2 className="stat-value">E£ {(cashierChart[0]?.total || 0).toLocaleString()}</h2>
          <div className="stat-footer">
            <span className="text-muted">{cashierChart[0]?.name || 'N/A'} — Last 30 days</span>
          </div>
        </div>
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Total Transactions</h3>
            <UserCheck size={20} color="#00d4a8" />
          </div>
          <h2 className="stat-value">{cashierChart.reduce((s, c) => s + c.tx, 0).toLocaleString()}</h2>
          <div className="stat-footer">
            <span className="text-muted">All cashiers — Last 30 days</span>
          </div>
        </div>
      </div>

      <div className="dashboard-main-content">
        {/* Cashier Performance Chart */}
        <div className="card chart-card glass">
          <div className="card-header">
            <h3>Cashier Performance (Last 30 Days)</h3>
            <span className="badge-primary">By Revenue</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cashierChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
                formatter={(value) => `E£ ${value.toLocaleString()}`}
              />
              <Bar dataKey="total" name="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Staff Schedule */}
        <div className="card glass">
          <div className="card-header">
            <h3><Clock size={18} style={{ marginRight: 8 }} />Shift Scheduling</h3>
          </div>
          <div style={{ padding: '0.5rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '0.5rem' }}>
            <div className="text-muted" style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>🕌 Prayer-time aware scheduling (Cairo)</div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <strong>Morning Shift</strong>
              <span className="text-success">08:00 — 16:00</span>
            </div>
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>
              Breaks: Dhuhr (12:00) — 30 min | Asr (15:00) — 15 min
            </div>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <strong>Evening Shift</strong>
              <span className="text-warning">16:00 — 00:00</span>
            </div>
            <div className="text-muted" style={{ fontSize: '0.85rem' }}>
              Breaks: Maghrib (18:00) — 30 min | Isha (19:30) — 15 min
            </div>
          </div>
          <div style={{ background: 'rgba(59,130,246,0.08)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(59,130,246,0.2)' }}>
            <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 600, marginBottom: '0.3rem' }}>📅 Weekend: Friday — Saturday</div>
            <div className="text-muted" style={{ fontSize: '0.8rem' }}>Ramadan: Working hours reduced 2h, shifts adjusted.</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HR;
