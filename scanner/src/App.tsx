import './App.css'

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', backgroundColor: '#0f172a', color: 'white' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#AC3520' }}>Scanner App</h1>
      <div style={{ width: '300px', height: '300px', border: '4px dashed #AC3520', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '1rem', marginBottom: '2rem' }}>
        <p>Camera Feed Placeholder</p>
      </div>
      <a href="/" style={{ color: '#cbd5e1', textDecoration: 'underline' }}>Back to Hub</a>
    </div>
  )
}

export default App
