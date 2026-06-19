import React, { useEffect, useState } from 'react';
import { fetchProducts, fetchExpiry, fetchWarehouses } from '../services/api';
import { Package, AlertTriangle, Info, Search, Warehouse, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const Inventory = () => {
  const [products, setProducts] = useState(null);
  const [expiry, setExpiry] = useState(null);
  const [warehouse, setWarehouse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [prodData, expData, whData] = await Promise.all([
          fetchProducts(),
          fetchExpiry(),
          fetchWarehouses()
        ]);
        setProducts(prodData);
        setExpiry(expData);
        setWarehouse(whData);
      } catch (e) {
        console.error('Failed to load inventory', e);
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
        <p>Loading Inventory Intelligence...</p>
      </div>
    );
  }

  const filteredProducts = products?.products?.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const marginChartData = filteredProducts.slice(0, 15).map(p => ({
    name: (p.name || '').substring(0, 20),
    margin: p.margin_pct,
    stock: p.stock
  }));

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">Unified Inventory</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="date-badge">
            <Warehouse size={14} style={{ marginRight: 6 }} />
            {products?.stats?.total || 0} Active SKUs
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid-cards kpi-grid">
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Total SKUs</h3>
            <Package size={20} color="#3b82f6" />
          </div>
          <h2 className="stat-value">{products?.stats?.total?.toLocaleString() || 0}</h2>
        </div>
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Zero Stock Items</h3>
            <AlertTriangle size={20} color="#ff4d6d" />
          </div>
          <h2 className="stat-value">{products?.stats?.zero_stock?.toLocaleString() || 0}</h2>
        </div>
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Avg Margin</h3>
            <TrendingUp size={20} color="#00d4a8" />
          </div>
          <h2 className="stat-value">{products?.stats?.avg_margin || 0}%</h2>
        </div>
        <div className="card stat-card glass">
          <div className="stat-header">
            <h3 className="text-muted">Stock Value (Cost)</h3>
            <Package size={20} color="#f59e0b" />
          </div>
          <h2 className="stat-value">E£ {(warehouse?.stats?.cost_value || 0).toLocaleString()}</h2>
        </div>
      </div>

      {/* Expiry Alerts */}
      {expiry?.items?.length > 0 && (
        <div className="card glass" style={{ borderLeft: '4px solid #ff4d6d', marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3><AlertTriangle size={18} color="#ff4d6d" style={{ marginRight: 8 }} />Expiry Alerts (Next 60 Days)</h3>
            <span className="badge-primary" style={{ background: 'rgba(255,77,109,0.15)', color: '#ff4d6d', borderColor: 'rgba(255,77,109,0.3)' }}>
              {expiry.items.length} items
            </span>
          </div>
          <div style={{ overflowX: 'auto', maxHeight: '200px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Product</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Expiry Date</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Days Left</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: 'var(--text-muted)' }}>Qty</th>
                </tr>
              </thead>
              <tbody>
                {expiry.items.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '8px 12px' }}>{item.name_ar || item.name_en}</td>
                    <td style={{ padding: '8px 12px' }}>{item.exp_date}</td>
                    <td style={{ padding: '8px 12px', color: item.urgent ? '#ff4d6d' : '#f59e0b', fontWeight: 'bold' }}>{item.days_left}d</td>
                    <td style={{ padding: '8px 12px' }}>{item.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="dashboard-main-content">
        {/* Product Margin Chart */}
        <div className="card chart-card glass">
          <div className="card-header">
            <h3>Top Products by Margin %</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={marginChartData} margin={{ top: 10, right: 30, left: 0, bottom: 60 }}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" stroke="rgba(255,255,255,0.4)" fontSize={10} />
              <YAxis stroke="rgba(255,255,255,0.4)" />
              <RechartsTooltip
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="margin" name="Margin %" fill="#00d4a8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Product Search & List */}
        <div className="card glass">
          <div className="card-header">
            <h3><Package size={18} style={{ marginRight: 8 }} />Products</h3>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.04)', padding: '0.6rem 1rem', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Search size={16} color="rgba(255,255,255,0.4)" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {filteredProducts.slice(0, 20).map((p, idx) => (
              <div key={idx} style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>{p.name}</div>
                  <div className="text-muted" style={{ fontSize: '0.8rem' }}>Stock: {p.stock} | Buy: E£{p.buy_price}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: '#00d4a8' }}>E£{p.sell_price}</div>
                  <div style={{ fontSize: '0.75rem', color: p.margin_pct > 20 ? '#00d4a8' : '#f59e0b' }}>{p.margin_pct}% margin</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Inventory;
