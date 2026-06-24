import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bell, RefreshCw, Check, AlertTriangle, Clock, CreditCard, Inbox } from 'lucide-react';

const API_URL = '/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/notifications`, { headers });
      setNotifications(res.data);
    } catch (err) {
      setError('Failed to fetch notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleScan = async () => {
    setScanning(true);
    setError('');
    try {
      const res = await axios.post(`${API_URL}/notifications/scan`, {}, { headers });
      setNotifications(res.data.data);
    } catch (err) {
      setError('Failed to complete real-time alerts scan.');
    } finally {
      setScanning(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await axios.put(`${API_URL}/notifications/${id}/read`, {}, { headers });
      // filter out from view
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      setError('Failed to update notification.');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const getIcon = (type) => {
    if (type === 'LowStock') return <AlertTriangle style={{ color: 'var(--danger)' }} size={20} />;
    if (type === 'NearExpiry') return <Clock style={{ color: 'var(--warning)' }} size={20} />;
    if (type === 'PaymentDue') return <CreditCard style={{ color: 'var(--primary)' }} size={20} />;
    return <Bell style={{ color: 'var(--text-muted)' }} size={20} />;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>System Warnings & Alerts</h2>
          <p style={{ color: 'var(--text-muted)' }}>Low stock triggers, near expiry notifications, and outstanding dues</p>
        </div>
        <button 
          onClick={handleScan} 
          disabled={scanning} 
          className="btn btn-primary" 
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <RefreshCw size={16} className={scanning ? 'spin-anim' : ''} />
          {scanning ? 'Scanning...' : 'Trigger Scan'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Warning List */}
      <div className="card" style={{ padding: '1.5rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>Loading warnings...</p>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <Inbox size={48} style={{ margin: '0 auto 1rem', strokeWidth: 1.2 }} />
            <p style={{ fontWeight: '500' }}>No active notifications</p>
            <p style={{ fontSize: '0.875rem' }}>Pharmacy operations are running perfectly within safe levels.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {notifications.map((notif) => (
              <div 
                key={notif.id} 
                style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  padding: '1rem', border: '1px solid var(--border)', borderRadius: 'var(--radius)', 
                  backgroundColor: 'var(--background)' 
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{ padding: '0.5rem', backgroundColor: 'white', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    {getIcon(notif.type)}
                  </div>
                  <div>
                    <h4 style={{ fontWeight: '600', fontSize: '0.95rem' }}>{notif.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{notif.message}</p>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <button 
                  onClick={() => handleMarkAsRead(notif.id)} 
                  className="btn" 
                  style={{ 
                    padding: '0.375rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)',
                    borderRadius: '50%'
                  }}
                  title="Mark as Read"
                >
                  <Check size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-anim {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default Notifications;
