import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';
import './App.css';

function App() {
  return (
    <Router basename="/dashboard">
      <div className="app-container">
        <a href="/" style={{ color: 'var(--text-main)', textDecoration: 'underline', margin: '1rem', display: 'inline-block' }}>&larr; Back to Hub</a>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
