import React, { useEffect, useState } from 'react';
import { fetchCustomers, fetchSalesIntelligence } from '../services/api';
import { HeartHandshake, Crown, Clock, TrendingUp, Search } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import './Dashboard.css';

const CRM = () => {
  const [customers, setCustomers] = useState(null);
  const [intelligence, setIntelligence] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [custData, intelData] = await Promise.all([
          fetchCustomers(),
          fetchSalesIntelligence()
        ]);
        setCustomers(custData);
        setIntelligence(intelData);
      } catch (e) {
        console.error('Failed to load CRM data', e);
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
        <p>Loading Customer Intelligence...</p>
      </div>
    );
  }

  const filteredCustomers = customers?.customers?.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getTier = (spend) => {
    if (spend >= 50000) return { label: 'Platinum', color: '#e5e4e2' };
    if (spend >= 20000) return { label: 'Gold', color: '#f59e0b' };
    if (spend >= 5000) return { label: 'Silver', color: '#94a3b8' };
    return { label: 'Bronze', color: '#cd7f32' };
  };

  // Peak hours chart
  const hoursChart = intelligence?.peak_hours?.map(h => ({
    name: `${h.hour}:00`,
    transactions: h.tx
  })) || [];

  // Weekday chart
  const weekdayChart = intelligence?.weekdays?.map(w => ({
    name: w.day?.substring(0, 3),
    transactions: w.tx,
    avg_sale: Math.round(w.avg)
  })) || [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">CRM & Loyalty Program</h1>
        <div className="date-badge">
          <HeartHandshake size={14} style={{ marginRight: 6 }} />
          {filteredCustomers.length} Customers Tracked
        </div>
      </div>

      {/* KPIs */}
      <div className="grid-cards kpi-grid">
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Total Customers</h3>
            <HeartHandshake size={20} color="#3b82f6" />
          </div>
          <h2 className="stat-value">{customers?.customers?.length || 0}</h2>
        </div>
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Top Customer Spend</h3>
            <Crown size={20} color="#f59e0b" />
          </div>
          <h2 className="stat-value">E£ {(customers?.customers?.[0]?.lifetime_spend || 0).toLocaleString()}</h2>
          <div className="stat-footer">
            <span className="text-muted">{customers?.customers?.[0]?.name || 'N/A'}</span>
          </div>
        </div>
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Peak Hour</h3>
            <Clock size={20} color="#00d4a8" />
          </div>
          <h2 className="stat-value">
            {hoursChart.length > 0 ? hoursChart.reduce((max, h) => h.transactions > max.transactions ? h : max, hoursChart[0]).name : 'N/A'}
          </h2>
          <div className="stat-footer">
            <span className="text-muted">Busiest hour (30-day average)</span>
          </div>
        </div>
      </div>

      <div className="dashboard-main-content">
        {/* Peak Hours Chart */}
        <div className="card chart-card glass">
          <div className="card-header">
            <h3>Peak Hours (Last 30 Days)</h3>
            <span className="badge-primary">Footfall Analysis</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hoursChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={10} />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="transactions" name="Transactions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Weekday Patterns */}
        <div className="card chart-card glass">
          <div className="card-header">
            <h3>Weekday Sales Patterns</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weekdayChart} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="transactions" name="Transactions" stroke="#00d4a8" strokeWidth={2} />
              <Line type="monotone" dataKey="avg_sale" name="Avg Sale (E£)" stroke="#f59e0b" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Customer List */}
      <div className="card glass" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h3><Crown size={18} style={{ marginRight: 8 }} />Customer Loyalty Rankings</h3>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Search size={16} color="rgba(255,255,255,0.4)" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.9rem' }}
            />
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Customer</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Tier</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Visits</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Lifetime Spend</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Avg Basket</th>
                <th style={{ padding: '10px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Last Visit</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.slice(0, 25).map((c, idx) => {
                const tier = getTier(c.lifetime_spend);
                return (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{ background: `${tier.color}22`, color: tier.color, padding: '2px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 }}>
                        {tier.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px' }}>{c.visits}</td>
                    <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#00d4a8' }}>E£ {c.lifetime_spend.toLocaleString()}</td>
                    <td style={{ padding: '10px 12px' }}>E£ {Math.round(c.avg_basket).toLocaleString()}</td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>{c.last_visit}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CRM;
