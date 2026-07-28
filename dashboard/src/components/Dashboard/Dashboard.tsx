import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Download,
  Gift,
  MapPin,
  Moon,
  Sun,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import './Dashboard.css';

type Zone = 'front' | 'back';
type ZoneFilter = 'all' | Zone;

interface ActivityItem {
  id: string | number;
  user: string;
  action: string;
  target: string;
  time: string;
}

interface BoothItem {
  id: string;
  name: string;
  zone: Zone;
  visits: number;
}

interface TimelineItem {
  time: string;
  attendees: number;
}

interface StampRow {
  front_booths_visited: string[] | null;
  back_booths_visited: string[] | null;
  is_collect_reward: boolean | null;
}

interface BoothRow {
  id: string;
  name: string;
  zone: Zone;
}

interface ActivityLogRow {
  id: string | number;
  action_type: string;
  created_at: string;
  booth_id: string | null;
  user_info: { name: string | null; student_id: string | null } | { name: string | null; student_id: string | null }[] | null;
  booths: { name: string; zone: Zone } | { name: string; zone: Zone }[] | null;
}

interface FunnelItem {
  range: string;
  attendees: number;
}

function firstRelation<T>(relation: T | T[] | null): T | null {
  return Array.isArray(relation) ? relation[0] ?? null : relation;
}

function percent(count: number, total: number): string {
  return total > 0 ? `${Math.round((count / total) * 100)}%` : '';
}

function createFunnel(rows: StampRow[], zone: Zone, boothTotal: number): FunnelItem[] {
  const firstEnd = Math.max(1, Math.ceil(boothTotal / 3));
  const secondEnd = Math.max(firstEnd + 1, Math.ceil((boothTotal * 2) / 3));
  const counts = [0, 0, 0, 0];
  const key = zone === 'front' ? 'front_booths_visited' : 'back_booths_visited';

  rows.forEach((row) => {
    const stamps = row[key]?.length ?? 0;
    if (stamps === 0) counts[0] += 1;
    else if (stamps <= firstEnd) counts[1] += 1;
    else if (stamps <= secondEnd) counts[2] += 1;
    else counts[3] += 1;
  });

  return [
    { range: '0', attendees: counts[0] },
    { range: `1–${firstEnd}`, attendees: counts[1] },
    { range: `${firstEnd + 1}–${secondEnd}`, attendees: counts[2] },
    { range: `${secondEnd + 1}+`, attendees: counts[3] },
  ];
}

