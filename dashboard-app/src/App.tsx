import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import './App.css';

// Placeholder components
const Scanner = () => (
  <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
    <h1 className="dashboard-title text-brand-gradient">QR Scanner</h1>
    <p className="dashboard-subtitle">Camera functionality will be implemented here.</p>
  </div>
);

const User = () => (
  <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: '1rem' }}>
    <h1 className="dashboard-title text-brand-gradient">User Profile</h1>
    <p className="dashboard-subtitle">User passport and badges will appear here.</p>
  </div>
);

const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav className="glass" style={{ margin: '1rem', padding: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
      <Link 
        to="/dashboard" 
        style={{ 
          color: location.pathname === '/dashboard' ? 'var(--brand-primary)' : 'var(--text-main)', 
          textDecoration: 'none', 
          fontWeight: 600 
        }}
      >
        Dashboard
      </Link>
      <Link 
        to="/scanner" 
        style={{ 
          color: location.pathname === '/scanner' ? 'var(--brand-primary)' : 'var(--text-main)', 
          textDecoration: 'none', 
          fontWeight: 600 
        }}
      >
        Scanner
      </Link>
      <Link 
        to="/user" 
        style={{ 
          color: location.pathname === '/user' ? 'var(--brand-primary)' : 'var(--text-main)', 
          textDecoration: 'none', 
          fontWeight: 600 
        }}
      >
        User
      </Link>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/user" element={<User />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
