import './App.css'

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f1f5f9', color: '#0f172a' }}>
      <h1 style={{ fontSize: '3rem', color: '#AC3520', marginBottom: '0.5rem' }}>E-stamp Open World</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '3rem', color: '#64748b' }}>Select an application to launch</p>
      
      <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
        <a href="/dashboard" style={cardStyle}>
          <h2>Admin Dashboard</h2>
          <p>Manage the event, view real-time stats.</p>
        </a>
        <a href="/scanner" style={cardStyle}>
          <h2>QR Scanner</h2>
          <p>For staff to scan student QR codes.</p>
        </a>
        <a href="/user" style={cardStyle}>
          <h2>User Passport</h2>
          <p>For students to view their stamps.</p>
        </a>
      </div>
    </div>
  )
}

const cardStyle = {
  display: 'block',
  padding: '2rem',
  backgroundColor: 'white',
  borderRadius: '1rem',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  textDecoration: 'none',
  color: 'inherit',
  width: '250px',
  textAlign: 'center' as const,
  border: '2px solid transparent',
  transition: 'transform 0.2s, border-color 0.2s'
}

export default App
