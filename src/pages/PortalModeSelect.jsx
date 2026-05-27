export function PortalModeSelect({ onSelect }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{
        width: 56, height: 56, borderRadius: 14,
        background: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: "'Noto Serif SC', serif",
        fontSize: 28, fontWeight: 700, color: '#fff',
        marginBottom: 20,
      }}>朝</div>

      <h1 style={{
        fontFamily: "'Noto Serif SC', serif",
        fontSize: 22, fontWeight: 700,
        color: 'var(--text-1)', marginBottom: 8, textAlign: 'center',
      }}>朝曦知识中心</h1>

      <p style={{
        fontSize: 13, color: 'var(--text-3)',
        marginBottom: 48, textAlign: 'center',
      }}>请选择访问方式</p>

      {/* Mode cards */}
      <div style={{
        display: 'flex', gap: 20,
        flexWrap: 'wrap', justifyContent: 'center',
        width: '100%', maxWidth: 520,
      }}>
        {[
          { key: 'mobile',  title: '手机版', sub: '随时随地访问' },
          { key: 'desktop', title: '电脑版', sub: '完整功能体验' },
        ].map(({ key, title, sub }) => (
          <div
            key={key}
            onClick={() => onSelect(key)}
            style={{
              flex: '1 1 180px', minHeight: 140,
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border)',
              borderRadius: 16,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 8, cursor: 'pointer',
              transition: 'border-color .15s, box-shadow .15s',
              boxShadow: '0 1px 4px rgba(0,0,0,.06)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'var(--accent)'
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(45,106,79,.12)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,.06)'
            }}
          >
            <span style={{
              fontSize: 18, fontWeight: 700,
              color: 'var(--text-1)',
              fontFamily: "'Noto Serif SC', serif",
            }}>{title}</span>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{sub}</span>
          </div>
        ))}
      </div>

      {/* 管理后台入口（低调显示，给管理员用） */}
      <a
        href="#admin"
        onClick={() => { window.location.hash = '#admin'; window.location.reload() }}
        style={{
          marginTop: 40, fontSize: 11, color: 'var(--text-3)',
          textDecoration: 'none', borderBottom: '1px dashed var(--border)',
          paddingBottom: 1,
        }}
      >管理后台 →</a>
    </div>
  )
}
