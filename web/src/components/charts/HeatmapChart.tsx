const HOURS = Array.from({ length: 24 }, (_, i) => `${i}h`)
const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Simulated accident intensity data (day × hour)
const INTENSITY: number[][] = DAYS.map((_, d) =>
  HOURS.map((_, h) => {
    const peak = d >= 1 && d <= 5 ? (h >= 7 && h <= 9) || (h >= 17 && h <= 19) : h >= 11 && h <= 16
    const base = peak ? 0.5 + Math.random() * 0.5 : Math.random() * 0.4
    return base
  })
)

function interpolateColor(t: number): string {
  const r = Math.round(34 + (239 - 34) * t)
  const g = Math.round(197 + (68 - 197) * t)
  const b = Math.round(94 + (68 - 94) * t)
  return `rgb(${r},${g},${b})`
}

export function HeatmapChart() {
  const cellW = 32
  const cellH = 22

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: '2px', alignItems: 'center', marginBottom: '4px', paddingLeft: '32px' }}>
        {HOURS.map((h) => (
          <div key={h} style={{ width: cellW, textAlign: 'center', fontSize: '9px', color: '#475569', fontFamily: 'JetBrains Mono, monospace', flexShrink: 0 }}>
            {h}
          </div>
        ))}
      </div>
      {DAYS.map((day, d) => (
        <div key={day} style={{ display: 'flex', gap: '2px', alignItems: 'center', marginBottom: '2px' }}>
          <div style={{ width: 30, fontSize: '10px', color: '#64748b', fontFamily: 'Inter, sans-serif', flexShrink: 0, textAlign: 'right', paddingRight: '4px' }}>
            {day}
          </div>
          {HOURS.map((_, h) => {
            const val = INTENSITY[d][h]
            return (
              <div
                key={h}
                title={`${day} ${h}h — ${(val * 100).toFixed(0)}% de intensidade`}
                style={{
                  width: cellW,
                  height: cellH,
                  borderRadius: '3px',
                  background: interpolateColor(val),
                  opacity: 0.15 + val * 0.85,
                  flexShrink: 0,
                  cursor: 'default',
                  transition: 'opacity 0.2s',
                }}
              />
            )
          })}
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '8px', paddingLeft: '32px' }}>
        <span style={{ fontSize: '9px', color: '#475569' }}>Baixo</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} style={{ width: 20, height: 10, borderRadius: '2px', background: interpolateColor(i / 7), opacity: 0.2 + (i / 7) * 0.8 }} />
          ))}
        </div>
        <span style={{ fontSize: '9px', color: '#475569' }}>Alto</span>
      </div>
    </div>
  )
}
