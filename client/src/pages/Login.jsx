import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';
import { Pill, Lock, User } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await authService.login({ username, password });
      login(data.user, data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
      <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
        <div className="text-center" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '50%', color: 'var(--primary)', marginBottom: '1rem' }}>
            <Pill size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Pharmacy Management</h1>
          <p style={{ color: 'var(--text-muted)' }}>Sign in to your account</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input-field" 
                style={{ paddingLeft: '2.5rem' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="password" 
                className="input-field" 
                style={{ paddingLeft: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full mt-4" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="text-center" style={{ marginTop: '1rem' }}>
          <Link to="/register" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>Don't have an account? Register</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
