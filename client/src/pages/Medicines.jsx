import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Plus, Edit2, Trash2, Check, X, ShieldAlert } from 'lucide-react';

const API_URL = '/api';

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [barcode, setBarcode] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [formData, setFormData] = useState({
    name: '', generic_name: '', composition: '', manufacturer: '',
    category: '', barcode: '', hsn_code: '', gst_rate: 12,
    purchase_price: '', selling_price: '', mrp: '', pack_size: 1
  });
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchMedicines = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/medicines`, {
        params: { search, barcode, page, limit: 10 },
        headers
      });
      setMedicines(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
    } catch (err) {
      setError('Failed to fetch medicines.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, [page, search, barcode]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleOpenAdd = () => {
    setEditingMed(null);
    setFormData({
      name: '', generic_name: '', composition: '', manufacturer: '',
      category: '', barcode: '', hsn_code: '', gst_rate: 12,
      purchase_price: '', selling_price: '', mrp: '', pack_size: 1
    });
    setShowModal(true);
  };

  const handleOpenEdit = (med) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      generic_name: med.generic_name || '',
      composition: med.composition || '',
      manufacturer: med.manufacturer || '',
      category: med.category || '',
      barcode: med.barcode || '',
      hsn_code: med.hsn_code || '',
      gst_rate: med.gst_rate,
      purchase_price: med.purchase_price,
      selling_price: med.selling_price,
      mrp: med.mrp,
      pack_size: med.pack_size || 1
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (editingMed) {
        await axios.put(`${API_URL}/medicines/${editingMed.id}`, formData, { headers });
      } else {
        await axios.post(`${API_URL}/medicines`, formData, { headers });
      }
      setShowModal(false);
      fetchMedicines();
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving medicine record.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this medicine?')) {
      try {
        await axios.delete(`${API_URL}/medicines/${id}`, { headers });
        fetchMedicines();
      } catch (err) {
        setError('Error deleting medicine.');
      }
    }
  };

  return (
    <div>
      <div className="flex-header-responsive">
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Medicines Directory</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage master catalog, HSN, taxes, and pricing</p>
        </div>
        <button onClick={handleOpenAdd} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Plus size={18} /> Add Medicine
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ShieldAlert size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="card" style={{ display: 'flex', gap: '1rem', padding: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, position: 'relative', minWidth: '200px' }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Search by name, generic drug or manufacturer..." 
            className="input-field" 
            style={{ paddingLeft: '2.5rem' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ width: '220px', minWidth: '150px' }}>
          <input 
            type="text" 
            placeholder="Barcode scan / lookup..." 
            className="input-field" 
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--background)' }}>
              <th style={{ padding: '1rem' }}>Name</th>
              <th style={{ padding: '1rem' }}>Generic Name</th>
              <th style={{ padding: '1rem' }}>Category</th>
              <th style={{ padding: '1rem' }}>HSN Code</th>
              <th style={{ padding: '1rem' }}>GST Rate</th>
              <th style={{ padding: '1rem' }}>Purchase Rate</th>
              <th style={{ padding: '1rem' }}>Retail MRP</th>
              <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading medicines...</td>
              </tr>
            ) : medicines.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>No medicines found.</td>
              </tr>
            ) : (
              medicines.map((med) => (
                <tr key={med.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '1rem', fontWeight: '500' }}>{med.name}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{med.generic_name || '-'}</td>
                  <td style={{ padding: '1rem' }}><span style={{ backgroundColor: '#f1f5f9', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.875rem' }}>{med.category || 'General'}</span></td>
                  <td style={{ padding: '1rem' }}>{med.hsn_code || '-'}</td>
                  <td style={{ padding: '1rem' }}>{med.gst_rate}%</td>
                  <td style={{ padding: '1rem' }}>₹{parseFloat(med.purchase_price).toFixed(2)}</td>
                  <td style={{ padding: '1rem', fontWeight: '600' }}>₹{parseFloat(med.mrp).toFixed(2)}</td>
                  <td style={{ padding: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button onClick={() => handleOpenEdit(med)} className="btn" style={{ padding: '0.375rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', color: 'var(--primary)' }}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(med.id)} className="btn" style={{ padding: '0.375rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)' }}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)} className="btn" style={{ backgroundColor: 'white', border: '1px solid var(--border)' }}>Prev</button>
          <span style={{ display: 'flex', alignItems: 'center', padding: '0 1rem' }}>Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)} className="btn" style={{ backgroundColor: 'white', border: '1px solid var(--border)' }}>Next</button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-wrapper">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{editingMed ? 'Edit Medicine Profile' : 'Add New Medicine'}</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} className="form-grid-2">
              <div className="input-group" style={{ gridColumn: 'span 2' }}>
                <label className="input-label">Medicine Brand Name *</label>
                <input type="text" name="name" className="input-field" value={formData.name} onChange={handleInputChange} required />
              </div>
              <div className="input-group">
                <label className="input-label">Generic Name / Composition</label>
                <input type="text" name="generic_name" className="input-field" value={formData.generic_name} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Manufacturer</label>
                <input type="text" name="manufacturer" className="input-field" value={formData.manufacturer} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Category</label>
                <select name="category" className="input-field" value={formData.category} onChange={handleInputChange}>
                  <option value="">Select Category</option>
                  <option value="Analgesics / Antipyretics">Analgesics / Antipyretics</option>
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Cardiovascular">Cardiovascular</option>
                  <option value="Antidiabetics">Antidiabetics</option>
                  <option value="Vitamins / Supplements">Vitamins / Supplements</option>
                  <option value="Gastrointestinal">Gastrointestinal</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">HSN Code</label>
                <input type="text" name="hsn_code" className="input-field" value={formData.hsn_code} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Barcode (EAN/UPC)</label>
                <input type="text" name="barcode" className="input-field" value={formData.barcode} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label className="input-label">GST Tax Rate (%)</label>
                <select name="gst_rate" className="input-field" value={formData.gst_rate} onChange={handleInputChange}>
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5%</option>
                  <option value={12}>12%</option>
                  <option value={18}>18%</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Default Purchase Price (₹)</label>
                <input type="number" step="0.01" name="purchase_price" className="input-field" value={formData.purchase_price} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Default Selling Price (₹)</label>
                <input type="number" step="0.01" name="selling_price" className="input-field" value={formData.selling_price} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Maximum Retail Price (MRP) (₹)</label>
                <input type="number" step="0.01" name="mrp" className="input-field" value={formData.mrp} onChange={handleInputChange} />
              </div>
              <div className="input-group">
                <label className="input-label">Pack Size (Tablets per Strip)</label>
                <input type="number" name="pack_size" className="input-field" value={formData.pack_size} onChange={handleInputChange} min="1" placeholder="e.g. 10" />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>For per-tablet billing in POS (e.g. 10 for a strip of 10 tablets)</span>
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn" style={{ backgroundColor: '#f1f5f9' }}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Medicine</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicines;
