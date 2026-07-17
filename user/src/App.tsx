import './App.css'

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: '#AC3520' }}>Student Passport</h1>
      <p style={{ marginBottom: '2rem', color: '#64748b' }}>Student ID: 64010123</p>
      
      <div style={{ width: '250px', height: '250px', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
        <div style={{ width: '200px', height: '200px', backgroundColor: 'black' }}>
          {/* Fake QR code using black square */}
          <p style={{ color: 'white', textAlign: 'center', marginTop: '90px' }}>QR CODE</p>
        </div>
      </div>
      
      <p style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Stamps Collected: 5 / 10</p>
      
      <a href="/" style={{ color: '#64748b', textDecoration: 'underline', marginTop: '2rem' }}>Back to Hub</a>
    </div>
  )
}

export default App
