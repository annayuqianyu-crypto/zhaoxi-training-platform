import { useState } from 'react'

export function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')

  function submit(e) {
    e.preventDefault()
    if (email.endsWith('@zxpro.com.cn') && pass === 'ZXpro@2026') {
      const role = email === 'anna.yu@zxpro.com.cn' ? 'admin' : 'staff'
      onLogin({ email, role, name: email.split('@')[0] })
    } else {
      setErr('账号或密码错误，请重试')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">曦</div>
        <h1>朝曦家办-知识工坊</h1>
        <p className="login-sub">Knowledge Hub · 朝曦家办专属平台</p>
        {err && <div className="alert alert-danger" style={{marginBottom:16}}><span>⚠</span>{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">邮箱账号</label>
            <input className="form-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="请输入邮箱" />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input className="form-input" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="请输入密码" />
          </div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:8}} type="submit">登录</button>
        </form>
        <div className="divider" />
        <p style={{fontSize:11,color:'var(--text-3)',textAlign:'center',lineHeight:1.8}}>
          请使用公司邮箱账号登录
        </p>
      </div>
    </div>
  )
}
