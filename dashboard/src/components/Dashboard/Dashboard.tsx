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

// Mock Data
const checkInTimelineData = [
  { time: '08:00', attendees: 120 },
  { time: '09:00', attendees: 450 },
  { time: '10:00', attendees: 890 },
  { time: '11:00', attendees: 1250 },
  { time: '12:00', attendees: 1420 },
  { time: '13:00', attendees: 1680 },
  { time: '14:00', attendees: 1890 },
];

const popularBoothsData = [
  { name: 'Engineering', visits: 850 },
  { name: 'Computer Sci', visits: 720 },
  { name: 'Business', visits: 600 },
  { name: 'Arts', visits: 450 },
  { name: 'Science', visits: 390 },
];

const recentActivityData = [
  { id: 1, user: 'Student 64010...', action: 'checked in at', target: 'Engineering Booth', time: 'Just now' },
  { id: 2, user: 'Student 64021...', action: 'redeemed', target: 'Grand Prize', time: '2 mins ago' },
  { id: 3, user: 'Student 63015...', action: 'completed', target: 'All 10 Booths', time: '5 mins ago' },
  { id: 4, user: 'Student 65002...', action: 'checked in at', target: 'Computer Sci Booth', time: '12 mins ago' },
  { id: 5, user: 'Student 64099...', action: 'checked in at', target: 'Business Booth', time: '15 mins ago' },
];

const Dashboard: React.FC = () => {
  const [currentAttendees, setCurrentAttendees] = useState(0);
  const [rewardsClaimed, setRewardsClaimed] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
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

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();

    // Set up real-time subscription for new check-ins
    const subscription = supabase
      .channel('public:user_stamps')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_stamps' }, payload => {
        console.log('Change received!', payload);
        fetchDashboardData(); // Refresh data when database changes
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
          <h1 className="dashboard-title text-brand-gradient">E-stamp Admin Dashboard</h1>
          <p className="dashboard-subtitle">Real-time overview of the KMUTNB Open World event</p>
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
            <h3 className="metric-title">Total Attendees</h3>
            <div className="metric-icon"><Users size={20} /></div>
          </div>
          <div className="metric-value">{isLoading ? '...' : currentAttendees.toLocaleString()}</div>
          <div className="metric-trend trend-up">
            <TrendingUp size={16} />
            <span>Live Data Sync</span>
          </div>
        </div>

        <div className="metric-card glass glass-card animate-fade-in delay-200">
          <div className="metric-header">
            <h3 className="metric-title">Most Popular Booth</h3>
            <div className="metric-icon"><MapPin size={20} /></div>
          </div>
          <div className="metric-value">Engineering</div>
          <div className="metric-trend trend-up">
            <TrendingUp size={16} />
            <span>850 total visits</span>
          </div>
        </div>

        <div className="metric-card glass glass-card animate-fade-in delay-300">
          <div className="metric-header">
            <h3 className="metric-title">Rewards Claimed</h3>
            <div className="metric-icon"><Gift size={20} /></div>
          </div>
          <div className="metric-value">{isLoading ? '...' : rewardsClaimed.toLocaleString()}</div>
          <div className="metric-trend trend-up">
            <TrendingUp size={16} />
            <span>Out of 1000 Total</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content-grid">
        <div className="chart-section glass glass-card animate-fade-in delay-200">
          <h3 className="section-title">
            <Activity size={20} className="text-brand-gradient" />
            Check-ins Over Time
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
            Live Activity Feed
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
            Top Booths
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