function csvCell(value: string | number | null): string {
  const text = value == null ? '' : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

const Dashboard: React.FC = () => {
  const [stampRows, setStampRows] = useState<StampRow[]>([]);
  const [boothRows, setBoothRows] = useState<BoothRow[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLogRow[]>([]);
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>('all');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    return () => document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const [stampsResult, boothsResult, logsResult] = await Promise.all([
          supabase
            .from('user_stamps')
            .select('front_booths_visited, back_booths_visited, is_collect_reward'),
          supabase.from('booths').select('id, name, zone').order('name'),
          supabase
            .from('activity_log')
            .select(`
              id,
              action_type,
              created_at,
              booth_id,
              user_info ( name, student_id ),
              booths ( name, zone )
            `)
            .order('created_at', { ascending: false }),
        ]);

        const queryError = stampsResult.error ?? boothsResult.error ?? logsResult.error;
        if (queryError) throw queryError;

        setStampRows((stampsResult.data ?? []) as StampRow[]);
        setBoothRows((boothsResult.data ?? []) as BoothRow[]);
        setActivityLogs((logsResult.data ?? []) as unknown as ActivityLogRow[]);
      } catch (dashboardError) {
        console.error('Error fetching dashboard data:', dashboardError);
        setError('โหลดข้อมูล Dashboard ไม่สำเร็จ กรุณาลองใหม่');
      } finally {
        setIsLoading(false);
      }
    };

    void fetchDashboardData();
    const subscription = supabase
      .channel('public:activity_log')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, () => {
        void fetchDashboardData();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(subscription);
    };
  }, []);

  const totalAttendees = stampRows.length;
  const rewardCount = stampRows.filter((row) => row.is_collect_reward).length;

  const boothsWithVisits = useMemo(() => {
    const boothMap = new Map<string, BoothItem>(
      boothRows.map((booth) => [booth.id, { ...booth, visits: 0 }]),
    );
    activityLogs.forEach((log) => {
      if (log.action_type !== 'check_in' || !log.booth_id) return;
      const booth = boothMap.get(log.booth_id);
      if (booth) booth.visits += 1;
    });
    return Array.from(boothMap.values());
  }, [activityLogs, boothRows]);

  const filteredBooths = useMemo(
    () => boothsWithVisits.filter((booth) => zoneFilter === 'all' || booth.zone === zoneFilter),
    [boothsWithVisits, zoneFilter],
  );
  const popularBoothsData = useMemo(
    () => [...filteredBooths].sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name, 'th')).slice(0, 5),
    [filteredBooths],
  );
  const leastVisitedBoothsData = useMemo(
    () => [...filteredBooths].sort((a, b) => a.visits - b.visits || a.name.localeCompare(b.name, 'th')).slice(0, 5),
    [filteredBooths],
  );

  const recentActivityData = useMemo<ActivityItem[]>(() => activityLogs.slice(0, 5).map((log) => {
    const user = firstRelation(log.user_info);
    const booth = firstRelation(log.booths);
    return {
      id: log.id,
      user: user?.name || user?.student_id || 'ไม่ทราบชื่อผู้เข้าร่วม',
      action: log.action_type === 'redeem_reward' ? 'รับรางวัลที่' : 'เช็กอินที่',
      target: log.action_type === 'redeem_reward' ? 'บูธรางวัล' : booth?.name || log.booth_id || 'ไม่ทราบชื่อบูธ',
      time: new Date(log.created_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }),
    };
  }), [activityLogs]);

  const checkInTimelineData = useMemo<TimelineItem[]>(() => {
    const timeGroups = new Map<string, { timestamp: number; attendees: number }>();
    activityLogs.forEach((log) => {
      if (log.action_type !== 'check_in') return;
      const date = new Date(log.created_at);
      date.setMinutes(0, 0, 0);
      const key = date.toISOString();
      const existing = timeGroups.get(key);
      if (existing) existing.attendees += 1;
      else timeGroups.set(key, { timestamp: date.getTime(), attendees: 1 });
    });
    const timeline = Array.from(timeGroups.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ timestamp, attendees }) => {
        const date = new Date(timestamp);
        const dateText = date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
        return { time: `${dateText} ${date.getHours().toString().padStart(2, '0')}:00`, attendees };
      });
    return timeline.length ? timeline : [{ time: 'รอข้อมูล', attendees: 0 }];
  }, [activityLogs]);

  const frontBoothTotal = boothRows.filter((booth) => booth.zone === 'front').length;
  const backBoothTotal = boothRows.filter((booth) => booth.zone === 'back').length;
  const frontFunnel = useMemo(() => createFunnel(stampRows, 'front', frontBoothTotal), [frontBoothTotal, stampRows]);
  const backFunnel = useMemo(() => createFunnel(stampRows, 'back', backBoothTotal), [backBoothTotal, stampRows]);

  const exportCsv = () => {
    const header = ['id', 'ชื่อผู้เข้าร่วม', 'รหัสนักศึกษา', 'ประเภทกิจกรรม', 'ชื่อบูธ', 'โซน', 'วันเวลา'];
    const rows = activityLogs.map((log) => {
      const user = firstRelation(log.user_info);
      const booth = firstRelation(log.booths);
      return [
        log.id,
        user?.name ?? '',
        user?.student_id ?? '',
        log.action_type,
        booth?.name ?? '',
        booth?.zone === 'front' ? 'โซนหน้า' : booth?.zone === 'back' ? 'โซนหลัง' : '',
        log.created_at,
      ];
    });
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `openworld-activity-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const topBooth = popularBoothsData[0];

  return (
    <div className="dashboard-container">
      <header className="dashboard-header animate-fade-in">
        <div>
          <p className="dashboard-eyebrow">KMUTNB OPEN WORLD</p>
          <h1 className="dashboard-title">แดชบอร์ดกิจกรรม</h1>
          <p className="dashboard-subtitle">ภาพรวมการเข้าร่วมกิจกรรมแบบเรียลไทม์</p>
        </div>
        <div className="dashboard-actions">
          <button className="dashboard-action-button glass" type="button" onClick={exportCsv} disabled={!activityLogs.length}>
            <Download size={18} />
            <span>ส่งออก CSV</span>
          </button>
          <button className="dashboard-icon-button glass" type="button" onClick={() => setIsDarkMode(!isDarkMode)} aria-label="สลับโหมดสี">
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="status-badge glass">
            <i />
            <span>ระบบออนไลน์</span>
          </div>
        </div>
      </header>

      {error && <div className="dashboard-error" role="alert">{error}</div>}

      <div className="zone-toolbar glass animate-fade-in" aria-label="กรองข้อมูลตามโซน">
        <span>แสดงข้อมูลบูธ</span>
        <div className="zone-toggle">
          {([
            ['all', 'ทั้งหมด'],
            ['front', 'โซนหน้า'],
            ['back', 'โซนหลัง'],
          ] as const).map(([value, label]) => (
            <button key={value} type="button" className={zoneFilter === value ? 'active' : ''} onClick={() => setZoneFilter(value)} aria-pressed={zoneFilter === value}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard title="ผู้เข้าร่วมทั้งหมด" value={isLoading ? '...' : totalAttendees.toLocaleString()} detail="อัปเดตแบบเรียลไทม์" icon={<Users size={20} />} delay="delay-100" />
        <MetricCard
          title="บูธยอดนิยม"
          value={isLoading ? '...' : topBooth?.visits ? topBooth.name : 'ยังไม่มีข้อมูล'}
          detail={topBooth?.visits ? `${topBooth.visits.toLocaleString()} ครั้ง` : 'รอการเช็กอิน'}
          icon={<MapPin size={20} />}
          delay="delay-200"
          textValue
        />
        <MetricCard
          title="รับรางวัลแล้ว"
          value={isLoading ? '...' : `${rewardCount.toLocaleString()} คน`}
          detail={totalAttendees ? `${percent(rewardCount, totalAttendees)} ของผู้เข้าร่วมทั้งหมด` : 'ยังไม่มีผู้เข้าร่วม'}
          icon={<Gift size={20} />}
          delay="delay-300"
        />
      </div>

      <div className="dashboard-content-grid">
        <section className="chart-section glass glass-card animate-fade-in delay-200">
          <h2 className="section-title"><Activity size={20} className="text-brand-gradient" />การเช็กอินตามวันและเวลา</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={checkInTimelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttendees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--card-border)', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="attendees" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendees)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="feed-section glass glass-card animate-fade-in delay-300">
          <h2 className="section-title"><CheckCircle2 size={20} className="text-brand-gradient" />กิจกรรมล่าสุด</h2>
          <div className="feed-list">
            {recentActivityData.length ? recentActivityData.map((item) => (
              <div key={item.id} className="feed-item">
                <div className="feed-icon">{item.action.includes('รับรางวัล') ? <Gift size={16} /> : <MapPin size={16} />}</div>
                <div className="feed-content">
                  <div className="feed-text">{item.user} {item.action} <span>{item.target}</span></div>
                  <div className="feed-time">{item.time}</div>
                </div>
              </div>
            )) : <p className="empty-message">ยังไม่มีกิจกรรมล่าสุด</p>}
          </div>
        </section>
      </div>

      <div className="booth-grid">
        <BoothChart title="อันดับบูธ" data={popularBoothsData} emptyText="ยังไม่มีข้อมูลบูธ" />
        <BoothChart title="บูธที่คนไปน้อยที่สุด" data={leastVisitedBoothsData} emptyText="ยังไม่มีข้อมูลบูธ" muted />
      </div>

      <section className="funnel-section glass glass-card animate-fade-in">
        <div className="section-heading">
          <div>
            <h2 className="section-title">ความคืบหน้าการสะสมแสตมป์</h2>
            <p>จำนวนผู้เข้าร่วม แบ่งตามจำนวนบูธที่สะสมได้ในแต่ละโซน</p>
          </div>
        </div>
        <div className="funnel-grid">
          <FunnelChart title={`โซนหน้า · ${frontBoothTotal} บูธ`} data={frontFunnel} />
          <FunnelChart title={`โซนหลัง · ${backBoothTotal} บูธ`} data={backFunnel} />
        </div>
      </section>
    </div>
  );
};

function MetricCard({ title, value, detail, icon, delay, textValue = false }: { title: string; value: string; detail: string; icon: React.ReactNode; delay: string; textValue?: boolean }) {
  return (
    <article className={`metric-card glass glass-card animate-fade-in ${delay}`}>
      <div className="metric-header"><h2 className="metric-title">{title}</h2><div className="metric-icon">{icon}</div></div>
      <div className={`metric-value${textValue ? ' metric-value-text' : ''}`}>{value}</div>
      <div className="metric-trend trend-up"><TrendingUp size={16} /><span>{detail}</span></div>
    </article>
  );
}

function BoothChart({ title, data, emptyText, muted = false }: { title: string; data: BoothItem[]; emptyText: string; muted?: boolean }) {
  return (
    <section className="booth-section glass glass-card animate-fade-in">
      <h2 className="section-title"><MapPin size={20} className="text-brand-gradient" />{title}</h2>
      {data.length ? <div className="booth-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 0, bottom: 0 }}>
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis dataKey="name" type="category" width={112} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ fill: 'rgba(172, 53, 32, 0.05)' }} contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--card-border)', borderRadius: '8px' }} />
            <Bar dataKey="visits" fill={muted ? 'var(--warning)' : 'var(--brand-primary)'} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div> : <p className="empty-message">{emptyText}</p>}
    </section>
  );
}

function FunnelChart({ title, data }: { title: string; data: FunnelItem[] }) {
  return (
    <div className="funnel-card">
      <h3>{title}</h3>
      <div className="funnel-chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
            <XAxis type="number" allowDecimals={false} hide />
            <YAxis dataKey="range" type="category" width={52} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--card-border)', borderRadius: '8px' }} />
            <Bar dataKey="attendees" fill="var(--brand-primary-light)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default Dashboard;
