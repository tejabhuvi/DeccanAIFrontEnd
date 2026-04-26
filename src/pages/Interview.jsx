import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'https://deccanaibackend.onrender.com/api'

const TYPE_META = {
  Practical:    { color: '#d97706', bg: '#fffbeb', border: '#fde68a', dot: '#f59e0b' },
  Scenario:     { color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd', dot: '#38bdf8' },
  Conceptual:   { color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe', dot: '#8b5cf6' },
  Behavioural:  { color: '#059669', bg: '#f0fdf4', border: '#bbf7d0', dot: '#34d399' },
  'Follow-up':  { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', dot: '#f87171' },
}

const ss = (k) => { try { return JSON.parse(sessionStorage.getItem(k) || (k === 'questions' ? '[]' : '{}')) } catch { return k === 'questions' ? [] : {} } }

export default function Interview() {
  const navigate = useNavigate()

  const questions = ss('questions') instanceof Array ? ss('questions') : []
  const openingMessage = sessionStorage.getItem('openingMessage') || ''
  const analysis = ss('analysis')

  const [phase, setPhase] = useState('opening')
  const [answers, setAnswers] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState(null)
  const [followUpQuestions, setFollowUpQuestions] = useState([])
  const [followUpAnswers, setFollowUpAnswers] = useState([])
  const [followUpIndex, setFollowUpIndex] = useState(0)
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState('')
  const [transitioning, setTransitioning] = useState(false)
  const textareaRef = useRef()

  useEffect(() => { if (!questions.length) navigate('/') }, [])

  useEffect(() => {
    if (phase === 'interview') fetchNextQuestion(null, [], 0)
  }, [phase])

  useEffect(() => {
    if (currentQuestion && textareaRef.current) textareaRef.current.focus()
  }, [currentQuestion])

  const transition = (fn) => {
    setTransitioning(true)
    setTimeout(() => { fn(); setTransitioning(false) }, 180)
  }

  const fetchNextQuestion = async (newAnswer, currentAnswers, index) => {
    try {
      const res = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions, answers: currentAnswers, currentQuestionIndex: index, newAnswer }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.status === 'completed') {
        await evaluateAnswers(data.answers)
      } else {
        transition(() => {
          setCurrentQuestion(data.nextQuestion)
          setAnswers(data.answers)
          setCurrentIndex(data.currentQuestionIndex)
          setCurrentAnswer('')
        })
      }
    } catch (err) { setError(err.message) }
  }

  const fetchNextFollowUp = async (newAnswer, currentFollowUpAnswers, index) => {
    try {
      const res = await fetch(`${API}/chat/followup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpQuestions, followUpAnswers: currentFollowUpAnswers, currentFollowUpIndex: index, newAnswer }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.status === 'followup_completed') {
        await finalEvaluate(data.followUpAnswers)
      } else {
        transition(() => {
          setCurrentQuestion({ question: data.nextQuestion.question, skill: data.nextQuestion.skill, type: 'Follow-up' })
          setFollowUpAnswers(data.followUpAnswers)
          setFollowUpIndex(data.currentFollowUpIndex)
          setCurrentAnswer('')
        })
      }
    } catch (err) { setError(err.message) }
  }

  const evaluateAnswers = async (finalAnswers) => {
    setPhase('submitting')
    setStatusText('Evaluating your answers…')
    try {
      const res = await fetch(`${API}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: finalAnswers, analysis, followUpAnswers: [] }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.phase === 'followup_needed') {
        setFollowUpQuestions(data.followUpQuestions)
        sessionStorage.setItem('partialEvaluation', JSON.stringify(data.evaluation))
        sessionStorage.setItem('mainAnswers', JSON.stringify(finalAnswers))
        setPhase('followup')
        fetchNextFollowUp(null, [], 0)
      } else {
        sessionStorage.setItem('evaluation', JSON.stringify(data.evaluation))
        sessionStorage.setItem('learningPlan', JSON.stringify(data.learningPlan))
        navigate('/results')
      }
    } catch (err) { setPhase('interview'); setError(err.message) }
  }

  const finalEvaluate = async (finalFollowUpAnswers) => {
    setPhase('submitting')
    setStatusText('Finalising your assessment…')
    const mainAnswers = (() => { try { return JSON.parse(sessionStorage.getItem('mainAnswers') || '[]') } catch { return [] } })()
    try {
      const res = await fetch(`${API}/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: mainAnswers, analysis, followUpAnswers: finalFollowUpAnswers }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      sessionStorage.setItem('evaluation', JSON.stringify(data.evaluation))
      sessionStorage.setItem('learningPlan', JSON.stringify(data.learningPlan))
      navigate('/results')
    } catch (err) { setPhase('followup'); setError(err.message) }
  }

  const handleSubmit = () => {
    if (!currentAnswer.trim()) return
    setError('')
    if (phase === 'interview') fetchNextQuestion(currentAnswer.trim(), answers, currentIndex)
    else if (phase === 'followup') fetchNextFollowUp(currentAnswer.trim(), followUpAnswers, followUpIndex)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  const totalMain = questions.length
  const totalFollowUp = followUpQuestions.length
  const answeredMain = answers.length
  const answeredFollowUp = followUpAnswers.length
  const isFollowUp = phase === 'followup'

  const progressPercent = isFollowUp
    ? Math.round(((answeredMain + answeredFollowUp) / (totalMain + totalFollowUp)) * 100)
    : totalMain > 0 ? Math.round((answeredMain / totalMain) * 100) : 0

  const questionNumber = isFollowUp ? totalMain + answeredFollowUp + 1 : answeredMain + 1
  const totalQuestions = isFollowUp ? totalMain + totalFollowUp : totalMain

  const typeMeta = currentQuestion ? (TYPE_META[currentQuestion.type] || TYPE_META['Conceptual']) : null

  const baseFont = "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"

  // ── OPENING ──
  if (phase === 'opening') {
    return (
      <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: baseFont, display: 'flex', flexDirection: 'column' }}>
        <nav style={{
          background: '#fff', borderBottom: '1px solid #e5e7eb',
          padding: '0 32px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>AssessAI</span>
          </div>
          <span style={{ fontSize: 13, color: '#6b7280' }}>{analysis.jobTitle || 'Assessment'}</span>
        </nav>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
          <div style={{ maxWidth: 560, width: '100%' }}>
            <div style={{ marginBottom: 32 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#4f46e5', textTransform: 'uppercase',
                letterSpacing: '0.08em', display: 'block', marginBottom: 12,
              }}>Ready to begin</span>
              <h1 style={{ fontSize: 32, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', margin: '0 0 16px', lineHeight: 1.2 }}>
                {openingMessage || 'Welcome to your skill assessment.'}
              </h1>
              <p style={{ fontSize: 14, color: '#6b7280', lineHeight: 1.7, margin: 0 }}>
                Answer each question thoughtfully. The AI will ask follow-ups based on your responses.
                There are no trick questions — just an honest conversation about your skills.
              </p>
            </div>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
              marginBottom: 40, padding: '24px', background: '#fff',
              borderRadius: 12, border: '1px solid #e5e7eb',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            }}>
              {[
                { label: 'Questions', value: totalMain },
                { label: 'Level', value: analysis.experienceLevel || '—' },
                { label: 'Resume Match', value: `${analysis.candidateProfile?.initialMatchScore ?? '—'}%` },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: 24, fontWeight: 800, color: '#111827', letterSpacing: '-0.03em', margin: 0 }}>{s.value}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '4px 0 0', fontWeight: 500 }}>{s.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => setPhase('interview')}
              style={{
                padding: '13px 28px', background: '#4f46e5', color: '#fff', border: 'none',
                borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
                letterSpacing: '-0.01em', transition: 'background 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
              onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
            >
              Begin Interview →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── SUBMITTING ──
  if (phase === 'submitting') {
    return (
      <div style={{
        minHeight: '100vh', background: '#f9fafb', fontFamily: baseFont,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16,
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: '50%', background: '#4f46e5',
              animation: 'bounce 1s infinite',
              animationDelay: `${i * 0.15}s`,
            }} />
          ))}
        </div>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>{statusText}</p>
        <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }`}</style>
      </div>
    )
  }

  // ── INTERVIEW / FOLLOWUP ──
  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: baseFont, display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }`}</style>

      {/* Header */}
      <header style={{
        background: '#fff', borderBottom: '1px solid #e5e7eb',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#4f46e5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{analysis.jobTitle || 'Assessment'}</span>
          {isFollowUp && (
            <span style={{
              fontSize: 11, fontWeight: 600, color: '#dc2626', background: '#fef2f2',
              border: '1px solid #fecaca', borderRadius: 5, padding: '2px 8px', letterSpacing: '0.04em',
            }}>Follow-up</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
            Question {questionNumber} of {totalQuestions}
          </span>
          <div style={{ width: 120, height: 6, borderRadius: 999, background: '#f3f4f6', overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999, background: '#4f46e5',
              width: `${progressPercent}%`, transition: 'width 0.4s ease',
            }} />
          </div>
          <span style={{ fontSize: 13, color: '#4f46e5', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
            {progressPercent}%
          </span>
        </div>
      </header>

      {/* Body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden', maxHeight: 'calc(100vh - 56px)' }}>

        {/* Left — Question */}
        <div style={{
          padding: '40px 40px',
          borderRight: '1px solid #e5e7eb',
          overflowY: 'auto',
          opacity: transitioning ? 0 : 1,
          transition: 'opacity 0.18s ease',
          display: 'flex', flexDirection: 'column', gap: 24,
        }}>
          {currentQuestion ? (
            <>
              {/* Tags */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {currentQuestion.skill && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: '#374151',
                    background: '#f3f4f6', border: '1px solid #e5e7eb',
                    borderRadius: 6, padding: '3px 9px', letterSpacing: '0.03em',
                  }}>{currentQuestion.skill}</span>
                )}
                {currentQuestion.type && typeMeta && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, color: typeMeta.color,
                    background: typeMeta.bg, border: `1px solid ${typeMeta.border}`,
                    borderRadius: 6, padding: '3px 9px', letterSpacing: '0.03em',
                  }}>{currentQuestion.type}</span>
                )}
              </div>

              {/* Question */}
              <div>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px' }}>
                  Question {questionNumber}
                </p>
                <p style={{ fontSize: 20, color: '#111827', lineHeight: 1.6, fontWeight: 500, letterSpacing: '-0.01em', margin: 0 }}>
                  {currentQuestion.question}
                </p>
              </div>

              {/* Tips */}
              <div style={{
                marginTop: 'auto', padding: '14px 16px',
                background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: 10,
              }}>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, lineHeight: 1.6 }}>
                  <span style={{ fontWeight: 600, color: '#6b7280' }}>Tip: </span>
                  Be specific and use concrete examples where possible. Depth matters more than breadth.
                </p>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4f46e5', animation: 'bounce 1s infinite' }} />
              <p style={{ fontSize: 14, color: '#9ca3af', margin: 0 }}>Loading question…</p>
            </div>
          )}
        </div>

        {/* Right — Answer */}
        <div style={{
          padding: '40px 40px',
          display: 'flex', flexDirection: 'column', gap: 16,
          opacity: transitioning ? 0 : 1,
          transition: 'opacity 0.18s ease',
          overflowY: 'auto',
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px' }}>
              Your answer
            </p>
            <textarea
              ref={textareaRef}
              value={currentAnswer}
              onChange={e => setCurrentAnswer(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer here…"
              disabled={!currentQuestion}
              style={{
                width: '100%', minHeight: 280, resize: 'none', outline: 'none',
                border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '16px',
                fontSize: 14, color: '#111827', lineHeight: 1.7,
                fontFamily: baseFont,
                background: currentQuestion ? '#fff' : '#f9fafb',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s',
                caretColor: '#4f46e5',
              }}
              onFocus={e => e.target.style.borderColor = '#4f46e5'}
              onBlur={e => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          {/* Previous answers (subtle) */}
          {answers.length > 0 && (
            <div style={{ marginTop: 4 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#d1d5db', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                Previous answers ({answers.length})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 140, overflowY: 'auto' }}>
                {answers.slice().reverse().map((a, i) => (
                  <div key={i} style={{
                    padding: '8px 12px', background: '#f9fafb',
                    border: '1px solid #f3f4f6', borderRadius: 8,
                  }}>
                    <p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 2px', fontWeight: 500 }}>Q{answers.length - i}</p>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0, lineHeight: 1.5,
                      overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>{a.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ padding: '10px 14px', borderRadius: 8, background: '#fef2f2', border: '1px solid #fecaca' }}>
              <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Submit row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
            <span style={{ fontSize: 12, color: '#d1d5db' }}>
              {currentAnswer.length > 0 ? `${currentAnswer.length} chars` : '⌘ + Enter to submit'}
            </span>
            <button
              onClick={handleSubmit}
              disabled={!currentAnswer.trim() || !currentQuestion}
              style={{
                padding: '10px 24px', borderRadius: 9, fontSize: 13, fontWeight: 600, border: 'none',
                cursor: currentAnswer.trim() && currentQuestion ? 'pointer' : 'not-allowed',
                background: currentAnswer.trim() && currentQuestion ? '#4f46e5' : '#f3f4f6',
                color: currentAnswer.trim() && currentQuestion ? '#fff' : '#9ca3af',
                transition: 'all 0.15s ease', letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => { if (currentAnswer.trim() && currentQuestion) e.currentTarget.style.background = '#4338ca' }}
              onMouseLeave={e => { if (currentAnswer.trim() && currentQuestion) e.currentTarget.style.background = '#4f46e5' }}
            >
              Submit →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}