import { useEffect, useMemo, useState } from 'react';
import {
  getClientTimezone,
  getCurrentTimeForUser,
  getGreetingForUser,
} from './timezone.js'

const STORAGE_KEY = 'ai-health-coach-profile'
const THEME_KEY = 'ai-health-coach-theme'

const AGENT_META = {
  zuna: { label: 'Zuna', displayName: 'Zuna — General wellness' },
  diabetes: { label: 'Tuna', displayName: 'Tuna — Diabetes intelligence' },
  heart_health: { label: 'Suna', displayName: 'Suna — Heart health intelligence' },
  muna: { label: 'Muna', displayName: 'Muna — Cancer support' },
  safety_triage: { label: 'Safety triage', displayName: 'Safety triage' },
}

const HEALTH_OPTIONS = [
  { value: 'zuna', label: 'General wellness' },
  { value: 'diabetes', label: 'Diabetes' },
  { value: 'heart_health', label: 'Heart health' },
  { value: 'muna', label: 'Cancer support' },
]

const THEME_OPTIONS = [
  { value: 'system', label: 'System default' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

function App() {
  const [message, setMessage] = useState('')
  const [goals, setGoals] = useState('sleep, hydration')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)
  const [healthFocus, setHealthFocus] = useState('zuna')
  const [activeAgent, setActiveAgent] = useState('zuna')
  const [safetyWarning, setSafetyWarning] = useState('')
  const [userTimezone, setUserTimezone] = useState(() => getClientTimezone())
  const [theme, setTheme] = useState(() => {
    const savedTheme = window.localStorage.getItem(THEME_KEY)
    return savedTheme || 'system'
  })

  useEffect(() => {
    const savedProfile = window.localStorage.getItem(STORAGE_KEY)
    if (!savedProfile) return

    try {
      const parsed = JSON.parse(savedProfile)
      if (parsed.healthFocus) setHealthFocus(parsed.healthFocus)
      if (parsed.activeAgent) setActiveAgent(parsed.activeAgent)
      if (parsed.timezone) setUserTimezone(parsed.timezone)
    } catch (error) {
      console.warn('Failed to parse saved profile:', error)
    }
  }, [])

  useEffect(() => {
    const baseTheme = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme

    document.documentElement.setAttribute('data-theme', baseTheme)
    window.localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ healthFocus, activeAgent, timezone: userTimezone }),
    )
  }, [healthFocus, activeAgent, userTimezone])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleThemeChange = () => {
      if (theme === 'system') {
        document.documentElement.setAttribute('data-theme', mediaQuery.matches ? 'dark' : 'light')
      }
    }

    mediaQuery.addEventListener('change', handleThemeChange)
    return () => mediaQuery.removeEventListener('change', handleThemeChange)
  }, [theme])

  const goalList = useMemo(
    () => goals.split(',').map((goal) => goal.trim()).filter(Boolean),
    [goals],
  )

  const activeAgentMeta = AGENT_META[activeAgent] || AGENT_META.zuna
  const greeting = getGreetingForUser(userTimezone)
  const currentLocalTime = getCurrentTimeForUser(userTimezone)

  const setAgent = (agentName) => {
    setActiveAgent(agentName)
    if (agentName === 'diabetes') setHealthFocus('diabetes')
    if (agentName === 'heart_health') setHealthFocus('heart_health')
    if (agentName === 'muna') setHealthFocus('muna')
    if (agentName === 'zuna') setHealthFocus('zuna')
  }

  const sendMessage = async () => {
    if (!message.trim()) return

    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          goals: goalList,
          context: { source: 'frontend-demo', health_focus: healthFocus },
          user_profile: { health_focus: healthFocus, timezone: userTimezone },
          selected_agent: activeAgent,
        }),
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      setReply(data.reply)
      setActiveAgent(data.active_agent || activeAgent)
      setSafetyWarning(data.safety_warning || '')
      if (data.active_agent) {
        setHealthFocus(
          data.active_agent === 'safety_triage' ? healthFocus : data.active_agent,
        )
      }
    } catch (error) {
      setReply(
        'The backend is not running yet. Start the FastAPI server and then try again. ' +
          error.message,
      )
      setActiveAgent('zuna')
      setSafetyWarning('')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <div className="panel">
        <div className="header-row">
          <div>
            <h1>AI Health Coach</h1>
            <p className="subtitle">
              {greeting} — {currentLocalTime}
            </p>
            <p className="subtitle" style={{ marginTop: 4 }}>
              Local timezone: {userTimezone}
            </p>
          </div>

          <div className="theme-picker">
            <label htmlFor="theme-select">Theme</label>
            <select
              id="theme-select"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="onboarding-card" style={{ marginBottom: 16 }}>
          <h2 style={{ marginBottom: 8 }}>Choose your focus</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {HEALTH_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setHealthFocus(option.value)
                  setActiveAgent(option.value === 'general_wellness' ? 'zuna' : option.value)
                }}
                className={healthFocus === option.value ? 'segment active' : 'segment'}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="agent-switcher" style={{ marginBottom: 12 }}>
          <strong>Switch agent:</strong>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <button type="button" className="agent-button" onClick={() => setAgent('zuna')}>Zuna — General wellness</button>
            <button type="button" className="agent-button" onClick={() => setAgent('diabetes')}>Tuna — Diabetes</button>
            <button type="button" className="agent-button" onClick={() => setAgent('heart_health')}>Suna — Heart health</button>
            <button type="button" className="agent-button" onClick={() => setAgent('muna')}>Muna — Cancer support</button>
          </div>
        </div>

        <div className="agent-badge" style={{ marginBottom: 12 }}>
          <strong>Active agent:</strong> {activeAgentMeta.displayName}
        </div>

        <label htmlFor="goals">Goals</label>
        <input
          id="goals"
          value={goals}
          onChange={(e) => setGoals(e.target.value)}
          placeholder="sleep, hydration, exercise"
        />

        <label htmlFor="message">Your message</label>
        <textarea
          id="message"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ask about sleep, blood sugar, heart health, or daily wellbeing..."
        />

        <button onClick={sendMessage} disabled={loading} className="primary-button">
          {loading ? 'Sending...' : 'Ask the coach'}
        </button>

        {safetyWarning && (
          <div className="safety-box" style={{ marginTop: 16, padding: 12, borderRadius: 8 }}>
            {safetyWarning}
          </div>
        )}

        <div className="reply-box" style={{ marginTop: 16 }}>
          <h2>Coach response</h2>
          <p>{reply || 'Your response will appear here.'}</p>
        </div>
      </div>
    </div>
  )
};

export default App;
