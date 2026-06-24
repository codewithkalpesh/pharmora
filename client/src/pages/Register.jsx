import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/api';
import { Pill, User, Mail, Lock } from 'lucide-react';

const Register = () => {
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'Cashier' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.register(form);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
      <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'rgba(37,99,235,0.1)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1rem' }}>
            <Pill size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Create Account</h1>
          <p style={{ color: 'var(--text-muted)' }}>Register a new account</p>
        </div>
        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239,68,68,0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="text" name="username" className="input-field" style={{ paddingLeft: '2.5rem' }} value={form.username} onChange={handleChange} required />
            </div>
          </div>
          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label className="input-label">Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="email" name="email" className="input-field" style={{ paddingLeft: '2.5rem' }} value={form.email} onChange={handleChange} required />
            </div>
          </div>
          <div className="input-group" style={{ marginTop: '1rem' }}>
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input type="password" name="password" className="input-field" style={{ paddingLeft: '2.5rem' }} value={form.password} onChange={handleChange} required />
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>
        <div className="text-center" style={{ marginTop: '1rem' }}>
          <Link to="/login" style={{ color: 'var(--primary)' }}>Already have an account? Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
