import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Eye, History, UploadCloud, CheckCircle, Trash2, X, AlertCircle } from 'lucide-react';

const API_URL = '/api';

const Purchases = () => {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // list, create
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Creation Form State
  const [supplierId, setSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [purchaseItems, setPurchaseItems] = useState([]);
  const [newItem, setNewItem] = useState({
    medicine_id: '',
    batch_number: '',
    manufacturing_date: '',
    expiry_date: '',
    quantity: '',
    purchase_rate: '',
    selling_price: '',
    mrp: '',
    gst_rate: 12
  });

  // OCR scanning state
  const [ocrLoading, setOcrLoading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchPurchases = async () => {
    try {
      const res = await axios.get(`${API_URL}/purchases`, { headers });
      setPurchases(res.data);
    } catch (err) {
      setError('Failed to fetch purchase logs.');
    }
  };

  const fetchDependencies = async () => {
    try {
      const supRes = await axios.get(`${API_URL}/suppliers`, { headers });
      setSuppliers(supRes.data);

      const medRes = await axios.get(`${API_URL}/medicines?limit=100`, { headers });
      setMedicines(medRes.data.data);
    } catch (err) {
      setError('Failed to load dependency resources.');
    }
  };

  useEffect(() => {
    fetchPurchases();
    fetchDependencies();
  }, []);

  const handleViewDetails = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/purchases/${id}`, { headers });
      setSelectedPurchase(res.data);
    } catch (err) {
      setError('Failed to fetch invoice details.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLineItem = () => {
    if (!newItem.medicine_id || !newItem.batch_number || !newItem.quantity || !newItem.purchase_rate) {
      setError('Please fill all mandatory line item details (Medicine, Batch, Qty, Purchase Rate).');
      return;
    }

    const selectedMed = medicines.find(m => m.id === parseInt(newItem.medicine_id));
    const itemData = {
      ...newItem,
      medicine_id: parseInt(newItem.medicine_id),
      medicine_name: selectedMed ? selectedMed.name : 'Unknown Medicine',
      quantity: parseInt(newItem.quantity),
      purchase_rate: parseFloat(newItem.purchase_rate),
      selling_price: parseFloat(newItem.selling_price || newItem.mrp || 0),
      mrp: parseFloat(newItem.mrp || 0),
      gst_rate: parseFloat(newItem.gst_rate || 0)
    };

    setPurchaseItems([...purchaseItems, itemData]);
    setError('');

    // Reset Line Entry
    setNewItem({
      medicine_id: '',
      batch_number: '',
      manufacturing_date: '',
      expiry_date: '',
      quantity: '',
      purchase_rate: '',
      selling_price: '',
      mrp: '',
      gst_rate: 12
    });
  };

  const handleRemoveLineItem = (index) => {
    const updated = [...purchaseItems];
    updated.splice(index, 1);
    setPurchaseItems(updated);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let gst_amount = 0;
    purchaseItems.forEach(item => {
      const cost = item.purchase_rate * item.quantity;
      const gst = cost * (item.gst_rate / 100);
      subtotal += cost;
      gst_amount += gst;
    });

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      gst_amount: parseFloat(gst_amount.toFixed(2)),
      total_amount: parseFloat((subtotal + gst_amount).toFixed(2))
    };
  };

  const handleSubmitPurchase = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!supplierId || !invoiceNumber || purchaseItems.length === 0) {
      setError('Supplier, Invoice Number, and at least 1 invoice item are required.');
      return;
    }

    const totals = calculateTotals();
    const payload = {
      supplier_id: parseInt(supplierId),
      invoice_number: invoiceNumber,
      invoice_date: invoiceDate,
      subtotal: totals.subtotal,
      gst_amount: totals.gst_amount,
      total_amount: totals.total_amount,
      items: purchaseItems
    };

    try {
      await axios.post(`${API_URL}/purchases`, payload, { headers });
      setSuccessMsg('Purchase invoice logged successfully and stock updated.');
      setPurchaseItems([]);
      setSupplierId('');
      setInvoiceNumber('');
      setInvoiceDate('');
      fetchPurchases();
      setViewMode('list');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || 'Error logging purchase order.');
    }
  };

  const handleOCRScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');
    setOcrLoading(true);
    const formData = new FormData();
    formData.append('invoice', file);

    try {
      const res = await axios.post(`${API_URL}/ocr/scan`, formData, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });

      const parsedItems = res.data.items.map(item => {
        // Find existing medicine profile id
        const matchedMed = medicines.find(m => m.name.toLowerCase() === item.medicine_name.toLowerCase());
        return {
          ...item,
          medicine_id: matchedMed ? matchedMed.id : item.medicine_id,
          medicine_name: matchedMed ? matchedMed.name : item.medicine_name
        };
      });

      setPurchaseItems([...purchaseItems, ...parsedItems]);
      setSuccessMsg(`OCR Successfully scanned: Loaded ${parsedItems.length} items.`);
    } catch (err) {
      setError('OCR extraction failed. Please add items manually.');
    } finally {
      setOcrLoading(false);
      e.target.value = null; // reset input
    }
  };

  const handleReturnInvoice = async (id) => {
    if (window.confirm('Are you sure you want to return this invoice? This will reduce inventory & batches stock.')) {
      setError('');
      try {
        await axios.post(`${API_URL}/purchases/${id}/return`, {}, { headers });
        setSuccessMsg('Invoice returned successfully.');
        fetchPurchases();
        setSelectedPurchase(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Error returning invoice.');
      }
    }
  };

  return (
    <div>
      <div className="flex-header-responsive">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Supplier Invoices (Purchases)</h2>
          <p style={{ color: 'var(--text-muted)' }}>Scan and log incoming stock invoices from vendors</p>
        </div>
        {viewMode === 'list' ? (
          <button onClick={() => setViewMode('create')} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> New Purchase
          </button>
        ) : (
          <button onClick={() => { setViewMode('list'); setError(''); }} className="btn" style={{ backgroundColor: 'white', border: '1px solid var(--border)' }}>
            Back to Logs
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <AlertCircle size={18} /> <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <CheckCircle size={18} /> <span>{successMsg}</span>
        </div>
      )}

      {/* VIEW: List Purchases */}
      {viewMode === 'list' && (
        <div className="responsive-grid-2" style={{ alignItems: 'start' }}>
          {/* Purchase logs list */}
          <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
                  <th style={{ padding: '1rem' }}>Invoice #</th>
                  <th style={{ padding: '1rem' }}>Supplier</th>
                  <th style={{ padding: '1rem' }}>Invoice Date</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Total Cost</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No purchases recorded. Click "New Purchase" to add one.</td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: '500' }}>{p.invoice_number}</td>
                      <td style={{ padding: '1rem' }}>{p.supplier_name}</td>
                      <td style={{ padding: '1rem' }}>{p.invoice_date}</td>
                      <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>₹{parseFloat(p.total_amount).toFixed(2)}</td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <span style={{ 
                          backgroundColor: p.status === 'Completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                          color: p.status === 'Completed' ? 'var(--success)' : 'var(--danger)',
                          padding: '0.125rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem' 
                        }}>{p.status}</span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'center' }}>
                        <button onClick={() => handleViewDetails(p.id)} className="btn" style={{ padding: '0.25rem 0.5rem', fontSize: '0.875rem', backgroundColor: '#f1f5f9' }}>
                          <Eye size={14} style={{ marginRight: '0.25rem' }} /> Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Details Sidebar Panel */}
          <div className="card">
            {selectedPurchase ? (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Invoice Details: {selectedPurchase.invoice_number}</h3>
                  <button onClick={() => setSelectedPurchase(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                  <div><strong>Supplier:</strong> {selectedPurchase.supplier_name}</div>
                  <div><strong>Invoice Date:</strong> {selectedPurchase.invoice_date}</div>
                  <div><strong>Subtotal:</strong> ₹{parseFloat(selectedPurchase.subtotal).toFixed(2)}</div>
                  <div><strong>GST Amount:</strong> ₹{parseFloat(selectedPurchase.gst_amount).toFixed(2)}</div>
                  <div style={{ fontSize: '1rem' }}><strong>Total Billing Amount:</strong> ₹{parseFloat(selectedPurchase.total_amount).toFixed(2)}</div>
                  <div><strong>Status:</strong> {selectedPurchase.status}</div>
                </div>

                <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem' }}>Purchased Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '250px', overflowY: 'auto', marginBottom: '1.5rem' }}>
                  {selectedPurchase.items?.map((item) => (
                    <div key={item.id} style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)' }}>
                      <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{item.medicine_name}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        <span>Batch: {item.batch_number} (Exp: {item.expiry_date})</span>
                        <span>Qty: {item.quantity} @ ₹{item.purchase_rate}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedPurchase.status === 'Completed' && (
                  <button onClick={() => handleReturnInvoice(selectedPurchase.id)} className="btn w-full" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                    Revert & Return Purchase Invoice
                  </button>
                )}
              </div>
            ) : (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <History size={32} style={{ marginBottom: '1rem', strokeWidth: 1.5 }} />
                <p>Select a purchase from the log table to review details and run stock reversals.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW: Create Purchase Invoice */}
      {viewMode === 'create' && (
        <form onSubmit={handleSubmitPurchase} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
              <label className="input-label">Supplier *</label>
              <select className="input-field" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
                <option value="">Select Supplier</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.supplier_name}</option>)}
              </select>
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
              <label className="input-label">Invoice Number *</label>
              <input type="text" className="input-field" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} required />
            </div>
            <div className="input-group" style={{ flex: 1, minWidth: '200px' }}>
              <label className="input-label">Invoice Date *</label>
              <input type="date" className="input-field" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} required />
            </div>
          </div>

          {/* OCR Scanner area */}
          <div style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius)', padding: '1.5rem', textAlign: 'center', backgroundColor: 'var(--background)', position: 'relative' }}>
            {ocrLoading ? (
              <div>Scanning invoice content, mapping medicines and batch quantities...</div>
            ) : (
              <div>
                <UploadCloud size={32} style={{ color: 'var(--primary)', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>Autoload via Supplier Bill Scan (OCR)</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Upload PDF invoice or JPG/PNG photograph</p>
                <input 
                  type="file" 
                  accept="image/*,application/pdf" 
                  onChange={handleOCRScan}
                  style={{ opacity: 0, position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', cursor: 'pointer' }}
                />
              </div>
            )}
          </div>

          {/* Invoice Lines Grid */}
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Invoice Items</h3>
            
            {/* Add item fields bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)', marginBottom: '1rem', alignItems: 'end' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>Medicine *</label>
                <select className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }} value={newItem.medicine_id} onChange={(e) => setNewItem({ ...newItem, medicine_id: e.target.value })}>
                  <option value="">Select Item</option>
                  {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>Batch # *</label>
                <input type="text" className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }} value={newItem.batch_number} onChange={(e) => setNewItem({ ...newItem, batch_number: e.target.value })} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>Expiry Date *</label>
                <input type="date" className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }} value={newItem.expiry_date} onChange={(e) => setNewItem({ ...newItem, expiry_date: e.target.value })} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>Qty *</label>
                <input type="number" className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }} value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>Purchase Rate *</label>
                <input type="number" step="0.01" className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }} value={newItem.purchase_rate} onChange={(e) => setNewItem({ ...newItem, purchase_rate: e.target.value })} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>Retail MRP</label>
                <input type="number" step="0.01" className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }} value={newItem.mrp} onChange={(e) => setNewItem({ ...newItem, mrp: e.target.value })} />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" style={{ fontSize: '0.75rem' }}>GST %</label>
                <select className="input-field" style={{ padding: '0.5rem', fontSize: '0.875rem' }} value={newItem.gst_rate} onChange={(e) => setNewItem({ ...newItem, gst_rate: e.target.value })}>
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                </select>
              </div>
              <button type="button" onClick={handleAddLineItem} className="btn btn-primary" style={{ height: '38px', padding: '0.5rem' }}>Add Item</button>
            </div>

            {/* List of currently added items */}
            <div className="table-responsive" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem' }}>Medicine</th>
                    <th style={{ padding: '0.75rem' }}>Batch #</th>
                    <th style={{ padding: '0.75rem' }}>Expiry</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Qty</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Purchase Rate</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>GST Rate</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right' }}>Cost</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center' }}>Remove</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseItems.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No items added to invoice. Add manually above or upload invoice file.</td>
                    </tr>
                  ) : (
                    purchaseItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '0.75rem', fontWeight: '500' }}>{item.medicine_name}</td>
                        <td style={{ padding: '0.75rem' }}>{item.batch_number}</td>
                        <td style={{ padding: '0.75rem' }}>{item.expiry_date}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.quantity}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>₹{parseFloat(item.purchase_rate).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right' }}>{item.gst_rate}%</td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>₹{(item.purchase_rate * item.quantity).toFixed(2)}</td>
                        <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                          <button type="button" onClick={() => handleRemoveLineItem(idx)} className="btn" style={{ padding: '0.25rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Billing Breakdown summary */}
          {purchaseItems.length > 0 && (
            <div style={{ alignSelf: 'flex-end', width: '300px', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>Subtotal (Net Cost):</span>
                <span>₹{calculateTotals().subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>GST Tax Amount:</span>
                <span>₹{calculateTotals().gst_amount.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.125rem', borderTop: '1px double var(--border)', paddingTop: '0.5rem' }}>
                <span>Total Invoice Value:</span>
                <span>₹{calculateTotals().total_amount.toFixed(2)}</span>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <button type="button" onClick={() => setViewMode('list')} className="btn" style={{ backgroundColor: '#f1f5f9' }}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={purchaseItems.length === 0}>Record Purchase Invoice</button>
          </div>
        </form>
      )}
    </div>
  );
};

export default Purchases;
