import { useState, useMemo, useEffect } from 'react';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isToday,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns';
import useTaskStore from '../../store/useTaskStore';

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function MiniCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { todayTasks, upcomingTasks } = useTaskStore();

  // Collect all task dates into a Set for dot indicators
  const taskDates = useMemo(() => {
    const dates = new Set();
    const allTasks = [...(todayTasks || []), ...(upcomingTasks || [])];
    allTasks.forEach((task) => {
      if (task.due_date) {
        // Normalize to YYYY-MM-DD string
        dates.add(task.due_date.slice(0, 10));
      }
    });
    return dates;
  }, [todayTasks, upcomingTasks]);

  // Calendar grid data
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);

    // Pad the beginning with nulls for alignment
    const paddedDays = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      paddedDays.push(null);
    }
    daysInMonth.forEach((day) => paddedDays.push(day));

    return paddedDays;
  }, [currentMonth]);

  const handlePrevMonth = () => setCurrentMonth((m) => subMonths(m, 1));
  const handleNextMonth = () => setCurrentMonth((m) => addMonths(m, 1));

  return (
    <div>
      {/* Month/Year header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
        }}
      >
        <button
          onClick={handlePrevMonth}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--hud-white-dim)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            padding: '2px 6px',
            opacity: 0.6,
          }}
        >
          &#9664;
        </button>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: 'var(--hud-white)',
            textTransform: 'uppercase',
          }}
        >
          {format(currentMonth, 'MMM yyyy')}
        </span>
        <button
          onClick={handleNextMonth}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--hud-white-dim)',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            padding: '2px 6px',
            opacity: 0.6,
          }}
        >
          &#9654;
        </button>
      </div>

      {/* Day labels */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
          marginBottom: '4px',
        }}
      >
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: '8px',
              color: 'var(--hud-white-dim)',
              opacity: 0.5,
              padding: '2px 0',
              letterSpacing: '0.05em',
            }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '1px',
        }}
      >
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} style={{ padding: '3px' }} />;
          }

          const dateStr = format(day, 'yyyy-MM-dd');
          const today = isToday(day);
          const hasTask = taskDates.has(dateStr);

          return (
            <div
              key={dateStr}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3px 0',
                cursor: 'default',
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '9px',
                  lineHeight: 1,
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  color: today ? '#0a0a0f' : 'var(--hud-white-dim)',
                  background: today ? 'var(--arc-blue)' : 'transparent',
                  boxShadow: today ? '0 0 8px rgba(79, 195, 247, 0.5)' : 'none',
                  fontWeight: today ? 700 : 400,
                  transition: 'background 0.2s, color 0.2s',
                }}
              >
                {format(day, 'd')}
              </span>
              {/* Task dot indicator */}
              {hasTask && (
                <span
                  style={{
                    position: 'absolute',
                    bottom: '0px',
                    width: '3px',
                    height: '3px',
                    borderRadius: '50%',
                    background: today ? 'var(--hud-gold)' : 'var(--arc-blue)',
                    boxShadow: `0 0 4px ${today ? 'var(--hud-gold)' : 'var(--arc-blue)'}`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
