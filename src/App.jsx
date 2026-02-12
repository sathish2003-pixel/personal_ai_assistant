import { useEffect, useState, lazy, Suspense } from 'react';
import { Toaster, toast } from 'sonner';

// Stores (lightweight, no heavy deps)
import useAssistantStore from './store/useAssistantStore';
import useSettingsStore from './store/useSettingsStore';

// Services
import api from './services/api';

// Only the login page background — lightweight, no Three.js
import GridBackground from './components/hud/GridBackground';

// Boot sequence — lightweight overlay
import BootSequence from './components/overlays/BootSequence';

// Lazy-load the ENTIRE main HUD (Three.js, sounds, voice hooks, panels)
// This means login page loads instantly with zero Three.js/Howler overhead
const JarvisHUD = lazy(() => import('./components/JarvisHUD'));

function App() {
  const {
    isAuthenticated, isBooted, setBooted,
    token, login, logout, setUser,
  } = useAssistantStore();

  const { loadFromPreferences } = useSettingsStore();
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);

  // Auto-login check
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/api/auth/me');
          setUser(res.data);
          loadFromPreferences(res.data.preferences);
        } catch {
          logout();
        }
      }
    };
    checkAuth();
  }, []);

  // Auth handler
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    try {
      if (authMode === 'register') {
        await api.post('/api/auth/register', authForm);
        toast.success('Account created! Logging in...');
      }
      const loginPayload = {
        username: authForm.username,
        password: authForm.password,
      };
      if (authForm.email) loginPayload.email = authForm.email;
      const res = await api.post('/api/auth/login', loginPayload);
      login(res.data.access_token, res.data.refresh_token, null);
      const userRes = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${res.data.access_token}` },
      });
      setUser(userRes.data);
      loadFromPreferences(userRes.data.preferences);
    } catch (err) {
      const detail = err.response?.data?.detail;
      let msg = 'Authentication failed';
      if (typeof detail === 'string') {
        msg = detail;
      } else if (Array.isArray(detail)) {
        msg = detail.map((d) => d.msg || String(d)).join(', ');
      }
      toast.error(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleBootComplete = () => {
    setBooted(true);
    // Prime TTS on boot (user-initiated gesture)
    if (window.speechSynthesis) {
      const silent = new SpeechSynthesisUtterance('');
      silent.volume = 0;
      window.speechSynthesis.speak(silent);
    }
  };

  // ── Login Screen (lightweight — no Three.js, no sounds, no heavy hooks) ──
  if (!isAuthenticated || !token) {
    return (
      <div className="w-screen h-screen overflow-hidden relative flex items-center justify-center" style={{ background: 'var(--bg-void)' }}>
        <GridBackground />
        <div className="glass-panel p-8 w-96 relative z-10">
          <h1 className="font-display text-2xl tracking-widest text-center mb-6" style={{ color: 'var(--arc-blue)' }}>
            J.A.R.V.I.S.
          </h1>
          <p className="font-mono text-xs text-center mb-6" style={{ color: 'var(--hud-cyan-dim)' }}>
            {authMode === 'login' ? 'IDENTITY VERIFICATION REQUIRED' : 'NEW USER REGISTRATION'}
          </p>
          <form onSubmit={handleAuth} className="space-y-4">
            <input
              type="text"
              placeholder="Username"
              value={authForm.username}
              onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })}
              required
              className="w-full bg-transparent border-b px-3 py-2 text-sm font-body outline-none"
              style={{ borderColor: 'var(--border-hud)', color: 'var(--hud-white)' }}
            />
            {authMode === 'register' && (
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                required
                className="w-full bg-transparent border-b px-3 py-2 text-sm font-body outline-none"
                style={{ borderColor: 'var(--border-hud)', color: 'var(--hud-white)' }}
              />
            )}
            <input
              type="password"
              placeholder="Password"
              value={authForm.password}
              onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
              required
              minLength={6}
              className="w-full bg-transparent border-b px-3 py-2 text-sm font-body outline-none"
              style={{ borderColor: 'var(--border-hud)', color: 'var(--hud-white)' }}
            />
            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2 font-display text-sm tracking-widest uppercase transition-all"
              style={{
                background: 'var(--bg-glass)',
                border: '1px solid var(--arc-blue)',
                color: 'var(--arc-blue)',
                cursor: authLoading ? 'wait' : 'pointer',
              }}
            >
              {authLoading ? 'VERIFYING...' : authMode === 'login' ? 'AUTHENTICATE' : 'REGISTER'}
            </button>
          </form>
          <p
            className="text-center mt-4 text-xs font-mono cursor-pointer"
            style={{ color: 'var(--hud-cyan-dim)' }}
            onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
          >
            {authMode === 'login' ? 'CREATE NEW IDENTITY' : 'EXISTING USER? LOGIN'}
          </p>
        </div>
        <Toaster theme="dark" position="top-right" />
      </div>
    );
  }

  // ── Boot Sequence ──
  if (!isBooted) {
    return <BootSequence onComplete={handleBootComplete} />;
  }

  // ── Main HUD (lazy-loaded — Three.js, sounds, voice all load here) ──
  return (
    <Suspense
      fallback={
        <div
          className="w-screen h-screen flex items-center justify-center"
          style={{ background: 'var(--bg-void)' }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                width: 48, height: 48, margin: '0 auto 16px',
                borderRadius: '50%',
                border: '2px solid rgba(0,229,255,0.3)',
                borderTop: '2px solid var(--hud-cyan)',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 12, letterSpacing: '0.2em',
                color: 'var(--hud-cyan)', textTransform: 'uppercase',
              }}
            >
              Initializing Systems...
            </span>
          </div>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }
    >
      <JarvisHUD />
    </Suspense>
  );
}

export default App;
