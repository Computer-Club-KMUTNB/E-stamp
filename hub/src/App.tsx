import { ArrowUpRight, QrCode, Sparkles } from 'lucide-react';
import './index.css';

function App() {
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

      <section className="module-section" aria-labelledby="public-info-title"><div className="section-heading"><div><span>สำหรับผู้เข้าร่วม</span><h2 id="public-info-title">เริ่มต้นได้ใน 3 ขั้นตอน</h2></div></div><div className="cards-grid">{[['01','ลงทะเบียน','กรอกชื่อและรหัสนักศึกษาเพื่อรับ QR ส่วนตัว'],['02','สะสมแสตมป์','แสดง QR ให้เจ้าหน้าที่ประจำบูธสแกน'],['03','รับรางวัล','สะสมครบทุกบูธแล้วนำ QR ไปตรวจรับรางวัล']].map(([no,title,detail])=><article className="app-card" key={no}><div className="card-top"><div className="card-icon-wrapper">{no}</div></div><div><h3>{title}</h3><p>{detail}</p></div></article>)}</div></section>
    </main>
  );
}

export default App;
