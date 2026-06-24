import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ShoppingCart, User, Ticket, CreditCard, Printer, Check, X, ShieldAlert, Clock, History } from 'lucide-react';

const API_URL = '/api';

const POS = () => {
  // Tabs
  const [activeTab, setActiveTab] = useState('new'); // 'new', 'history'
  const [salesHistory, setSalesHistory] = useState([]);

  // Dependencies
  const [medicines, setMedicines] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  
  // Selection workflow
  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [medicineBatches, setMedicineBatches] = useState([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [lineQty, setLineQty] = useState(1);
  const [lineDiscount, setLineDiscount] = useState(0);
  const [unitType, setUnitType] = useState('Strip'); // 'Strip' or 'Tablet'

  // Cart
  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [redeemPoints, setRedeemPoints] = useState(false);

  // Quick Customer Create
  const [showCustModal, setShowCustModal] = useState(false);
  const [custForm, setCustForm] = useState({ customer_name: '', mobile: '', email: '', address: '' });

  // Receipt / Print Modal
  const [receiptData, setReceiptData] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const loadData = async () => {
    try {
      const custRes = await axios.get(`${API_URL}/customers`, { headers });
      setCustomers(custRes.data);

      const medRes = await axios.get(`${API_URL}/medicines?limit=100`, { headers });
      setMedicines(medRes.data.data);
    } catch (err) {
      setError('Error pre-loading POS catalog records.');
    }
  };

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/sales`, { headers });
      setSalesHistory(res.data);
    } catch (err) {
      setError('Error fetching sales history.');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab]);

  // Handle Search Query filtering
  const filteredMedicines = medicines.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.generic_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.barcode === searchQuery
  );

  // Barcode quick lookup scanning
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    if (!barcodeQuery) return;
    setError('');

    try {
      const res = await axios.get(`${API_URL}/medicines`, {
        params: { barcode: barcodeQuery },
        headers
      });

      const matchedMed = res.data.data[0];
      if (matchedMed) {
        handleSelectMedicine(matchedMed);
        setBarcodeQuery('');
      } else {
        setError('No medicine matched the scanned barcode.');
      }
    } catch (err) {
      setError('Error scanning barcode.');
    }
  };

  // Open batch selector when a medicine is selected
  const handleSelectMedicine = async (med) => {
    setSelectedMedicine(med);
    setError('');
    try {
      const res = await axios.get(`${API_URL}/inventory/batches/${med.id}`, { headers });
      setMedicineBatches(res.data);
      if (res.data.length === 0) {
        setError(`No active stock batches found for ${med.name}. Run a purchase order first.`);
        return;
      }
      setSelectedBatch(res.data[0].id.toString());
      setLineQty(1);
      setLineDiscount(0);
      setShowBatchModal(true);
    } catch (err) {
      setError('Failed to fetch medicine batch details.');
    }
  };

  const handleAddToCart = () => {
    const batchId = parseInt(selectedBatch);
    const batchObj = medicineBatches.find(b => b.id === batchId);

    if (!batchObj) return;

    const packSize = parseInt(selectedMedicine.pack_size) || 1;
    const isMedicineCategory = ['Analgesics / Antipyretics', 'Antibiotics', 'Cardiovascular', 'Antidiabetics', 'Vitamins / Supplements', 'Gastrointestinal'].includes(selectedMedicine.category);
    const isTabletMode = isMedicineCategory && unitType === 'Tablet' && packSize > 1;

    // For tablet mode: qty means number of tablets, but stock is in strips
    const effectiveStockQty = isTabletMode ? batchObj.quantity * packSize : batchObj.quantity;
    if (effectiveStockQty < lineQty) {
      setError(`Requested quantity is higher than available stock (${effectiveStockQty} ${isTabletMode ? 'tablets' : 'units'} remaining).`);
      return;
    }

    // Check if item already exists in cart
    const existingIndex = cart.findIndex(item => item.batch_id === batchId && item.unit_type === unitType);

    // MRP is inclusive of GST — sell at MRP directly, no extra GST
    const mrpPrice = parseFloat(batchObj.mrp || selectedMedicine.mrp);
    let price;
    if (isTabletMode) {
      // Per-tablet price = MRP of strip / tablets per strip
      price = parseFloat((mrpPrice / packSize).toFixed(2));
    } else {
      price = mrpPrice;
    }

    const cartLine = {
      medicine_id: selectedMedicine.id,
      medicine_name: selectedMedicine.name,
      batch_id: batchId,
      batch_number: batchObj.batch_number,
      quantity: parseInt(lineQty),
      rate: price,
      gst_rate: 0, // MRP is inclusive of GST, no extra GST
      discount: parseFloat(lineDiscount || 0),
      total: (price * parseInt(lineQty)) - parseFloat(lineDiscount || 0),
      unit_type: isTabletMode ? 'Tablet' : 'Strip',
      pack_size: packSize
    };

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex] = cartLine;
      setCart(updatedCart);
    } else {
      setCart([...cart, cartLine]);
    }

    setShowBatchModal(false);
    setSelectedMedicine(null);
    setUnitType('Strip');
  };

  const handleRemoveFromCart = (index) => {
    const updated = [...cart];
    updated.splice(index, 1);
    setCart(updated);
  };

  // Billing calculations — MRP is inclusive of GST, no extra GST added
  const calculateCartSummary = () => {
    let subtotal = 0;
    let itemsDiscount = 0;

    cart.forEach(item => {
      subtotal += item.rate * item.quantity;
      itemsDiscount += item.discount;
    });

    let finalDiscount = parseFloat(discountAmount || 0) + itemsDiscount;
    let loyaltyDiscount = 0;
    if (redeemPoints && selectedCustomer) {
      loyaltyDiscount = Math.min(selectedCustomer.loyalty_points, subtotal - finalDiscount);
      finalDiscount += loyaltyDiscount;
    }

    const total_amount = Math.max(0, subtotal - finalDiscount);

    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      gst_amount: 0, // GST is already included in MRP
      discount_amount: parseFloat(finalDiscount.toFixed(2)),
      loyalty_discount: loyaltyDiscount,
      total_amount: parseFloat(total_amount.toFixed(2))
    };
  };

  // Checkout transaction
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError('Checkout failed: Shopping cart is empty.');
      return;
    }
    setError('');
    setLoading(true);

    const summary = calculateCartSummary();
    const payload = {
      customer_id: selectedCustomer ? selectedCustomer.id : null,
      subtotal: summary.subtotal,
      gst_amount: summary.gst_amount,
      discount_amount: summary.discount_amount,
      total_amount: summary.total_amount,
      payment_method: paymentMethod,
      items: cart
    };

    try {
      const res = await axios.post(`${API_URL}/sales`, payload, { headers });
      
      // Load details for printable invoice receipt
      const receiptRes = await axios.get(`${API_URL}/sales/${res.data.id}`, { headers });
      setReceiptData(receiptRes.data);
      setShowReceipt(true);

      // Reset cart and settings
      setCart([]);
      setSelectedCustomer(null);
      setDiscountAmount(0);
      setRedeemPoints(false);
      loadData(); // Reload customers/meds to sync points & stock levels
    } catch (err) {
      setError(err.response?.data?.message || 'Transaction failed. Check stocks.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickCustomer = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(`${API_URL}/customers`, custForm, { headers });
      setCustomers([...customers, res.data]);
      setSelectedCustomer(res.data);
      setShowCustModal(false);
      setCustForm({ customer_name: '', mobile: '', email: '', address: '' });
    } catch (err) {
      setError('Failed to create customer profile.');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const summary = calculateCartSummary();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('new')} 
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
            fontWeight: activeTab === 'new' ? '600' : '400',
            color: activeTab === 'new' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'new' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          <ShoppingCart size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.25rem' }} />
          New Sale
        </button>
        <button 
          onClick={() => setActiveTab('history')} 
          style={{ 
            background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
            fontWeight: activeTab === 'history' ? '600' : '400',
            color: activeTab === 'history' ? 'var(--primary)' : 'var(--text-muted)',
            borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent'
          }}
        >
          <History size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '0.25rem' }} />
          Billing History
        </button>
      </div>

      {activeTab === 'history' ? (
        <div className="card" style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Recent Bills</h2>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Invoice Number</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Customer</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Items</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Total</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {salesHistory.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No billing history available.</td>
                  </tr>
                ) : (
                  salesHistory.map((sale) => (
                    <tr key={sale.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>INV-{sale.id.toString().padStart(5, '0')}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{new Date(sale.created_at).toLocaleString()}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{sale.customer_name || 'Walk-in Customer'}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>{sale.payment_method}</td>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: '600' }}>₹{parseFloat(sale.total_amount).toFixed(2)}</td>
                      <td style={{ padding: '0.75rem 0.5rem' }}>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: '600',
                          backgroundColor: sale.payment_status === 'Paid' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: sale.payment_status === 'Paid' ? 'var(--success)' : 'var(--danger)'
                        }}>
                          {sale.payment_status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="pos-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', height: 'calc(100vh - 180px)' }}>
      {/* LEFT PANEL: Product catalog & Search */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
        <div className="card" style={{ display: 'flex', gap: '0.75rem', padding: '1rem', flexWrap: 'wrap' }}>
          {/* Text Search */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              placeholder="Search medicine / generic drug..." 
              className="input-field" 
              style={{ paddingLeft: '2.25rem', paddingRight: '0.5rem', fontSize: '0.9rem' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Barcode Form */}
          <form onSubmit={handleBarcodeSubmit} style={{ width: '180px' }}>
            <input 
              type="text" 
              placeholder="Barcode scan..." 
              className="input-field" 
              style={{ fontSize: '0.9rem' }}
              value={barcodeQuery}
              onChange={(e) => setBarcodeQuery(e.target.value)}
            />
          </form>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={16} /> <span>{error}</span>
          </div>
        )}

        {/* Medicines grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {filteredMedicines.map((med) => (
            <div 
              key={med.id} 
              onClick={() => handleSelectMedicine(med)} 
              className="card" 
              style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '1rem', transition: 'transform 0.1s' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <h4 style={{ fontSize: '0.95rem', fontWeight: '600', color: 'var(--text)' }}>{med.name}</h4>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{med.generic_name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category: {med.category || 'General'}</span>
              <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
                <span style={{ fontWeight: '700', color: 'var(--primary)' }}>MRP: ₹{parseFloat(med.mrp).toFixed(2)}</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', padding: '0.125rem 0.25rem', borderRadius: '2px', color: 'var(--success)' }}>Incl. GST</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: Shopping Cart / Receipt Details */}
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1.5rem', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', fontWeight: '700' }}>
              <ShoppingCart size={20} /> Current Cart ({cart.length})
            </h3>
            <button onClick={() => setCart([])} style={{ fontSize: '0.75rem', color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
          </div>

          {/* Cart items list */}
          <div style={{ minHeight: '120px', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Cart is empty. Select a product to add items.
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '4px', backgroundColor: 'var(--background)', fontSize: '0.85rem' }}>
                  <div>
                    <div style={{ fontWeight: '600' }}>{item.medicine_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Batch: {item.batch_number} | ₹{item.rate}/{item.unit_type || 'Unit'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <strong>{item.quantity} Qty</strong>
                    <span>₹{item.total.toFixed(2)}</span>
                    <button onClick={() => handleRemoveFromCart(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><X size={16} /></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Customer Selection */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label className="input-label" style={{ marginBottom: 0 }}>Linked Customer</label>
              <button onClick={() => setShowCustModal(true)} style={{ fontSize: '0.75rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Add Customer</button>
            </div>
            <select 
              className="input-field" 
              value={selectedCustomer ? selectedCustomer.id : ''} 
              onChange={(e) => {
                const c = customers.find(cust => cust.id === parseInt(e.target.value));
                setSelectedCustomer(c || null);
                setRedeemPoints(false);
              }}
              style={{ fontSize: '0.875rem', padding: '0.5rem' }}
            >
              <option value="">Guest Customer</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name} ({c.mobile})</option>)}
            </select>

            {selectedCustomer && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>
                <span>Loyalty Points: <strong>{selectedCustomer.loyalty_points}</strong></span>
                <span>Outstanding Credit: <strong style={{ color: selectedCustomer.credit_balance > 0 ? 'var(--danger)' : 'inherit' }}>₹{selectedCustomer.credit_balance}</strong></span>
              </div>
            )}
          </div>

          {/* Discounts and Points */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" style={{ fontSize: '0.75rem' }}>Direct Discount (₹)</label>
              <input 
                type="number" 
                className="input-field" 
                style={{ padding: '0.5rem', fontSize: '0.875rem' }}
                value={discountAmount} 
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            {selectedCustomer && selectedCustomer.loyalty_points > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', marginTop: '1.25rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={redeemPoints} 
                    onChange={(e) => setRedeemPoints(e.target.checked)} 
                  />
                  Redeem Points (Max: ₹{selectedCustomer.loyalty_points})
                </label>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginBottom: '1rem' }}>
            <label className="input-label">Payment Method</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['Cash', 'Card', 'UPI', 'Credit'].map(method => (
                <button 
                  key={method}
                  type="button" 
                  onClick={() => setPaymentMethod(method)}
                  className="btn"
                  style={{ 
                    flex: 1, padding: '0.375rem 0.5rem', fontSize: '0.85rem',
                    backgroundColor: paymentMethod === method ? 'var(--primary)' : 'white',
                    color: paymentMethod === method ? 'white' : 'var(--text)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Summary */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Items Total (MRP incl. GST):</span>
              <span>₹{summary.subtotal.toFixed(2)}</span>
            </div>
            {summary.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--danger)' }}>
                <span>Discounts applied:</span>
                <span>-₹{summary.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '1.25rem', borderTop: '1px double var(--border)', paddingTop: '0.5rem', color: 'var(--primary)' }}>
              <span>Grand Total:</span>
              <span>₹{summary.total_amount.toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={handleCheckout} 
            className="btn btn-primary w-full" 
            style={{ padding: '0.75rem' }} 
            disabled={cart.length === 0 || loading}
          >
            {loading ? 'Processing Transaction...' : 'Complete POS Checkout'}
          </button>
        </div>
      </div>
        </div>
      )}


      {/* Batch Selection Dialog */}
      {showBatchModal && selectedMedicine && (
        <div className="modal-wrapper">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Select Batch: {selectedMedicine.name}</h3>
              <button onClick={() => setShowBatchModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <div className="input-group">
              <label className="input-label">Select Active Batch (Exp / Stock)</label>
              <select className="input-field" value={selectedBatch} onChange={(e) => setSelectedBatch(e.target.value)}>
                {medicineBatches.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.batch_number} (Exp: {b.expiry_date}) - Qty: {b.quantity} [MRP: ₹{b.mrp}]
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Type Selection - only for medicine categories with pack_size */}
            {(() => {
              const packSize = parseInt(selectedMedicine?.pack_size) || 1;
              const isMedicineCategory = ['Analgesics / Antipyretics', 'Antibiotics', 'Cardiovascular', 'Antidiabetics', 'Vitamins / Supplements', 'Gastrointestinal'].includes(selectedMedicine?.category);
              const showUnitToggle = isMedicineCategory && packSize > 1;
              const batchObj = medicineBatches.find(b => b.id === parseInt(selectedBatch));
              const mrpPrice = parseFloat(batchObj?.mrp || selectedMedicine?.mrp || 0);
              const perTabletPrice = packSize > 1 ? (mrpPrice / packSize).toFixed(2) : mrpPrice;
              
              return showUnitToggle ? (
                <div className="input-group">
                  <label className="input-label">Selling As</label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => { setUnitType('Strip'); setLineQty(1); }}
                      className="btn"
                      style={{
                        flex: 1, padding: '0.5rem', fontSize: '0.85rem',
                        backgroundColor: unitType === 'Strip' ? 'var(--primary)' : 'white',
                        color: unitType === 'Strip' ? 'white' : 'var(--text)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      Full Strip (₹{mrpPrice})
                    </button>
                    <button
                      type="button"
                      onClick={() => { setUnitType('Tablet'); setLineQty(1); }}
                      className="btn"
                      style={{
                        flex: 1, padding: '0.5rem', fontSize: '0.85rem',
                        backgroundColor: unitType === 'Tablet' ? 'var(--primary)' : 'white',
                        color: unitType === 'Tablet' ? 'white' : 'var(--text)',
                        border: '1px solid var(--border)'
                      }}
                    >
                      Per Tablet (₹{perTabletPrice})
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                    Pack size: {packSize} tablets per strip
                  </div>
                </div>
              ) : null;
            })()}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Qty to Sell {unitType === 'Tablet' ? '(Tablets)' : ''}</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={lineQty} 
                  onChange={(e) => setLineQty(parseInt(e.target.value) || 1)} 
                  min="1"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Line Discount (₹)</label>
                <input 
                  type="number" 
                  className="input-field" 
                  value={lineDiscount} 
                  onChange={(e) => setLineDiscount(parseFloat(e.target.value) || 0)} 
                  min="0"
                />
              </div>
            </div>

            {/* Preview line total */}
            {(() => {
              const batchObj = medicineBatches.find(b => b.id === parseInt(selectedBatch));
              const packSize = parseInt(selectedMedicine?.pack_size) || 1;
              const isMedicineCategory = ['Analgesics / Antipyretics', 'Antibiotics', 'Cardiovascular', 'Antidiabetics', 'Vitamins / Supplements', 'Gastrointestinal'].includes(selectedMedicine?.category);
              const isTabletMode = isMedicineCategory && unitType === 'Tablet' && packSize > 1;
              const mrpPrice = parseFloat(batchObj?.mrp || selectedMedicine?.mrp || 0);
              const price = isTabletMode ? parseFloat((mrpPrice / packSize).toFixed(2)) : mrpPrice;
              const lineTotal = (price * lineQty) - (lineDiscount || 0);
              return (
                <div style={{ padding: '0.75rem', backgroundColor: 'rgba(37, 99, 235, 0.05)', borderRadius: 'var(--radius)', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {lineQty} × ₹{price.toFixed(2)} {unitType === 'Tablet' ? '/tablet' : ''}
                  </span>
                  <span style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--primary)' }}>₹{lineTotal.toFixed(2)}</span>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <button onClick={() => setShowBatchModal(false)} className="btn" style={{ backgroundColor: '#f1f5f9' }}>Cancel</button>
              <button onClick={handleAddToCart} className="btn btn-primary">Add to Basket</button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Customer Modal */}
      {showCustModal && (
        <div className="modal-wrapper">
          <div className="modal-content" style={{ maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: '600' }}>Add Customer Profile</h3>
              <button onClick={() => setShowCustModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleQuickCustomer}>
              <div className="input-group">
                <label className="input-label">Customer Name *</label>
                <input type="text" className="input-field" value={custForm.customer_name} onChange={(e) => setCustForm({ ...custForm, customer_name: e.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Mobile Number *</label>
                <input type="text" className="input-field" value={custForm.mobile} onChange={(e) => setCustForm({ ...custForm, mobile: e.target.value })} required />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input type="email" className="input-field" value={custForm.email} onChange={(e) => setCustForm({ ...custForm, email: e.target.value })} />
              </div>
              <div className="input-group">
                <label className="input-label">Address</label>
                <textarea className="input-field" value={custForm.address} onChange={(e) => setCustForm({ ...custForm, address: e.target.value })} style={{ minHeight: '50px', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setShowCustModal(false)} className="btn" style={{ backgroundColor: '#f1f5f9' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Receipt Overlay */}
      {showReceipt && receiptData && (
        <div className="modal-wrapper" style={{ overflowY: 'auto', display: 'flex', alignItems: 'flex-start' }}>
          <div className="modal-content" style={{ maxWidth: '450px', backgroundColor: 'white', color: 'black', margin: '2rem auto' }}>
            {/* Receipt details */}
            <div id="printable-receipt" style={{ padding: '0.5rem', fontFamily: 'Courier New, monospace' }}>
              <div style={{ textAlign: 'center', borderBottom: '1px dashed black', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>PHARMORA</h2>
                <p style={{ fontSize: '0.8rem' }}>Express Pharmacy Billing Hub</p>
                <p style={{ fontSize: '0.8rem' }}>GSTIN: 27AAAAA0000A1Z0</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', marginBottom: '1rem', borderBottom: '1px dashed black', paddingBottom: '0.5rem' }}>
                <div><strong>Invoice #:</strong> {receiptData.invoice_number}</div>
                <div><strong>Date:</strong> {new Date(receiptData.created_at).toLocaleString()}</div>
                <div><strong>Payment:</strong> {receiptData.payment_method} ({receiptData.payment_status})</div>
                {receiptData.customer_name && (
                  <div><strong>Customer:</strong> {receiptData.customer_name} ({receiptData.mobile})</div>
                )}
              </div>

              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '1rem', borderBottom: '1px dashed black' }}>
                <thead>
                  <tr style={{ borderBottom: '1px dashed black', textAlign: 'left' }}>
                    <th style={{ padding: '0.25rem 0' }}>Item</th>
                    <th style={{ padding: '0.25rem 0', textAlign: 'center' }}>Qty</th>
                    <th style={{ padding: '0.25rem 0', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {receiptData.items?.map((item) => (
                    <tr key={item.id}>
                      <td style={{ padding: '0.25rem 0' }}>
                        <div>{item.medicine_name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#555' }}>Batch: {item.batch_number} @ ₹{item.rate}</div>
                      </td>
                      <td style={{ padding: '0.25rem 0', textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>₹{parseFloat(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.85rem', borderBottom: '1px dashed black', paddingBottom: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Subtotal (MRP incl. GST):</span>
                  <span>₹{parseFloat(receiptData.subtotal).toFixed(2)}</span>
                </div>
                {parseFloat(receiptData.discount_amount) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Discount:</span>
                    <span>-₹{parseFloat(receiptData.discount_amount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', borderTop: '1px dashed black', paddingTop: '0.5rem' }}>
                  <span>Grand Total:</span>
                  <span>₹{parseFloat(receiptData.total_amount).toFixed(2)}</span>
                </div>
              </div>

              <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                <p>Thank You for your visit!</p>
                <p>Get well soon.</p>
              </div>
            </div>

            {/* Print and Close controls */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }} className="no-print">
              <button onClick={handlePrint} className="btn btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Printer size={18} /> Print Receipt
              </button>
              <button onClick={() => setShowReceipt(false)} className="btn" style={{ backgroundColor: '#f1f5f9' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default POS;
