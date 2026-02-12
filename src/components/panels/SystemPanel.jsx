import { useEffect } from 'react';
import HudPanel from '../shared/HudPanel';
import StatsGauges from './StatsGauges';
import ActivityFeed from './ActivityFeed';
import MiniCalendar from './MiniCalendar';
import taskApi from '../../services/taskApi';
import useTaskStore from '../../store/useTaskStore';

export default function SystemPanel() {
  const { stats, setStats } = useTaskStore();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await taskApi.getStats();
        setStats(res.data ?? {});
      } catch (err) {
        console.error('[SystemPanel] Failed to fetch stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [setStats]);

  return (
    <HudPanel
      title="SYSTEM INTELLIGENCE"
      cornerDecorations
      style={{
        width: '300px',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        overflow: 'hidden',
      }}
    >
      {/* System Vitals */}
      <div>
        <SectionLabel>System Vitals</SectionLabel>
        <StatsGauges stats={stats} />
      </div>

      {/* Activity Feed */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <SectionLabel>Activity Feed</SectionLabel>
        <ActivityFeed />
      </div>

      {/* Mini Calendar */}
      <div>
        <SectionLabel>Calendar</SectionLabel>
        <MiniCalendar />
      </div>
    </HudPanel>
  );
}

function SectionLabel({ children }) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-display)',
        fontSize: '10px',
        letterSpacing: '0.12em',
        color: 'var(--hud-white-dim)',
        textTransform: 'uppercase',
        display: 'block',
        marginBottom: '8px',
      }}
    >
      {children}
    </span>
  );
}
