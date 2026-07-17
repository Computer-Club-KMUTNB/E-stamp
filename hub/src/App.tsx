import { LayoutDashboard, ScanLine, UserCircle } from 'lucide-react';
import './index.css';

function App() {
  return (
    <div className="hub-container">
      <header className="hub-header">
        <h1 className="hub-title">E-stamp <span>Open World</span></h1>
        <p className="hub-subtitle">Select an application module to launch</p>
      </header>
      
      <div className="cards-grid">
        <a href="/dashboard" className="app-card">
          <div className="card-icon-wrapper">
            <LayoutDashboard size={40} strokeWidth={1.5} />
          </div>
          <h2 className="card-title">Admin Dashboard</h2>
          <p className="card-description">Manage events, booths, and view real-time statistics.</p>
        </a>

        <a href="/scanner" className="app-card">
          <div className="card-icon-wrapper">
            <ScanLine size={40} strokeWidth={1.5} />
          </div>
          <h2 className="card-title">QR Scanner</h2>
          <p className="card-description">For staff to scan student passports and award stamps.</p>
        </a>

        <a href="/user" className="app-card">
          <div className="card-icon-wrapper">
            <UserCircle size={40} strokeWidth={1.5} />
          </div>
          <h2 className="card-title">User Passport</h2>
          <p className="card-description">For students to view their collected stamps and rewards.</p>
        </a>
      </div>
    </div>
  );
}

export default App;
