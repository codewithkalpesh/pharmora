import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Medicines from './Medicines';
import Inventory from './Inventory';
import Suppliers from './Suppliers';
import Purchases from './Purchases';
import POS from './POS';
import Customers from './Customers';
import Reports from './Reports';
import Notifications from './Notifications';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  FileText, 
  Bell, 
  LogOut,
  Truck,
  Layers,
  Activity,
  AlertCircle,
  HelpCircle,
  Award,
  Menu,
  X
} from 'lucide-react';

const API_URL = '/api';

const SidebarLink = ({ to, icon: Icon, onClick, children }) => (
  <Link to={to} onClick={onClick} style={{ 
    display: 'flex', 
    alignItems: 'center', 
    gap: '0.75rem', 
    padding: '0.75rem 1rem', 
    textDecoration: 'none', 
    color: 'var(--text)', 
    borderRadius: 'var(--radius)',
    transition: 'background 0.2s'
  }} className="sidebar-link">
    <Icon size={20} />
    <span>{children}</span>
  </Link>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Role check helper
  const canAccess = (roles = []) => {
    return !roles.length || roles.includes(user?.role);
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar Backdrop for Mobile */}
      {isSidebarOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      {/* Sidebar Drawer */}
      <div 
        className={`sidebar-container ${isSidebarOpen ? 'open' : ''}`}
        style={{ width: '260px', backgroundColor: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2.5rem', padding: '0 0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity color="var(--primary)" size={24} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', letterSpacing: '-0.025em' }}>Pharmora</h2>
          </div>
          <button 
            onClick={closeSidebar} 
            style={{ border: 'none', background: 'none', cursor: 'pointer', padding: '0.25rem' }} 
            className="menu-toggle"
            title="Close Menu"
          >
            <X size={20} />
          </button>
        </div>
        
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {canAccess(['Admin', 'Manager', 'Pharmacist']) && (
            <SidebarLink to="/dashboard" icon={LayoutDashboard} onClick={closeSidebar}>Overview</SidebarLink>
          )}
          {canAccess(['Admin', 'Manager', 'Pharmacist']) && (
            <SidebarLink to="/dashboard/medicines" icon={Layers} onClick={closeSidebar}>Medicines</SidebarLink>
          )}
          {canAccess(['Admin', 'Manager', 'Pharmacist']) && (
            <SidebarLink to="/dashboard/inventory" icon={Package} onClick={closeSidebar}>Inventory</SidebarLink>
          )}
          {canAccess(['Admin', 'Manager', 'Pharmacist', 'Cashier']) && (
            <SidebarLink to="/dashboard/pos" icon={ShoppingCart} onClick={closeSidebar}>POS Billing</SidebarLink>
          )}
          {canAccess(['Admin', 'Manager']) && (
            <SidebarLink to="/dashboard/suppliers" icon={Truck} onClick={closeSidebar}>Suppliers</SidebarLink>
          )}
          {canAccess(['Admin', 'Manager']) && (
            <SidebarLink to="/dashboard/purchases" icon={ShoppingCart} onClick={closeSidebar}>Purchases</SidebarLink>
          )}
          {canAccess(['Admin', 'Manager', 'Pharmacist', 'Cashier']) && (
            <SidebarLink to="/dashboard/customers" icon={Users} onClick={closeSidebar}>Customers</SidebarLink>
          )}
          {canAccess(['Admin', 'Manager']) && (
            <SidebarLink to="/dashboard/reports" icon={FileText} onClick={closeSidebar}>Reports</SidebarLink>
          )}
          {canAccess(['Admin', 'Manager', 'Pharmacist']) && (
            <SidebarLink to="/dashboard/notifications" icon={Bell} onClick={closeSidebar}>Alerts</SidebarLink>
          )}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <button 
            onClick={handleLogout}
            style={{ 
              width: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.75rem', 
              padding: '0.75rem 1rem', 
              background: 'none', 
              border: 'none', 
              color: 'var(--danger)', 
              cursor: 'pointer',
              borderRadius: 'var(--radius)',
              fontWeight: '500'
            }}
            className="sidebar-link"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: '64px', backgroundColor: 'var(--surface)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button 
              onClick={() => setIsSidebarOpen(true)} 
              className="menu-toggle"
              title="Open Menu"
            >
              <Menu size={20} />
            </button>
            <h1 style={{ fontSize: '1.125rem', fontWeight: '600' }}>Pharmora Hub</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {canAccess(['Admin', 'Manager', 'Pharmacist']) && (
              <Link to="/dashboard/notifications" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                <Bell size={20} style={{ cursor: 'pointer' }} />
              </Link>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem', fontWeight: '600' }}>
                {user?.username?.[0]?.toUpperCase()}
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', display: 'inline' }} className="user-name-tag">
                {user?.username} ({user?.role})
              </span>
            </div>
          </div>
        </header>

        <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/medicines" element={<Medicines />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/pos" element={<POS />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/purchases" element={<Purchases />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/notifications" element={<Notifications />} />
          </Routes>
        </main>
      </div>

      {/* Floating POS Button — Mobile Only */}
      {canAccess(['Admin', 'Manager', 'Pharmacist', 'Cashier']) && (
        <MobilePOSFab />
      )}
    </div>
  );
};

const MobilePOSFab = () => {
  const location = useLocation();
  if (location.pathname === '/dashboard/pos') return null;
  return (
    <Link
      to="/dashboard/pos"
      className="mobile-pos-fab"
      title="Open POS Billing"
      aria-label="POS Billing"
    >
      <ShoppingCart size={24} strokeWidth={2.2} />
      <span className="mobile-pos-fab-label">POS</span>
    </Link>
  );
};

const Overview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/reports/stats?date=${selectedDate}`, { headers });
      setStats(res.data);
    } catch (err) {
      setError('Failed to fetch dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedDate]);

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Loading system statistics...</p>;
  if (error) return <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: 'var(--radius)' }}>{error}</div>;
  if (!stats) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPI Cards Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>Daily Overview</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: '500' }}>Filter by Date:</label>
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            style={{ padding: '0.5rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        <StatCard title={`${selectedDate === new Date().toISOString().split('T')[0] ? "Today's" : "Selected Day's"} Sales`} value={`₹${stats.todaySales.toFixed(2)}`} label="All processed billing" color="var(--primary)" />
        <StatCard title={`${selectedDate === new Date().toISOString().split('T')[0] ? "Today's" : "Selected Day's"} Purchases`} value={`₹${stats.todayPurchases.toFixed(2)}`} label="New stock investments" color="var(--danger)" />
        <StatCard title={`${selectedDate === new Date().toISOString().split('T')[0] ? "Today's" : "Selected Day's"} Net Profit`} value={`₹${stats.todayProfit.toFixed(2)}`} label="Markup profit" color="var(--success)" />
        <StatCard title="Inventory Asset Value" value={`₹${stats.totalInventoryValue.toFixed(2)}`} label="Total value at cost" color="var(--primary)" />
        <StatCard title="Low Stock Warning" value={`${stats.lowStockCount} Items`} label="Needs replenishment" color="var(--danger)" isLink to="/dashboard/inventory" />
        <StatCard title="Near Expiry Warnings" value={`${stats.nearExpiryCount} Batches`} label="Expiring in 60 days" color="var(--warning)" isLink to="/dashboard/notifications" />
      </div>

      <div className="responsive-grid-2" style={{ alignItems: 'start' }}>
        {/* Top Selling Medicines */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.25rem' }}>Top Selling Medicines</h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Medicine Brand Name</th>
                  <th style={{ padding: '0.75rem 0.5rem' }}>Generic Name</th>
                  <th style={{ padding: '0.75rem 0.5rem', textAlign: 'right' }}>Total Units Sold</th>
                </tr>
              </thead>
              <tbody>
                {stats.topSelling?.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={{ padding: '1.5rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No sales transactions logged today.</td>
                  </tr>
                ) : (
                  stats.topSelling?.map((med, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '0.75rem 0.5rem', fontWeight: '500' }}>{med.name}</td>
                      <td style={{ padding: '0.75rem 0.5rem', color: 'var(--text-muted)' }}>{med.generic_name}</td>
                      <td style={{ padding: '0.75rem 0.5rem', textAlign: 'right', fontWeight: '600' }}>{med.qty_sold} Units</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Short-cut actions panel */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Quick Activities</h3>
          <Link to="/dashboard/pos" className="btn btn-primary" style={{ padding: '0.75rem', fontSize: '0.9rem', justifyContent: 'center' }}>
            Open POS Billing Terminal
          </Link>
          <Link to="/dashboard/purchases" className="btn" style={{ padding: '0.75rem', fontSize: '0.9rem', border: '1px solid var(--border)', justifyContent: 'center', backgroundColor: 'white' }}>
            Upload Supplier Invoice (OCR)
          </Link>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', padding: '0.75rem', backgroundColor: 'var(--background)', borderRadius: 'var(--radius)', fontSize: '0.8rem', color: 'var(--text-muted)', alignItems: 'center' }}>
            <AlertCircle size={16} />
            <span>Only Admin and Managers can access Purchases & Suppliers lists.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, label, color, isLink, to }) => {
  const CardContent = () => (
    <>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.025em' }}>{title}</p>
      <h3 style={{ fontSize: '1.6rem', fontWeight: '800', margin: '0.375rem 0 0.25rem', color: 'var(--text)' }}>{value}</h3>
      <p style={{ fontSize: '0.75rem', color: color, fontWeight: '500' }}>{label}</p>
    </>
  );

  if (isLink) {
    return (
      <Link to={to} className="card" style={{ textDecoration: 'none', display: 'block', transition: 'box-shadow 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.boxShadow = 'var(--shadow-lg)'} onMouseOut={(e) => e.currentTarget.style.boxShadow = 'var(--shadow)'}>
        <CardContent />
      </Link>
    );
  }

  return (
    <div className="card">
      <CardContent />
    </div>
  );
};

export default Dashboard;
