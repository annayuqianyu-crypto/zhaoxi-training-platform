import { useState } from 'react'

export function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('anna.yu@zxpro.com.cn')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')

  function submit(e) {
    e.preventDefault()
    if (email === 'anna.yu@zxpro.com.cn' && pass === '000000') {
      onLogin({ email, role: 'admin', name: 'Anna Yu' })
    } else if (pass === 'sales123') {
      onLogin({ email, role: 'sales', name: '销售' })
    } else if (pass === 'teacher123') {
      onLogin({ email, role: 'teacher', name: '讲师' })
    } else if (pass === 'bu123') {
      onLogin({ email, role: 'bu', name: 'BU成员' })
    } else {
      setErr('账号或密码错误，请重试')
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">曦</div>
        <h1>朝曦培训管理中台</h1>
        <p className="login-sub">Training Management Platform · v1.2</p>
        {err && <div className="alert alert-danger" style={{marginBottom:16}}><span>⚠</span>{err}</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label className="form-label">邮箱账号</label>
            <input className="form-input" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@zxpro.com.cn" />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input className="form-input" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="请输入密码" />
          </div>
          <button className="btn btn-primary" style={{width:'100%',justifyContent:'center',marginTop:8}} type="submit">登录</button>
        </form>
        <div className="divider" />
        <p style={{fontSize:11,color:'var(--text-3)',textAlign:'center',lineHeight:1.8}}>
          管理员密码：000000 &nbsp;|&nbsp; 其他角色：sales123 / teacher123 / bu123
        </p>
      </div>
    </div>
  )
}
