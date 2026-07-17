import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import './App.css';

const Navigation = () => {
  const location = useLocation();
  
  return (
    <nav className="glass" style={{ margin: '1rem', padding: '1rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
      <Link 
        to="/" 
        style={{ 
          color: location.pathname === '/' ? 'var(--brand-primary)' : 'var(--text-main)', 
          textDecoration: 'none', 
          fontWeight: 600 
        }}
      >
        Dashboard Home
      </Link>
      <a 
        href="/scanner" 
        style={{ 
          color: 'var(--text-main)', 
          textDecoration: 'none', 
          fontWeight: 600 
        }}
      >
        Scanner App
      </a>
      <a 
        href="/user" 
        style={{ 
          color: 'var(--text-main)', 
          textDecoration: 'none', 
          fontWeight: 600 
        }}
      >
        User App
      </a>
    </nav>
  );
};

function App() {
  return (
    <Router basename="/dashboard">
      <div className="app-container">
        <Navigation />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          {/* Add more dashboard-specific routes here (e.g. /dashboard/settings) */}
        </Routes>
      </div>
    </Router>
  );
}

export default App;
