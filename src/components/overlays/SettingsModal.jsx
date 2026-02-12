import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useSettingsStore from '../../store/useSettingsStore';
import { calendarApi } from '../../services/calendarApi';

/**
 * SettingsModal
 * HUD-styled settings panel overlay with glass panel design.
 *
 * Sections:
 *   - Voice: speed slider, pitch slider, voice selector
 *   - Audio: sounds toggle, volume slider
 *   - Display: theme (dark only currently)
 *
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 */

/* ---- Reusable HUD Slider ---- */
function HudSlider({ label, value, min, max, step, onChange, unit = '' }) {
  const displayVal =
    step < 1 ? value.toFixed(1) : Math.round(value).toString();

  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '6px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-body)',
            fontSize: '13px',
            color: 'var(--hud-white-dim)',
            fontWeight: 500,
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '12px',
            color: 'var(--arc-blue)',
          }}
        >
          {displayVal}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{
          width: '100%',
          height: '4px',
          appearance: 'none',
          WebkitAppearance: 'none',
          background: `linear-gradient(to right, var(--arc-blue) 0%, var(--arc-blue) ${((value - min) / (max - min)) * 100}%, var(--border-hud) ${((value - min) / (max - min)) * 100}%, var(--border-hud) 100%)`,
          borderRadius: '2px',
          outline: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  );
}

/* ---- HUD Toggle Switch ---- */
function HudToggle({ label, checked, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}
    >
      <span
        style={{
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: 'var(--hud-white-dim)',
          fontWeight: 500,
        }}
      >
        {label}
      </span>

      <button
        onClick={() => onChange(!checked)}
        style={{
          width: '44px',
          height: '22px',
          borderRadius: '11px',
          border: `1px solid ${checked ? 'var(--hud-cyan)' : 'var(--border-hud)'}`,
          background: checked
            ? 'rgba(0,229,255,0.15)'
            : 'rgba(79,195,247,0.05)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all 0.25s ease',
          padding: 0,
          outline: 'none',
          boxShadow: checked ? '0 0 8px rgba(0,229,255,0.2)' : 'none',
        }}
      >
        <motion.div
          animate={{ x: checked ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: checked ? 'var(--hud-cyan)' : 'var(--border-hud-bright)',
            position: 'absolute',
            top: '2px',
            left: '0px',
            boxShadow: checked ? '0 0 6px rgba(0,229,255,0.4)' : 'none',
          }}
        />
      </button>
    </div>
  );
}

