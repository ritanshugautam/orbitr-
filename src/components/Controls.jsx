export default function Controls({ filters, onFilterChange, stats, dataStatus }) {
  const CONSTELLATIONS = [
    { key: 'showStarlink', label: 'Starlink', color: '#4FC3F7' },
    { key: 'showGPS',      label: 'GPS',      color: '#FFD700' },
    { key: 'showISS',      label: 'ISS',      color: '#FF6B35' },
    { key: 'showGalileo',  label: 'Galileo',  color: '#69F0AE' },
    { key: 'showOneWeb',   label: 'OneWeb',   color: '#FF4081' },
    { key: 'showOther',    label: 'Other',    color: '#CCCCCC' },
  ]

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 12,
      padding: '16px 20px',
      color: 'white',
      fontFamily: 'monospace',
      fontSize: 13,
      minWidth: 200,
      zIndex: 100,
    }}>
      <div style={{ fontWeight: 700, marginBottom: 12, letterSpacing: 2, fontSize: 16 }}>
        ORBITR
      </div>

      <div style={{ marginBottom: 12, color: '#aaa', fontSize: 11 }}>
        <div>{(stats.count || 0).toLocaleString()} satellites tracked</div>
        <div>{stats.fps || 0} fps</div>
        <div style={{ marginTop: 4, color: '#666', fontSize: 10 }}>{dataStatus}</div>
      </div>

      {CONSTELLATIONS.map(c => (
        <div
          key={c.key}
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, cursor: 'pointer' }}
          onClick={() => onFilterChange(c.key, !filters[c.key])}
        >
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: c.color,
            opacity: filters[c.key] ? 1 : 0.2,
            flexShrink: 0,
          }} />
          <span style={{ opacity: filters[c.key] ? 1 : 0.4, transition: 'opacity 0.2s' }}>
            {c.label}
          </span>
        </div>
      ))}

      <div style={{ marginTop: 12, color: '#444', fontSize: 10 }}>
        Data: CelesTrak GP catalog<br />
        Physics: SGP4 / satellite.js<br />
        Renders: Three.js WebGL
      </div>
    </div>
  )
}
