import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, FileText, ShoppingBag, PieChart, ShieldAlert } from 'lucide-react';

const API_URL = '/api';

const Reports = () => {
  const [activeReport, setActiveReport] = useState('sales'); // sales, purchases, profit, stock, expiry
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '';
      if (activeReport === 'sales') endpoint = '/reports/sales?period=daily';
      else if (activeReport === 'purchases') endpoint = '/reports/purchases?period=daily';
      else if (activeReport === 'profit') endpoint = '/reports/profit';
      else if (activeReport === 'stock') endpoint = '/reports/stock';
      else if (activeReport === 'expiry') endpoint = '/reports/expiry';

      const res = await axios.get(`${API_URL}${endpoint}`, { headers });
      setReportData(res.data);
    } catch (err) {
      setError(`Failed to generate ${activeReport} analytics report.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  return (
    <div>
      <div className="flex-header-responsive">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Operational Reports & Analytics</h2>
          <p style={{ color: 'var(--text-muted)' }}>Generate audit audits, sales profit logs, and expiry projections</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Navigation Controls */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {[
          { key: 'sales', label: 'Sales Logs', icon: FileText },
          { key: 'purchases', label: 'Purchase Logs', icon: ShoppingBag },
          { key: 'profit', label: 'Profit & Loss', icon: DollarSign },
          { key: 'stock', label: 'Stock Valuation', icon: PieChart },
          { key: 'expiry', label: 'Expiry Forecast', icon: ShieldAlert }
        ].map((btn) => {
          const Icon = btn.icon;
          const isActive = activeReport === btn.key;
          return (
            <button 
              key={btn.key}
              onClick={() => { setActiveReport(btn.key); setReportData(null); }}
              className="btn"
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                backgroundColor: isActive ? 'var(--primary)' : 'white',
                color: isActive ? 'white' : 'var(--text)',
                border: '1px solid var(--border)'
              }}
            >
              <Icon size={16} />
              <span>{btn.label}</span>
            </button>
          );
        })}
      </div>

      {/* REPORT CONTENT PANEL */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Generating report metrics...</p>
      ) : !reportData ? (
        <p style={{ color: 'var(--text-muted)' }}>No report data loaded.</p>
      ) : (
        <div className="card" style={{ padding: '1.5rem' }}>
          {/* Sales Report */}
          {activeReport === 'sales' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Daily Sales Log</h3>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
                      <th style={{ padding: '0.75rem' }}>Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Invoices Checkouts</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Tax collected</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{new Date(row.period).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{row.transactions}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{parseFloat(row.gst || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: 'var(--success)' }}>₹{parseFloat(row.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Purchase Report */}
          {activeReport === 'purchases' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Daily Purchase Log</h3>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
                      <th style={{ padding: '0.75rem' }}>Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Purchase Orders</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Tax paid</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Expenses</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{new Date(row.period).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{row.count}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{parseFloat(row.gst || 0).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: 'var(--danger)' }}>₹{parseFloat(row.total || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Profit & Loss Report */}
          {activeReport === 'profit' && (
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Profit and Loss Ledger</h3>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
                      <th style={{ padding: '0.75rem' }}>Date</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Revenue Receipts</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>COGS (Cost of Goods)</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Gross Profit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{new Date(row.date).toLocaleDateString()}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{parseFloat(row.revenue).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{parseFloat(row.cost).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600', color: parseFloat(row.profit) >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                          ₹{parseFloat(row.profit).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stock Valuation Report */}
          {activeReport === 'stock' && (
            <div>
              <div className="responsive-grid-3" style={{ marginBottom: '1.5rem' }}>
                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Aggregate Quantity</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem' }}>{reportData.summary?.totalItems} Units</div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cost Assets Value</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem', color: 'var(--primary)' }}>₹{reportData.summary?.totalAssetValue.toFixed(2)}</div>
                </div>
                <div style={{ padding: '1rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Retail Revenue Value</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '700', marginTop: '0.25rem', color: 'var(--success)' }}>₹{reportData.summary?.totalRetailValue.toFixed(2)}</div>
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem' }}>Valuation by Categories</h3>
              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
                      <th style={{ padding: '0.75rem' }}>Category</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Unique Medicines</th>
                      <th style={{ padding: '0.75rem', textAlign: 'center' }}>Stock Volume</th>
                      <th style={{ padding: '0.75rem', textAlign: 'right' }}>Asset Cost Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.categories?.map((cat, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{cat.category || 'General'}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{cat.unique_medicines}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>{cat.total_stock}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>₹{parseFloat(cat.asset_value || 0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Expiry Report */}
          {activeReport === 'expiry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--danger)' }}>Expired Stock (Immediate Disposal Required)</h3>
                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
                        <th style={{ padding: '0.75rem' }}>Medicine</th>
                        <th style={{ padding: '0.75rem' }}>Batch Number</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Quantity</th>
                        <th style={{ padding: '0.75rem' }}>Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.expired?.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No expired stocks found. Good job!</td>
                        </tr>
                      ) : (
                        reportData.expired?.map((b) => (
                          <tr key={b.id} style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: '500' }}>{b.medicine_name}</td>
                            <td style={{ padding: '0.75rem' }}>{b.batch_number}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--danger)', fontWeight: '600' }}>{b.quantity}</td>
                            <td style={{ padding: '0.75rem', color: 'var(--danger)', fontWeight: '500' }}>{b.expiry_date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', color: 'var(--warning)' }}>Near Expiry Warning (Expiring next 60 days)</h3>
                <div className="table-responsive">
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
                        <th style={{ padding: '0.75rem' }}>Medicine</th>
                        <th style={{ padding: '0.75rem' }}>Batch Number</th>
                        <th style={{ padding: '0.75rem', textAlign: 'center' }}>Quantity</th>
                        <th style={{ padding: '0.75rem' }}>Expiry Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.expiringSoon?.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)' }}>No batches expiring within 60 days.</td>
                        </tr>
                      ) : (
                        reportData.expiringSoon?.map((b) => (
                          <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.75rem', fontWeight: '500' }}>{b.medicine_name}</td>
                            <td style={{ padding: '0.75rem' }}>{b.batch_number}</td>
                            <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: '600' }}>{b.quantity}</td>
                            <td style={{ padding: '0.75rem', color: 'var(--warning)', fontWeight: '500' }}>{b.expiry_date}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Reports;
