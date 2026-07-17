import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Gift, 
  TrendingUp, 
  Activity, 
  CheckCircle2,
  Moon,
  Sun
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { supabase } from '../../lib/supabase';
import './Dashboard.css';

// Type Definitions
interface ActivityItem {
  id: string | number;
  user: string;
  action: string;
  target: string;
  time: string;
}

interface BoothItem {
  name: string;
  visits: number;
}

interface TimelineItem {
  time: string;
  attendees: number;
}

const Dashboard: React.FC = () => {
  const [currentAttendees, setCurrentAttendees] = useState(0);
  const [rewardsClaimed, setRewardsClaimed] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Advanced Chart State
  const [checkInTimelineData, setCheckInTimelineData] = useState<TimelineItem[]>([{ time: 'Waiting...', attendees: 0 }]);
  const [popularBoothsData, setPopularBoothsData] = useState<BoothItem[]>([{ name: 'No data', visits: 0 }]);
  const [recentActivityData, setRecentActivityData] = useState<ActivityItem[]>([]);
  
  // Apply dark mode class to root
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  // Fetch real data from Supabase
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Fetch Total Attendees
        const { count: attendeeCount } = await supabase
          .from('user_stamps')
          .select('*', { count: 'exact', head: true });
        
        if (attendeeCount !== null) {
          setCurrentAttendees(attendeeCount);
        }

        // Fetch Total Rewards Claimed
        const { count: rewardCount } = await supabase
          .from('user_stamps')
          .select('*', { count: 'exact', head: true })
          .eq('is_collect_reward', true);
        
        if (rewardCount !== null) {
          setRewardsClaimed(rewardCount);
        }

        // Fetch Activity Logs for Charts
        const { data: logsData } = await supabase
          .from('activity_log')
          .select(`
            id,
            action_type,
            created_at,
            booth_id,
            user_info ( name, student_id ),
            booths ( name )
          `)
          .order('created_at', { ascending: false });

        if (logsData && logsData.length > 0) {
          // 1. Live Activity Feed (Top 5)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const formattedFeed = logsData.slice(0, 5).map((log: any) => ({
            id: log.id,
            user: log.user_info?.name || log.user_info?.student_id || 'Unknown Student',
            action: log.action_type === 'redeem_reward' ? 'redeemed' : 'checked in at',
            target: log.action_type === 'redeem_reward' ? 'Grand Prize' : (log.booths?.name || log.booth_id || 'Unknown Booth'),
            time: new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));
          setRecentActivityData(formattedFeed);

          // 2. Top Booths (Count frequencies)
          const boothCounts: Record<string, { name: string, visits: number }> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          logsData.forEach((log: any) => {
            if (log.action_type === 'check_in' && log.booths) {
              const bName = log.booths.name;
              if (!boothCounts[bName]) boothCounts[bName] = { name: bName, visits: 0 };
              boothCounts[bName].visits += 1;
            }
          });
          const sortedBooths = Object.values(boothCounts)
            .sort((a, b) => b.visits - a.visits)
            .slice(0, 5);
          if (sortedBooths.length > 0) setPopularBoothsData(sortedBooths);

          // 3. Check-ins Over Time (Group by hour)
          const timeGroups: Record<string, number> = {};
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          logsData.forEach((log: any) => {
            if (log.action_type === 'check_in') {
              const date = new Date(log.created_at);
              const hourStr = `${date.getHours().toString().padStart(2, '0')}:00`;
              timeGroups[hourStr] = (timeGroups[hourStr] || 0) + 1;
            }
          });
          
          const sortedTimes = Object.keys(timeGroups).sort();
          const formattedTimeline = sortedTimes.map(time => ({
            time,
            attendees: timeGroups[time]
          }));
          if (formattedTimeline.length > 0) setCheckInTimelineData(formattedTimeline);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Set up real-time subscription for new check-ins
    const subscription = supabase
      .channel('public:activity_log')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'activity_log' }, () => {
        fetchDashboardData(); // Refresh data when a new log arrives
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header animate-fade-in">
        <div>
          <p className="dashboard-eyebrow">KMUTNB OPEN WORLD</p>
          <h1 className="dashboard-title">Event Dashboard</h1>
          <p className="dashboard-subtitle">ภาพรวมการเข้าร่วมกิจกรรมแบบเรียลไทม์</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="glass"
            style={{ 
              padding: '0.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-main)'
            }}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <div className="status-badge glass" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '2rem' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--success)', boxShadow: '0 0 10px var(--success)' }}></div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>System Live</span>
          </div>
        </div>
      </header>

      <div className="metrics-grid">
        <div className="metric-card glass glass-card animate-fade-in delay-100">
          <div className="metric-header">
            <h3 className="metric-title">ผู้เข้าร่วมทั้งหมด</h3>
            <div className="metric-icon"><Users size={20} /></div>
          </div>
          <div className="metric-value">{isLoading ? '...' : currentAttendees.toLocaleString()}</div>
          <div className="metric-trend trend-up">
            <TrendingUp size={16} />
            <span>อัปเดตแบบเรียลไทม์</span>
          </div>
        </div>

        <div className="metric-card glass glass-card animate-fade-in delay-200">
          <div className="metric-header">
            <h3 className="metric-title">บูธยอดนิยม</h3>
            <div className="metric-icon"><MapPin size={20} /></div>
          </div>
          <div className="metric-value metric-value-text">{isLoading ? '...' : popularBoothsData[0]?.visits ? popularBoothsData[0].name : 'ยังไม่มีข้อมูล'}</div>
          <div className="metric-trend trend-up">
            <TrendingUp size={16} />
            <span>{popularBoothsData[0]?.visits ? `${popularBoothsData[0].visits.toLocaleString()} ครั้ง` : 'รอการเช็กอิน'}</span>
          </div>
        </div>

        <div className="metric-card glass glass-card animate-fade-in delay-300">
          <div className="metric-header">
            <h3 className="metric-title">รับรางวัลแล้ว</h3>
            <div className="metric-icon"><Gift size={20} /></div>
          </div>
          <div className="metric-value">{isLoading ? '...' : rewardsClaimed.toLocaleString()}</div>
          <div className="metric-trend trend-up">
            <TrendingUp size={16} />
            <span>จากผู้เข้าร่วมทั้งหมด</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="chart-section glass glass-card animate-fade-in delay-200">
          <h3 className="section-title">
            <Activity size={20} className="text-brand-gradient" />
            การเช็กอินตามเวลา
          </h3>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={checkInTimelineData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAttendees" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--brand-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--card-border)', borderRadius: '8px' }}
                  itemStyle={{ color: 'var(--text-main)' }}
                />
                <Area type="monotone" dataKey="attendees" stroke="var(--brand-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorAttendees)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="feed-section glass glass-card animate-fade-in delay-300">
          <h3 className="section-title">
            <CheckCircle2 size={20} className="text-brand-gradient" />
            กิจกรรมล่าสุด
          </h3>
          <div className="feed-list">
            {recentActivityData.map((item) => (
              <div key={item.id} className="feed-item">
                <div className="feed-icon">
                  {item.action.includes('redeemed') ? <Gift size={16} /> : <MapPin size={16} />}
                </div>
                <div className="feed-content">
                  <div className="feed-text">
                    {item.user} {item.action} <span>{item.target}</span>
                  </div>
                  <div className="feed-time">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
          
          <h3 className="section-title" style={{ marginTop: '2rem' }}>
            อันดับบูธ
          </h3>
          <div className="chart-container" style={{ minHeight: '200px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={popularBoothsData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(172, 53, 32, 0.05)' }}
                  contentStyle={{ backgroundColor: 'var(--tooltip-bg)', borderColor: 'var(--card-border)', borderRadius: '8px' }}
                />
                <Bar dataKey="visits" fill="var(--brand-primary)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
