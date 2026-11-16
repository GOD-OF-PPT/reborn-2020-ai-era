import type { GamePanelProps } from './game-types.ts'
import { projectEndingVerdict } from './mainline-projection.ts'
import './mainline-compass.css'

export function EndingVerdictBanner({ p }: { readonly p: GamePanelProps }) {
  const verdict = projectEndingVerdict(p.view, p.features)
  const cx = 110
  const cy = 110
  const radius = 74

  const points = verdict.radarAxes
    .map((axis, idx) => {
      const angle = (Math.PI * 2 * idx) / verdict.radarAxes.length - Math.PI / 2
      const r = (axis.value / 100) * radius
      return `${(cx + Math.cos(angle) * r).toFixed(1)},${(cy + Math.sin(angle) * r).toFixed(1)}`
    })
    .join(' ')

  const outerPoints = verdict.radarAxes
    .map((_, idx) => {
      const angle = (Math.PI * 2 * idx) / verdict.radarAxes.length - Math.PI / 2
      return `${(cx + Math.cos(angle) * radius).toFixed(1)},${(cy + Math.sin(angle) * radius).toFixed(1)}`
    })
    .join(' ')

  return (
    <section className="ending-verdict-banner" aria-label="六年人生时代终局评定">
      <div className="verdict-left">
        <div className="verdict-rank-row">
          <span className={'verdict-rank rank-' + verdict.archetype.rank}>{verdict.archetype.rank} 级人生评定</span>
          <span className="verdict-score">综合时代指数 {verdict.score} / 100</span>
        </div>
        <h2>{verdict.archetype.title}</h2>
        <p className="verdict-tagline">“{verdict.archetype.tagline}”</p>
        <p className="verdict-summary">{verdict.archetype.epilogueSummary}</p>
        <ul className="verdict-highlights">
          {verdict.highlights.map(line => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </div>

      <div className="verdict-radar-box" aria-label="六维人生回响雷达图">
        <svg viewBox="0 0 220 220" width="200" height="200" role="img" aria-label="六维能力与生活平衡图">
          <polygon points={outerPoints} fill="rgba(226, 202, 156, 0.08)" stroke="rgba(226, 202, 156, 0.35)" strokeWidth="1" />
          <polygon points={points} fill="rgba(226, 202, 156, 0.34)" stroke="#e2ca9c" strokeWidth="2" />
          {verdict.radarAxes.map((axis, idx) => {
            const angle = (Math.PI * 2 * idx) / verdict.radarAxes.length - Math.PI / 2
            const lx = cx + Math.cos(angle) * (radius + 22)
            const ly = cy + Math.sin(angle) * (radius + 18)
            return (
              <text
                key={axis.label}
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#f0e5cf"
                fontSize="10"
              >
                {axis.label} {axis.value}
              </text>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