/* ---- HUD Select/Dropdown ---- */
function HudSelect({ label, value, options, onChange }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <span
        style={{
          display: 'block',
          fontFamily: 'var(--font-body)',
          fontSize: '13px',
          color: 'var(--hud-white-dim)',
          fontWeight: 500,
          marginBottom: '6px',
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          color: 'var(--hud-white)',
          background: 'rgba(13,17,23,0.9)',
          border: '1px solid var(--border-hud)',
          borderRadius: '3px',
          outline: 'none',
          cursor: 'pointer',
          appearance: 'none',
          WebkitAppearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M3 5l3 3 3-3' stroke='%234FC3F7' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          paddingRight: '32px',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---- Section Header ---- */
function SectionHeader({ title }) {
  return (
    <div style={{ marginBottom: '14px', marginTop: '6px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'var(--arc-blue)',
            textShadow: '0 0 8px rgba(79,195,247,0.3)',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
        <div
          style={{
            flex: 1,
            height: '1px',
            background:
              'linear-gradient(to right, var(--border-hud-bright), transparent)',
          }}
        />
      </div>
    </div>
  );
}

/* ---- Voice Selector Options ---- */
const VOICE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'en-US-Neural2-A', label: 'Neural A (Male)' },
  { value: 'en-US-Neural2-C', label: 'Neural C (Female)' },
  { value: 'en-US-Neural2-D', label: 'Neural D (Male)' },
  { value: 'en-US-Neural2-F', label: 'Neural F (Female)' },
  { value: 'en-GB-Neural2-B', label: 'British (Male)' },
  { value: 'en-GB-Neural2-A', label: 'British (Female)' },
];

/* ---- Main Component ---- */
export default function SettingsModal({ isOpen, onClose }) {
  const {
    voiceSpeed,
    voicePitch,
    voiceName,
    soundsEnabled,
    soundsVolume,
    theme,
    setVoiceSpeed,
    setVoicePitch,
    setVoiceName,
    setSoundsEnabled,
    setSoundsVolume,
  } = useSettingsStore();

  // Local state for editing (apply on Save)
  const [localSpeed, setLocalSpeed] = useState(voiceSpeed);
  const [localPitch, setLocalPitch] = useState(voicePitch);
  const [localVoice, setLocalVoice] = useState(voiceName);
  const [localSoundsEnabled, setLocalSoundsEnabled] = useState(soundsEnabled);
  const [localVolume, setLocalVolume] = useState(soundsVolume);

  // Google Calendar state
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const panelRef = useRef(null);

  // Sync local state when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSpeed(voiceSpeed);
      setLocalPitch(voicePitch);
      setLocalVoice(voiceName);
      setLocalSoundsEnabled(soundsEnabled);
      setLocalVolume(soundsVolume);
      // Check calendar connection status
      calendarApi.getStatus()
        .then((res) => setCalendarConnected(res.data.connected))
        .catch(() => setCalendarConnected(false));
    }
  }, [isOpen, voiceSpeed, voicePitch, voiceName, soundsEnabled, soundsVolume]);

  // Listen for Google OAuth popup callback
  useEffect(() => {
    if (!isOpen) return;
    const handleMessage = (e) => {
      if (e.data === 'google-calendar-success') {
        setCalendarConnected(true);
        setCalendarLoading(false);
      } else if (e.data === 'google-calendar-error') {
        setCalendarLoading(false);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen]);

  const handleConnectCalendar = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const res = await calendarApi.getAuthUrl();
      const popup = window.open(res.data.url, 'google-calendar-auth', 'width=500,height=600,left=200,top=100');
      // If popup blocked, reset loading
      if (!popup) setCalendarLoading(false);
    } catch {
      setCalendarLoading(false);
    }
  }, []);

  const handleSyncCalendar = useCallback(async () => {
    setCalendarLoading(true);
    setSyncResult(null);
    try {
      const res = await calendarApi.sync();
      const { created, updated, cancelled } = res.data;
      setSyncResult(`Synced: ${created} new, ${updated} updated, ${cancelled} removed`);
      setTimeout(() => setSyncResult(null), 4000);
    } catch {
      setSyncResult('Sync failed');
      setTimeout(() => setSyncResult(null), 3000);
    }
    setCalendarLoading(false);
  }, []);

  const handleDisconnectCalendar = useCallback(async () => {
    setCalendarLoading(true);
    try {
      await calendarApi.disconnect();
      setCalendarConnected(false);
    } catch { /* ignore */ }
    setCalendarLoading(false);
  }, []);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  // Click outside to close
  const handleBackdropClick = useCallback(
    (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        onClose?.();
      }
    },
    [onClose]
  );

  const handleSave = useCallback(() => {
    setVoiceSpeed(localSpeed);
    setVoicePitch(localPitch);
    setVoiceName(localVoice);
    setSoundsEnabled(localSoundsEnabled);
    setSoundsVolume(localVolume);
    onClose?.();
  }, [
    localSpeed,
    localPitch,
    localVoice,
    localSoundsEnabled,
    localVolume,
    setVoiceSpeed,
    setVoicePitch,
    setVoiceName,
    setSoundsEnabled,
    setSoundsVolume,
    onClose,
  ]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="settings-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 48,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            ref={panelRef}
            key="settings-panel"
            initial={{ opacity: 0, y: -30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.96 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 28,
              opacity: { duration: 0.25 },
            }}
            style={{
              width: '420px',
              maxWidth: '90vw',
              maxHeight: '80vh',
              overflowY: 'auto',
              background: 'var(--bg-panel)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: '1px solid var(--border-hud-bright)',
              borderRadius: '6px',
              boxShadow:
                '0 0 30px rgba(79,195,247,0.1), 0 8px 40px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top accent */}
            <div
              style={{
                height: '2px',
                background:
                  'linear-gradient(to right, transparent, var(--arc-blue), transparent)',
              }}
            />

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px 12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                {/* Gear icon */}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ color: 'var(--arc-blue)' }}
                >
                  <path
                    d="M12 15a3 3 0 100-6 3 3 0 000 6z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '12px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'var(--arc-blue)',
                    textShadow: '0 0 8px rgba(79,195,247,0.3)',
                  }}
                >
                  SETTINGS
                </span>
              </div>

              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  border: '1px solid var(--border-hud)',
                  background: 'transparent',
                  color: 'var(--hud-white-dim)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  outline: 'none',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--status-error)';
                  e.currentTarget.style.color = 'var(--status-error)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-hud)';
                  e.currentTarget.style.color = 'var(--hud-white-dim)';
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M1 1l10 10M11 1L1 11"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </motion.button>
            </div>

            {/* Content */}
            <div style={{ padding: '4px 20px 20px' }}>
              {/* --- VOICE SECTION --- */}
              <SectionHeader title="Voice" />

              <HudSlider
                label="Speed"
                value={localSpeed}
                min={0.5}
                max={2.0}
                step={0.1}
                onChange={setLocalSpeed}
                unit="x"
              />

              <HudSlider
                label="Pitch"
                value={localPitch}
                min={0.5}
                max={2.0}
                step={0.1}
                onChange={setLocalPitch}
              />

              <HudSelect
                label="Voice"
                value={localVoice}
                options={VOICE_OPTIONS}
                onChange={setLocalVoice}
              />

              {/* --- AUDIO SECTION --- */}
              <SectionHeader title="Audio" />

              <HudToggle
                label="Sound Effects"
                checked={localSoundsEnabled}
                onChange={setLocalSoundsEnabled}
              />

              <HudSlider
                label="Volume"
                value={localVolume}
                min={0}
                max={1}
                step={0.05}
                onChange={setLocalVolume}
              />

              {/* --- DISPLAY SECTION --- */}
              <SectionHeader title="Display" />

              <HudSelect
                label="Theme"
                value={theme}
                options={[{ value: 'dark', label: 'Dark (JARVIS HUD)' }]}
                onChange={() => {
                  /* Only dark mode for now */
                }}
              />

              {/* --- INTEGRATIONS SECTION --- */}
              <SectionHeader title="Integrations" />

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  padding: '10px 12px',
                  background: 'rgba(79, 195, 247, 0.04)',
                  border: '1px solid var(--border-hud)',
                  borderRadius: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {/* Google Calendar icon */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" stroke="var(--arc-blue)" strokeWidth="1.5" />
                    <line x1="3" y1="10" x2="21" y2="10" stroke="var(--arc-blue)" strokeWidth="1.5" />
                    <line x1="16" y1="2" x2="16" y2="6" stroke="var(--arc-blue)" strokeWidth="1.5" strokeLinecap="round" />
                    <line x1="8" y1="2" x2="8" y2="6" stroke="var(--arc-blue)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px',
                      color: 'var(--hud-white)',
                      fontWeight: 500,
                    }}>
                      Google Calendar
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '10px',
                      color: calendarConnected ? '#00E676' : 'var(--hud-white-dim)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      marginTop: '2px',
                    }}>
                      <span style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: calendarConnected ? '#00E676' : '#FF5252',
                        display: 'inline-block',
                        boxShadow: calendarConnected ? '0 0 6px rgba(0,230,118,0.5)' : 'none',
                      }} />
                      {calendarConnected ? 'Connected' : 'Not connected'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {calendarConnected && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSyncCalendar}
                      disabled={calendarLoading}
                      style={{
                        padding: '6px 12px',
                        fontFamily: 'var(--font-display)',
                        fontSize: '9px',
                        fontWeight: 700,
                        letterSpacing: '0.15em',
                        textTransform: 'uppercase',
                        color: 'var(--arc-blue)',
                        background: 'rgba(79,195,247,0.1)',
                        border: '1px solid var(--arc-blue)',
                        borderRadius: '3px',
                        cursor: calendarLoading ? 'wait' : 'pointer',
                        opacity: calendarLoading ? 0.6 : 1,
                        outline: 'none',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M23 4v6h-6" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                      {calendarLoading ? '...' : 'Sync'}
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={calendarConnected ? handleDisconnectCalendar : handleConnectCalendar}
                    disabled={calendarLoading}
                    style={{
                      padding: '6px 12px',
                      fontFamily: 'var(--font-display)',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      color: calendarConnected ? '#FF5252' : 'var(--hud-cyan)',
                      background: calendarConnected
                        ? 'rgba(255,82,82,0.1)'
                        : 'rgba(0,229,255,0.1)',
                      border: `1px solid ${calendarConnected ? '#FF5252' : 'var(--hud-cyan)'}`,
                      borderRadius: '3px',
                      cursor: calendarLoading ? 'wait' : 'pointer',
                      opacity: calendarLoading ? 0.6 : 1,
                      outline: 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {calendarLoading ? '...' : calendarConnected ? 'Disconnect' : 'Connect'}
                  </motion.button>
                </div>
              </div>

              {/* Sync result feedback */}
              {syncResult && (
                <div style={{
                  marginTop: '-10px',
                  marginBottom: '12px',
                  padding: '6px 10px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '10px',
                  color: syncResult.includes('failed') ? '#FF5252' : '#00E676',
                  background: syncResult.includes('failed') ? 'rgba(255,82,82,0.06)' : 'rgba(0,230,118,0.06)',
                  border: `1px solid ${syncResult.includes('failed') ? 'rgba(255,82,82,0.2)' : 'rgba(0,230,118,0.2)'}`,
                  borderRadius: '3px',
                  textAlign: 'center',
                }}>
                  {syncResult}
                </div>
              )}

              {/* Save Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  padding: '10px 0',
                  border: '1px solid var(--hud-cyan)',
                  borderRadius: '3px',
                  background: 'rgba(0,229,255,0.1)',
                  color: 'var(--hud-cyan)',
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'background 0.2s, box-shadow 0.2s',
                  boxShadow: '0 0 10px rgba(0,229,255,0.15)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0,229,255,0.2)';
                  e.currentTarget.style.boxShadow = '0 0 18px rgba(0,229,255,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0,229,255,0.1)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(0,229,255,0.15)';
                }}
              >
                Save &amp; Apply
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
