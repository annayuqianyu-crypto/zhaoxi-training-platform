import { useState } from 'react'

const ROLES = ['销售顾问', '讲师', 'BU 成员', '其他']
const ACCESS_CODE = 'zx2026'

export function PortalLogin({ onLogin }) {
  const [name, setName]       = useState('')
  const [role, setRole]       = useState(ROLES[0])
  const [code, setCode]       = useState('')
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('请输入您的姓名'); return }
    if (code !== ACCESS_CODE) { setError('访问码不正确，请联系管理员获取'); return }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      onLogin({ name: name.trim(), role })
    }, 400)
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 400, background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 20,
        padding: 40, boxShadow: '0 4px 24px rgba(0,0,0,.10)',
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

        <h1 style={{ textAlign: 'center', fontSize: 22, marginBottom: 4, fontFamily: "'Noto Serif SC', serif" }}>
          朝曦知识中心
        </h1>
        <p style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 13, marginBottom: 28 }}>
          课程匹配 · 产品学习 · 内部知识库
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">您的姓名</label>
            <input
              className="form-input"
              placeholder="请输入真实姓名"
              value={name}
              onChange={e => { setName(e.target.value); setError('') }}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">角色</label>
            <select
              className="form-select"
              value={role}
              onChange={e => setRole(e.target.value)}
            >
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">访问码</label>
            <input
              className="form-input"
              type="password"
              placeholder="请输入访问码"
              value={code}
              onChange={e => { setCode(e.target.value); setError('') }}
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
            disabled={loading}
          >
            {loading ? '登录中…' : '进入知识中心'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button
            onClick={() => { window.location.hash = ''; window.location.reload() }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'var(--text-3)',
            }}
          >
            返回管理后台
          </button>
        </div>
      </div>
    </div>
  )
}
