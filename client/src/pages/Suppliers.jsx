import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, X, Phone, Mail, MapPin } from 'lucide-react';

const API_URL = '/api';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [formData, setFormData] = useState({
    supplier_name: '', gst_number: '', drug_license_number: '',
    email: '', phone: '', address: ''
  });
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/suppliers`, { headers });
      setSuppliers(res.data);
    } catch (err) {
      setError('Failed to load suppliers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setFormData({
      supplier_name: '', gst_number: '', drug_license_number: '',
      email: '', phone: '', address: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (sup) => {
    setEditingSupplier(sup);
    setFormData({
      supplier_name: sup.supplier_name,
      gst_number: sup.gst_number || '',
      drug_license_number: sup.drug_license_number || '',
      email: sup.email || '',
      phone: sup.phone || '',
      address: sup.address || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingSupplier) {
        await axios.put(`${API_URL}/suppliers/${editingSupplier.id}`, formData, { headers });
      } else {
        await axios.post(`${API_URL}/suppliers`, formData, { headers });
      }
      setShowModal(false);
      fetchSuppliers();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving supplier record.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await axios.delete(`${API_URL}/suppliers/${id}`, { headers });
        fetchSuppliers();
      } catch (err) {
        setError('Error deleting supplier.');
      }
    }
  };

  return (
    <div>
      <div className="flex-header-responsive">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Supplier Directory</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage distributor profiles, GST info, and licenses</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Supplier
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Grid view of Suppliers */}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading suppliers...</p>
      ) : suppliers.length === 0 ? (
        <div className="card text-center" style={{ padding: '3rem' }}>
          <p style={{ color: 'var(--text-muted)' }}>No suppliers found. Create a supplier profile to track purchases.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {suppliers.map((sup) => (
            <div key={sup.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: 'var(--text)' }}>{sup.supplier_name}</h3>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  {sup.phone && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Phone size={14} /> {sup.phone}</div>}
                  {sup.email && <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Mail size={14} /> {sup.email}</div>}
                  {sup.address && <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem' }}><MapPin size={14} style={{ marginTop: '3px' }} /> {sup.address}</div>}
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginBottom: '1.5rem' }}>
                  <div><strong>GSTIN:</strong> {sup.gst_number || 'Not Provided'}</div>
                  <div style={{ marginTop: '0.25rem' }}><strong>Drug License:</strong> {sup.drug_license_number || 'Not Provided'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <button onClick={() => handleOpenEdit(sup)} className="btn" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(sup.id)} className="btn" style={{ padding: '0.375rem 0.75rem', fontSize: '0.875rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Supplier Modal */}
      {showModal && (
        <div className="modal-wrapper">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{editingSupplier ? 'Edit Supplier Profile' : 'Add New Supplier'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="input-group">
                <label className="input-label">Supplier/Company Name *</label>
                <input type="text" name="supplier_name" className="input-field" value={formData.supplier_name} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label className="input-label">GSTIN Number</label>
                <input type="text" name="gst_number" className="input-field" value={formData.gst_number} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Drug License Number</label>
                <input type="text" name="drug_license_number" className="input-field" value={formData.drug_license_number} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Contact Email</label>
                <input type="email" name="email" className="input-field" value={formData.email} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input type="text" name="phone" className="input-field" value={formData.phone} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Address</label>
                <textarea name="address" className="input-field" value={formData.address} onChange={handleInputChange} style={{ minHeight: '60px', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ backgroundColor: '#f1f5f9' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Supplier</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;
