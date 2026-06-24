import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit2, Trash2, X, Award, DollarSign } from 'lucide-react';

const API_URL = '/api';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    customer_name: '', mobile: '', email: '', address: '', credit_balance: ''
  });
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/customers`, { headers });
      setCustomers(res.data);
    } catch (err) {
      setError('Failed to fetch customers list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setFormData({
      customer_name: '', mobile: '', email: '', address: '', credit_balance: 0.00
    });
    setShowModal(true);
  };

  const handleOpenEdit = (cust) => {
    setEditingCustomer(cust);
    setFormData({
      customer_name: cust.customer_name,
      mobile: cust.mobile || '',
      email: cust.email || '',
      address: cust.address || '',
      credit_balance: cust.credit_balance
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingCustomer) {
        await axios.put(`${API_URL}/customers/${editingCustomer.id}`, formData, { headers });
      } else {
        await axios.post(`${API_URL}/customers`, formData, { headers });
      }
      setShowModal(false);
      fetchCustomers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving customer profile.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        await axios.delete(`${API_URL}/customers/${id}`, { headers });
        fetchCustomers();
      } catch (err) {
        setError('Error deleting customer profile.');
      }
    }
  };

  const filteredCustomers = customers.filter(c =>
    c.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    c.mobile?.includes(search)
  );

  return (
    <div>
      <div className="flex-header-responsive">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Customer Directory</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage profiles, loyalty reward points, and credit tracking</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Customer
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Filter search bar */}
      <div className="card" style={{ display: 'flex', gap: '1rem', padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by customer name or phone number..." 
            className="input-field" 
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Grid view of customers */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading customer details...</p>
      ) : filteredCustomers.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No customer profiles found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {filteredCustomers.map((cust) => (
            <div key={cust.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem' }}>{cust.customer_name}</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Phone: {cust.mobile || 'Not Provided'}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'var(--background)', borderRadius: '4px', textAlign: 'center' }}>
                    <Award size={18} style={{ color: 'var(--warning)', margin: '0 auto 0.25rem' }} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loyalty Points</div>
                    <div style={{ fontWeight: '700', fontSize: '1rem' }}>{cust.loyalty_points}</div>
                  </div>
                  <div style={{ padding: '0.5rem', backgroundColor: 'var(--background)', borderRadius: '4px', textAlign: 'center' }}>
                    <DollarSign size={18} style={{ color: cust.credit_balance > 0 ? 'var(--danger)' : 'var(--success)', margin: '0 auto 0.25rem' }} />
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Credit Owed</div>
                    <div style={{ fontWeight: '700', fontSize: '1rem', color: cust.credit_balance > 0 ? 'var(--danger)' : 'var(--text)' }}>₹{parseFloat(cust.credit_balance).toFixed(2)}</div>
                  </div>
                </div>

                {cust.email && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}><strong>Email:</strong> {cust.email}</p>}
                {cust.address && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><strong>Address:</strong> {cust.address}</p>}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '1rem' }}>
                <button onClick={() => handleOpenEdit(cust)} className="btn" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(cust.id)} className="btn" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Modal */}
      {showModal && (
        <div className="modal-wrapper">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{editingCustomer ? 'Edit Customer Profile' : 'Add New Customer'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Customer Name *</label>
                <input type="text" name="customer_name" className="input-field" value={formData.customer_name} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label className="input-label">Mobile Number *</label>
                <input type="text" name="mobile" className="input-field" value={formData.mobile} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input type="email" name="email" className="input-field" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Address</label>
                <textarea name="address" className="input-field" value={formData.address} onChange={handleInputChange} style={{ minHeight: '60px', fontFamily: 'inherit' }} />
              </div>
              <div className="input-group">
                <label className="input-label">Initial Credit Balance / Outstanding Owed (₹)</label>
                <input type="number" step="0.01" name="credit_balance" className="input-field" value={formData.credit_balance} onChange={handleInputChange} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ backgroundColor: '#f1f5f9' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
