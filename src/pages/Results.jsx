import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const baseFont = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"

const VERDICT_META = {
  'Strong Hire': { label: 'Strong Hire', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', dot: '#10b981' },
  'Hire':        { label: 'Hire',        color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', dot: '#10b981' },
  'Maybe':       { label: 'Maybe',       color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  'No Hire':     { label: 'No Hire',     color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#f87171' },
}

const SKILL_VERDICT_META = {
  'Strong':   { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  'Adequate': { color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
  'Weak':     { color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  'Bluffing': { color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
}

function scoreColor(s) {
  if (s >= 8) return '#059669'
  if (s >= 6) return '#d97706'
  if (s >= 4) return '#ea580c'
  return '#dc2626'
}

function ScoreRing({ score, size = 72 }) {
  const r = (size / 2) - 5
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const c = scoreColor(score / 10)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="5" />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth="5"
        strokeLinecap="round" strokeDasharray={`${fill} ${circ}`}
        style={{ transition: 'stroke-dasharray 1s ease' }} />
    </svg>
  )
}

function ScoreBar({ score }) {
  const c = scoreColor(score)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
      <div style={{ flex: 1, height: 6, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 999, background: c,
          width: `${(score / 10) * 100}%`, transition: 'width 0.8s ease',
        }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 700, color: c, minWidth: 28, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
        {score}
      </span>
    </div>
  )
}

function Badge({ children, meta }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600,
      color: meta.color, background: meta.bg, border: `1px solid ${meta.border}`,
      letterSpacing: '0.02em',
    }}>
      {children}
    </span>
  )
}

function SectionHeader({ title, subtitle }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2 style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: '0 0 4px', letterSpacing: '-0.01em' }}>{title}</h2>
      {subtitle && <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{subtitle}</p>}
    </div>
  )
}

export default function Results() {
  const navigate = useNavigate()
  const [evaluation, setEvaluation] = useState(null)
  const [learningPlan, setLearningPlan] = useState(null)
  const [openItem, setOpenItem] = useState(null)

  useEffect(() => {
    const ev = sessionStorage.getItem('evaluation')
    const lp = sessionStorage.getItem('learningPlan')
    if (!ev || ev === 'undefined' || ev === 'null') { navigate('/'); return }
    try {
      setEvaluation(JSON.parse(ev))
      setLearningPlan(lp && lp !== 'undefined' && lp !== 'null' ? JSON.parse(lp) : null)
    } catch { navigate('/') }
  }, [])

  if (!evaluation) return null

  const verdict = VERDICT_META[evaluation.interviewVerdict] || VERDICT_META['Maybe']
  const plan = learningPlan?.learningPlan || []
  const score = evaluation.overallScore ?? 0

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: baseFont }}>

      {/* Nav */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 32px', height: 56, position: 'sticky', top: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>AssessAI</span>
          <span style={{ fontSize: 13, color: '#9ca3af', marginLeft: 4 }}>/ Assessment Report</span>
        </div>
        <button
          onClick={() => { sessionStorage.clear(); navigate('/') }}
          style={{
            fontSize: 13, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb',
            borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.color = '#111827' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280' }}
        >
          ← New Assessment
        </button>
      </nav>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Hero card */}
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
          padding: '32px', marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.04)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {/* Score ring */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <ScoreRing score={score} size={80} />
              <div style={{
                position: 'absolute', inset: 0, display: 'flex',
                flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', lineHeight: 1 }}>{score}</span>
                <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>/100</span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <Badge meta={verdict}>{verdict.label}</Badge>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>Overall Score: {score}/100</span>
              </div>
              <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.7, margin: 0 }}>
                {evaluation.summary}
              </p>
            </div>
          </div>
        </div>

        {/* Skill Breakdown */}
        <div style={{
          background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
          padding: '28px 32px', marginBottom: 24,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}>
          <SectionHeader title="Skill Breakdown" subtitle={`${evaluation.skillScores?.length || 0} skills evaluated`} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {evaluation.skillScores?.map((s, i) => {
              const sv = SKILL_VERDICT_META[s.verdict] || SKILL_VERDICT_META['Adequate']
              return (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '180px 1fr auto',
                  alignItems: 'center', gap: 16, padding: '12px 0',
                  borderBottom: i < evaluation.skillScores.length - 1 ? '1px solid #f9fafb' : 'none',
                }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 3px' }}>{s.skill}</p>
                    {s.keyObservation && (
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, lineHeight: 1.4,
                        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical',
                      }}>{s.keyObservation}</p>
                    )}
                  </div>
                  <ScoreBar score={s.score} />
                  <Badge meta={sv}>{s.verdict}</Badge>
                </div>
              )
            })}
          </div>
        </div>

        {/* Gap Analysis */}
        {evaluation.skillScores?.some(s => s.verdict === 'Weak' || s.verdict === 'Bluffing') && (
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
            padding: '28px 32px', marginBottom: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <SectionHeader title="Gap Analysis" subtitle="Skills that need improvement" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {evaluation.skillScores.filter(s => s.verdict === 'Weak' || s.verdict === 'Bluffing').map((s, i) => {
                const sv = SKILL_VERDICT_META[s.verdict]
                return (
                  <div key={i} style={{
                    padding: '16px', border: `1px solid ${sv.border}`,
                    borderRadius: 10, background: sv.bg,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: 0 }}>{s.skill}</p>
                      <Badge meta={sv}>{s.verdict}</Badge>
                    </div>
                    {s.keyObservation && (
                      <p style={{ fontSize: 12, color: '#6b7280', margin: 0, lineHeight: 1.6 }}>{s.keyObservation}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Learning Plan */}
        {plan.length > 0 && (
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
            padding: '28px 32px', marginBottom: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <SectionHeader
                title="Learning Roadmap"
                subtitle={learningPlan?.totalEstimatedWeeks ? `~${learningPlan.totalEstimatedWeeks} weeks total` : 'Personalised plan'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {plan.map((item, i) => {
                const isOpen = openItem === i
                const isHigh = item.priority === 'High'
                return (
                  <div key={i} style={{
                    border: isOpen ? '1.5px solid #4f46e5' : '1px solid #e5e7eb',
                    borderRadius: 10, overflow: 'hidden',
                    background: isOpen ? '#fafafe' : '#fff',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}>
                    <button
                      onClick={() => setOpenItem(isOpen ? null : i)}
                      style={{
                        width: '100%', display: 'grid',
                        gridTemplateColumns: '28px 1fr auto',
                        alignItems: 'center', gap: 14, padding: '14px 18px',
                        background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}
                    >
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#9ca3af',
                        fontVariantNumeric: 'tabular-nums',
                      }}>{String(i + 1).padStart(2, '0')}</span>

                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>{item.skill}</p>
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                          {item.currentLevel} → {item.targetLevel}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{item.estimatedWeeks}w</span>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 5,
                          color: isHigh ? '#7c3aed' : '#6b7280',
                          background: isHigh ? '#ede9fe' : '#f3f4f6',
                          border: isHigh ? '1px solid #ddd6fe' : '1px solid #e5e7eb',
                        }}>{item.priority}</span>
                        <span style={{ fontSize: 16, color: '#9ca3af', lineHeight: 1, width: 18, textAlign: 'center' }}>
                          {isOpen ? '−' : '+'}
                        </span>
                      </div>
                    </button>

                    {isOpen && (
                      <div style={{ borderTop: '1px solid #e5e7eb', padding: '24px 18px 24px 60px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            <div>
                              <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Why it matters</p>
                              <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>{item.whyImportant}</p>
                            </div>
                            {item.adjacentStrength && (
                              <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Leverage existing strengths</p>
                                <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>{item.adjacentStrength}</p>
                              </div>
                            )}
                            {item.practiceProject && (
                              <div>
                                <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Practice project</p>
                                <div style={{
                                  padding: '12px 14px', background: '#f5f3ff',
                                  border: '1px solid #ddd6fe', borderRadius: 8,
                                  borderLeft: '3px solid #7c3aed',
                                }}>
                                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.7, margin: 0 }}>{item.practiceProject}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          <div>
                            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>Resources</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              {item.resources?.map((r, j) => (
                                <div key={j} style={{
                                  padding: '14px', background: '#f9fafb',
                                  border: '1px solid #f3f4f6', borderRadius: 10,
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{r.title}</p>
                                    <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{r.estimatedHours}h</span>
                                  </div>
                                  <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 10px', lineHeight: 1.6 }}>{r.description}</p>
                                  {r.url && (
                                    <a href={r.url} target="_blank" rel="noopener noreferrer" style={{
                                      display: 'inline-flex', alignItems: 'center', gap: 5,
                                      fontSize: 12, fontWeight: 600, color: '#4f46e5', textDecoration: 'none',
                                    }}
                                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                                    >
                                      <span style={{
                                        fontSize: 10, fontWeight: 700, background: '#ede9fe', color: '#7c3aed',
                                        border: '1px solid #ddd6fe', borderRadius: 4, padding: '1px 5px',
                                        textTransform: 'uppercase', letterSpacing: '0.04em',
                                      }}>{r.type}</span>
                                      Open resource →
                                    </a>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Quick Wins */}
        {learningPlan?.quickWins?.length > 0 && (
          <div style={{
            background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16,
            padding: '28px 32px', marginBottom: 24,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>
            <SectionHeader title="Quick Wins" subtitle="High-impact actions you can start this week" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {learningPlan.quickWins.map((w, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 16px', background: '#f9fafb',
                  border: '1px solid #f3f4f6', borderRadius: 10,
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 6, background: '#ecfdf5',
                    border: '1px solid #a7f3d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                      <path d="M5 13l4 4L19 7" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>{w}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Advice */}
        {learningPlan?.finalAdvice && (
          <div style={{
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            border: '1px solid #ddd6fe', borderRadius: 16, padding: '32px',
            marginBottom: 32,
          }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10, background: '#4f46e5',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>Final Advice</p>
                <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.75, margin: 0 }}>{learningPlan.finalAdvice}</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer action */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 8 }}>
          <button
            onClick={() => { sessionStorage.clear(); navigate('/') }}
            style={{
              padding: '11px 24px', borderRadius: 10, fontSize: 13, fontWeight: 600,
              background: '#fff', color: '#374151', border: '1px solid #e5e7eb', cursor: 'pointer',
              transition: 'all 0.15s', letterSpacing: '-0.01em',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f9fafb'; e.currentTarget.style.borderColor = '#d1d5db' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e5e7eb' }}
          >
            Start new assessment →
          </button>
        </div>
      </div>
    </div>
  )
}