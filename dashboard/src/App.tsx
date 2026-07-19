import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import Dashboard from './components/Dashboard/Dashboard';
import { supabase } from './lib/supabase';
import './App.css';

function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError('');
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    setLoading(false);
  }

  return <main className="auth-page"><section className="auth-card"><div className="auth-mark">E</div><p className="auth-eyebrow">ORGANIZER ACCESS</p><h1>เข้าสู่ระบบ Dashboard</h1><p className="auth-description">ข้อมูลในหน้านี้สำหรับทีมผู้จัดงานและเจ้าหน้าที่ที่ได้รับอนุญาตเท่านั้น</p><form onSubmit={submit}><label htmlFor="admin-email">อีเมล</label><input id="admin-email" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="organizer@example.com"/><label htmlFor="admin-password">รหัสผ่าน</label><input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)}/>{error && <p className="auth-error" role="alert">{error}</p>}<button disabled={loading}>{loading ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}</button></form><small>หากไม่มีบัญชี กรุณาติดต่อผู้ดูแล Supabase</small></section></main>;
}

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setChecking(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => { setSession(nextSession); setChecking(false); });
    return () => data.subscription.unsubscribe();
  }, []);

  if (checking) return <div className="auth-loading"><div/><p>กำลังตรวจสอบสิทธิ์…</p></div>;
  if (!session) return <LoginScreen />;
  return <div className="app-container"><header className="admin-bar"><span>{session.user.email}</span><button onClick={() => supabase.auth.signOut()}>ออกจากระบบ</button></header><Dashboard /></div>;
}

export default App;
