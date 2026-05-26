import { useState } from 'react'

export function PortalLogin({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.endsWith('@zxpro.com.cn')) {
      setError('请使用 @zxpro.com.cn 邮箱登录')
      return
    }
    if (pass !== 'ZXpro@2026') {
      setError('密码错误，请重试')
      return
    }
    onLogin({ email, name: email.split('@')[0], role: 'staff' })
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 20,
        padding: '36px 32px',
        boxShadow: '0 4px 24px rgba(0,0,0,.10)',
      }}>
        {/* Logo */}
        <div style={{
          width: 52, height: 52, borderRadius: 12,
          background: 'var(--accent)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 24, fontWeight: 700, color: '#fff',
          fontFamily: "'Noto Serif SC', serif",
          margin: '0 auto 20px',
        }}>朝</div>

        <h1 style={{ textAlign: 'center', fontSize: 20, marginBottom: 4, fontFamily: "'Noto Serif SC', serif" }}>
          朝曦知识中心
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, marginBottom: 28 }}>
          课程匹配 · 产品学习 · 培训资料
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">邮箱账号</label>
            <input
              className="form-input"
              type="email"
              placeholder="your@zxpro.com.cn"
              value={email}
              autoComplete="username"
              onChange={e => { setEmail(e.target.value); setError('') }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              className="form-input"
              type="password"
              placeholder="请输入密码"
              value={pass}
              autoComplete="current-password"
              onChange={e => { setPass(e.target.value); setError('') }}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 14,
              background: 'var(--red-lt)', color: 'var(--red)',
              fontSize: 13, border: '1px solid #FCA5A5',
            }}>{error}</div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '11px 0', fontSize: 14 }}
          >
            登录
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
            使用 @zxpro.com.cn 邮箱登录
          </span>
        </div>
      </div>
    </div>
  )
}
