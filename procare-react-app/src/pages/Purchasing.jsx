import React, { useEffect, useState } from 'react';
import { fetchPurchases, fetchSuppliers } from '../services/api';
import { ShoppingCart, Truck, Calendar, DollarSign } from 'lucide-react';
import '../pages/Dashboard.css'; // Reuse glassmorphism styling

const Purchasing = () => {
  const [purchases, setPurchases] = useState(null);
  const [suppliers, setSuppliers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [purchaseData, supplierData] = await Promise.all([
          fetchPurchases(),
          fetchSuppliers()
        ]);
        setPurchases(purchaseData?.purchases || []);
        setSuppliers(supplierData?.suppliers || []);
      } catch (error) {
        console.error("Error loading purchasing data", error);
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
        <p>Loading Purchasing Intelligence...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="page-title">Purchasing & Vendors</h1>
      </div>

      <div className="dashboard-main-content">
        {/* Recent Purchases */}
        <div className="card glass">
          <div className="card-header">
            <h3><ShoppingCart size={18} style={{marginRight: '8px'}}/> Recent Purchases (Last 7 Days)</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Date</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Bills</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px' }}><div className="flex-center"><Calendar size={14}/> {p.day}</div></td>
                    <td style={{ padding: '12px' }}>{p.bills}</td>
                    <td style={{ padding: '12px', fontWeight: 'bold' }}>E£ {p.total.toLocaleString()}</td>
                  </tr>
                ))}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No recent purchases found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Suppliers */}
        <div className="card glass">
          <div className="card-header">
            <h3><Truck size={18} style={{marginRight: '8px'}}/> Top Suppliers</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Supplier Name</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Total Spend</th>
                  <th style={{ padding: '12px', color: 'var(--text-muted)' }}>Last Order</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((s, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '12px' }}>{s.name}</td>
                    <td style={{ padding: '12px', color: 'var(--primary-color)', fontWeight: 'bold' }}>E£ {s.total_spend.toLocaleString()}</td>
                    <td style={{ padding: '12px' }}><div className="flex-center"><Calendar size={14}/> {s.last_order || 'N/A'}</div></td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan="3" style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>No suppliers data found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Purchasing;
