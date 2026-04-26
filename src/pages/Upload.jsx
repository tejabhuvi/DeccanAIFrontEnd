import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'http://localhost:5000/api'

function UploadZone({ label, description, file, onFile, disabled, icon }) {
  const inputRef = useRef()
  const [dragging, setDragging] = useState(false)

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    if (disabled) return
    const f = e.dataTransfer.files[0]
    if (f) onFile(f)
  }

  const active = file || dragging

  return (
    <div
      onClick={() => !disabled && inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: active ? '1.5px solid #4f46e5' : '1.5px dashed #d1d5db',
        borderRadius: '12px',
        padding: '32px 24px',
        background: active ? '#f5f3ff' : '#fafafa',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'all 0.18s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px',
        minHeight: '180px',
        justifyContent: 'center',
        textAlign: 'center',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        style={{ display: 'none' }}
        disabled={disabled}
        onChange={(e) => e.target.files[0] && onFile(e.target.files[0])}
      />

      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: '10px',
        background: file ? '#ede9fe' : '#f3f4f6',
        border: file ? '1px solid #c4b5fd' : '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.18s ease',
      }}>
        {file ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4" stroke="#6d28d9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#6d28d9" strokeWidth="1.5"/>
          </svg>
        ) : icon}
      </div>

      <div>
        <p style={{ fontSize: '14px', fontWeight: 600, color: file ? '#4f46e5' : '#374151', margin: 0 }}>
          {file ? file.name : label}
        </p>
        <p style={{ fontSize: '12px', color: '#9ca3af', margin: '4px 0 0' }}>
          {file ? 'Click to replace' : description}
        </p>
      </div>
    </div>
  )
}

export default function Upload() {
  const navigate = useNavigate()
  const [resume, setResume] = useState(null)
  const [jd, setJd] = useState(null)
  const [status, setStatus] = useState('idle')
  const [statusText, setStatusText] = useState('')
  const [error, setError] = useState('')

  const canStart = resume && jd && status === 'idle'
  const isProcessing = status === 'processing'

  const handleStart = async () => {
    if (!canStart) return
    setStatus('processing')
    setError('')
    try {
      setStatusText('Reading your documents...')
      const formData = new FormData()
      formData.append('resume', resume)
      formData.append('jobDescription', jd)
      const processRes = await fetch(`${API}/process`, { method: 'POST', body: formData })
      const processData = await processRes.json()
      if (!processRes.ok) throw new Error(processData.error)

      setStatusText('Generating personalised questions...')
      const questionsRes = await fetch(`${API}/generate-questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: processData.analysis }),
      })
      const questionsData = await questionsRes.json()
      if (!questionsRes.ok) throw new Error(questionsData.error)

      sessionStorage.setItem('analysis', JSON.stringify(processData.analysis))
      sessionStorage.setItem('questions', JSON.stringify(questionsData.questions))
      sessionStorage.setItem('openingMessage', questionsData.openingMessage)
      sessionStorage.setItem('closingMessage', questionsData.closingMessage)
      navigate('/interview')
    } catch (err) {
      setStatus('idle')
      setStatusText('')
      setError(err.message || 'Something went wrong.')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f9fafb',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      {/* Top nav */}
      <nav style={{
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '0 32px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8, background: '#4f46e5',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#111827', letterSpacing: '-0.01em' }}>AssessAI</span>
        <span style={{
          marginLeft: 8, fontSize: 11, fontWeight: 500, color: '#6d28d9',
          background: '#ede9fe', borderRadius: 4, padding: '2px 7px',
        }}>Beta</span>
      </nav>

      {/* Main */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px',
      }}>
        <div style={{ width: '100%', maxWidth: 860, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }}>

          {/* Left — copy */}
          <div>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: '#ede9fe', borderRadius: 6, padding: '4px 10px',
              marginBottom: 20,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed' }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', letterSpacing: '0.05em' }}>AI-Powered Assessment</span>
            </div>

            <h1 style={{
              fontSize: 36, fontWeight: 800, color: '#111827',
              lineHeight: 1.2, letterSpacing: '-0.03em', margin: '0 0 16px',
            }}>
              Hire with<br />
              <span style={{ color: '#4f46e5' }}>confidence.</span>
            </h1>

            <p style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, margin: '0 0 32px', maxWidth: 340 }}>
              Upload a resume and job description. Our AI conducts a live interview,
              evaluates every skill, and delivers a scored report with a learning roadmap.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { icon: '📄', text: 'Parses resume & JD in seconds' },
                { icon: '🎯', text: 'Tailored questions per role & experience' },
                { icon: '📊', text: 'Scored report with skill breakdown' },
                { icon: '🗺️', text: 'Personalised learning roadmap' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16 }}>{item.icon}</span>
                  <span style={{ fontSize: 13, color: '#374151' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — upload card */}
          <div style={{
            background: '#ffffff',
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            padding: '32px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 8px 24px rgba(0,0,0,0.04)',
          }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: '#111827', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
              Start your assessment
            </h2>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '0 0 24px' }}>
              Upload both files to continue
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              <UploadZone
                label="Candidate Resume"
                description="PDF or DOCX — drop here or click"
                file={resume}
                onFile={setResume}
                disabled={isProcessing}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
              <UploadZone
                label="Job Description"
                description="PDF or DOCX — drop here or click"
                file={jd}
                onFile={setJd}
                disabled={isProcessing}
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6l2 2-2 2M8 6L6 8l2 2m4-6v12" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                marginBottom: 16, padding: '10px 14px', borderRadius: 8,
                background: '#fef2f2', border: '1px solid #fecaca',
              }}>
                <p style={{ fontSize: 12, color: '#dc2626', margin: 0 }}>{error}</p>
              </div>
            )}

            {/* Processing indicator */}
            {isProcessing && (
              <div style={{
                marginBottom: 16, padding: '10px 14px', borderRadius: 8,
                background: '#f5f3ff', border: '1px solid #ddd6fe',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: '#7c3aed',
                      animation: 'bounce 1s infinite',
                      animationDelay: `${i * 0.15}s`,
                    }} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: '#6d28d9' }}>{statusText}</span>
              </div>
            )}

            {/* CTA */}
            <button
              onClick={handleStart}
              disabled={!canStart}
              style={{
                width: '100%', padding: '12px 20px', borderRadius: 10,
                fontSize: 14, fontWeight: 600, border: 'none', cursor: canStart ? 'pointer' : 'not-allowed',
                background: canStart ? '#4f46e5' : '#f3f4f6',
                color: canStart ? '#ffffff' : '#9ca3af',
                transition: 'all 0.15s ease',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={e => canStart && (e.currentTarget.style.background = '#4338ca')}
              onMouseLeave={e => canStart && (e.currentTarget.style.background = '#4f46e5')}
            >
              {isProcessing ? 'Preparing assessment…' : 'Start Assessment →'}
            </button>

            {!canStart && !isProcessing && (
              <p style={{ fontSize: 12, color: '#d1d5db', textAlign: 'center', marginTop: 10 }}>
                {!resume && !jd ? 'Upload both files to continue' : !resume ? 'Resume required' : 'Job description required'}
              </p>
            )}

            <p style={{ fontSize: 11, color: '#d1d5db', textAlign: 'center', marginTop: 20 }}>
              Files are processed securely and not stored.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}