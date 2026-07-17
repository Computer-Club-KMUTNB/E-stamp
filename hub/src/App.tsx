import { ArrowUpRight, LayoutDashboard, QrCode, ScanLine, Sparkles } from 'lucide-react';
import './index.css';

function App() {
  const dashboardUrl = import.meta.env.DEV ? 'http://localhost:5174' : '/dashboard';
  const scannerUrl = import.meta.env.DEV ? 'http://localhost:3000/dev' : '/scanner';
  const registerUrl = import.meta.env.DEV ? 'http://localhost:3000/register' : '/register';

  return (
    <main className="hub-container">
      <nav className="hub-nav" aria-label="เมนูหลัก">
        <a className="brand-mark" href="/" aria-label="E-stamp home"><span>E</span> E-STAMP</a>
        <span className="live-pill"><i /> SYSTEM ONLINE</span>
      </nav>

      <section className="hub-hero">
        <div className="eyebrow"><Sparkles size={16} /> KMUTNB OPEN WORLD</div>
        <h1>สะสมทุกกิจกรรม<br/><span>จบใน QR เดียว</span></h1>
        <p>ระบบ E-Stamp สำหรับผู้เข้าร่วม เจ้าหน้าที่ประจำบูธ และทีมจัดงาน ใช้งานง่ายและติดตามผลแบบเรียลไทม์</p>
        <a className="register-cta" href={registerUrl}><QrCode size={20} /> ลงทะเบียนรับ QR <ArrowUpRight size={18} /></a>
      </section>

      <section className="module-section" aria-labelledby="module-title">
        <div className="section-heading"><div><span>สำหรับเจ้าหน้าที่</span><h2 id="module-title">เลือกพื้นที่ทำงาน</h2></div><p>ข้อมูลทั้งหมดเชื่อมต่อกับ Supabase ชุดเดียวกัน</p></div>
        <div className="cards-grid">
          <a href={scannerUrl} className="app-card scanner-card">
            <div className="card-top"><div className="card-icon-wrapper"><ScanLine size={30} /></div><ArrowUpRight className="arrow" size={22} /></div>
            <div><span className="card-kicker">BOOTH OPERATION</span><h3>QR Scanner</h3><p>เปิดกล้อง สแกนผู้เข้าร่วม และบันทึกแสตมป์ประจำบูธ</p></div>
          </a>
          <a href={dashboardUrl} className="app-card dashboard-card">
            <div className="card-top"><div className="card-icon-wrapper"><LayoutDashboard size={30} /></div><ArrowUpRight className="arrow" size={22} /></div>
            <div><span className="card-kicker">EVENT OVERVIEW</span><h3>Admin Dashboard</h3><p>ติดตามผู้เข้าร่วม การเช็กอิน บูธยอดนิยม และการรับรางวัล</p></div>
          </a>
        </div>
      </section>
    </main>
  );
}

export default App;
