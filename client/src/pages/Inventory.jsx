import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, ShieldAlert, AlertTriangle, History, ArrowUpDown, ChevronDown, ChevronRight, X } from 'lucide-react';

const API_URL = '/api';

const Inventory = () => {
  const [stock, setStock] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [expiryBatches, setExpiryBatches] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const [expandedMed, setExpandedMed] = useState(null);
  const [batches, setBatches] = useState({});
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustData, setAdjustData] = useState({
    medicine_id: '',
    medicine_name: '',
    adjustment_type: 'Add',
    quantity: '',
    notes: ''
  });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchStock = async () => {
    setLoading(true);
    try {
      const allRes = await axios.get(`${API_URL}/inventory`, { headers });
      setStock(allRes.data);

      const lowRes = await axios.get(`${API_URL}/inventory/low-stock`, { headers });
      setLowStock(lowRes.data);

      const expiryRes = await axios.get(`${API_URL}/inventory/near-expiry?days=60`, { headers });
      setExpiryBatches(expiryRes.data);
    } catch (err) {
      setError('Failed to fetch inventory records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleToggleBatches = async (medId) => {
    if (expandedMed === medId) {
      setExpandedMed(null);
      return;
    }

    setExpandedMed(medId);
    if (!batches[medId]) {
      try {
        const res = await axios.get(`${API_URL}/inventory/batches/${medId}`, { headers });
        setBatches({ ...batches, [medId]: res.data });
      } catch (err) {
        setError('Error fetching batch breakdown.');
      }
    }
  };

  const handleOpenAdjust = (item) => {
    setAdjustData({
      medicine_id: item.medicine_id,
      medicine_name: item.medicine_name,
      adjustment_type: 'Add',
      quantity: '',
      notes: ''
    });
    setError('');
    setMessage('');
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await axios.post(`${API_URL}/inventory/adjust`, {
        medicine_id: adjustData.medicine_id,
        adjustment_type: adjustData.adjustment_type,
        quantity: parseInt(adjustData.quantity),
        notes: adjustData.notes
      }, { headers });

      setMessage(res.data.message);
      setShowAdjustModal(false);
      fetchStock();
    } catch (err) {
      setError(err.response?.data?.message || 'Error updating stock adjustment.');
    }
  };

  const getFilteredData = () => {
    if (activeTab === 'low') return lowStock;
    if (activeTab === 'expiry') return expiryBatches;
    return stock;
  };

  return (
    <div>
      <div className="flex-header-responsive">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Inventory & Stock Control</h2>
          <p style={{ color: 'var(--text-muted)' }}>Monitor levels, batch details, and adjustments</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
          {message}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('all')} 
          style={{ 
            padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'all' ? '2px solid var(--primary)' : 'none',
            color: activeTab === 'all' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: activeTab === 'all' ? '600' : '500'
          }}
        >
          All Stock ({stock.length})
        </button>
        <button 
          onClick={() => setActiveTab('low')} 
          style={{ 
            padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'low' ? '2px solid var(--danger)' : 'none',
            color: activeTab === 'low' ? 'var(--danger)' : 'var(--text-muted)',
            fontWeight: activeTab === 'low' ? '600' : '500',
            display: 'flex', alignItems: 'center', gap: '0.25rem'
          }}
        >
          <AlertTriangle size={16} /> Low Stock ({lowStock.length})
        </button>
        <button 
          onClick={() => setActiveTab('expiry')} 
          style={{ 
            padding: '0.5rem 1rem', background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'expiry' ? '2px solid var(--warning)' : 'none',
            color: activeTab === 'expiry' ? 'var(--warning)' : 'var(--text-muted)',
            fontWeight: activeTab === 'expiry' ? '600' : '500',
            display: 'flex', alignItems: 'center', gap: '0.25rem'
          }}
        >
          <ShieldAlert size={16} /> Near Expiry ({expiryBatches.length})
        </button>
      </div>

      {/* Data Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
              <th style={{ padding: '1rem', width: '40px' }}></th>
              <th style={{ padding: '1rem' }}>Medicine</th>
              <th style={{ padding: '1rem' }}>Generic Name</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Current Stock</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Min Stock</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Reorder level</th>
              {activeTab === 'expiry' && <th style={{ padding: '1rem' }}>Exp Date</th>}
              <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading inventory records...</td>
              </tr>
            ) : getFilteredData().length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No stock alerts or records under this category.</td>
              </tr>
            ) : (
              getFilteredData().map((item) => {
                const isLow = item.current_stock <= 1;
                return (
                  <React.Fragment key={item.id}>
                    <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: isLow ? 'rgba(239, 68, 68, 0.02)' : 'transparent' }}>
                      <td style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleToggleBatches(item.medicine_id)}>
                        {expandedMed === item.medicine_id ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </td>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>
                        {item.medicine_name || item.name}
                        {isLow && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>Low Stock</span>}
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{item.generic_name}</td>
                      <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600', color: isLow ? 'var(--danger)' : 'var(--text)' }}>{item.current_stock}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>{item.minimum_stock}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>{item.reorder_level}</td>
                      {activeTab === 'expiry' && <td style={{ padding: '1rem', color: 'var(--warning)', fontWeight: '500' }}>{item.expiry_date}</td>}
                      <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                        <button onClick={() => handleOpenAdjust(item)} className="btn" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', color: 'rgb(79, 70, 229)' }}>
                          <ArrowUpDown size={14} style={{ marginRight: '0.25rem' }} /> Adjust
                        </button>
                      </td>
                    </tr>

                    {/* Collapsible Batch View */}
                    {expandedMed === item.medicine_id && (
                      <tr>
                        <td colSpan="8" style={{ backgroundColor: 'var(--background)', padding: '1rem 2rem' }}>
                          <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '1rem' }}>
                            <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>Active Batches</h4>
                            {batches[item.medicine_id]?.length === 0 ? (
                              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>No batch records found. Create a purchase invoice to record batches.</p>
                            ) : (
                              <div className="table-responsive">
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                  <thead>
                                    <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                                      <th style={{ padding: '0.5rem' }}>Batch Number</th>
                                      <th style={{ padding: '0.5rem' }}>Expiry Date</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Quantity</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Purchase Rate</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>Selling Price</th>
                                      <th style={{ padding: '0.5rem', textAlign: 'right' }}>MRP</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {batches[item.medicine_id]?.map((b) => (
                                      <tr key={b.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '0.5rem', fontWeight: '500' }}>{b.batch_number}</td>
                                        <td style={{ padding: '0.5rem' }}>{b.expiry_date}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '600' }}>{b.quantity}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>₹{b.purchase_rate}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>₹{b.selling_price}</td>
                                        <td style={{ padding: '0.5rem', textAlign: 'right' }}>₹{b.mrp}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="modal-wrapper">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Manual Stock Adjustment</h3>
              <button onClick={() => setShowAdjustModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleAdjustSubmit}>
              <div style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                <strong>Medicine:</strong> {adjustData.medicine_name}
              </div>

              <div className="input-group">
                <label className="input-label">Adjustment Type</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="adjustment_type" 
                      value="Add" 
                      checked={adjustData.adjustment_type === 'Add'} 
                      onChange={(e) => setAdjustData({ ...adjustData, adjustment_type: e.target.value })}
                    />
                    Add (+ Stock)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="adjustment_type" 
                      value="Subtract" 
                      checked={adjustData.adjustment_type === 'Subtract'} 
                      onChange={(e) => setAdjustData({ ...adjustData, adjustment_type: e.target.value })}
                    />
                    Subtract (- Stock)
                  </label>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Quantity Adjustment</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={adjustData.quantity} 
                  onChange={(e) => setAdjustData({ ...adjustData, quantity: e.target.value })}
                  required 
                  min="1"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Adjustment Notes / Justification</label>
                <textarea 
                  className="input-field" 
                  value={adjustData.notes} 
                  onChange={(e) => setAdjustData({ ...adjustData, notes: e.target.value })}
                  required
                  style={{ minHeight: '80px', fontFamily: 'inherit' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setShowAdjustModal(false)} className="btn" style={{ backgroundColor: '#f1f5f9' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Apply Adjustment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
