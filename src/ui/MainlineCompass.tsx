import { useState } from 'react'
import { moneyText, wishes } from './game-text.ts'
import type { GamePanelProps, NavigateScene } from './game-types.ts'
import { projectMainlineHud } from './mainline-projection.ts'
import { isSoundEnabled, playConfirmTap, playPaperTurn, setSoundEnabled } from './sound-synth.ts'
import './mainline-compass.css'

interface MainlineCompassProps {
  readonly p: GamePanelProps
  readonly onNavigate: NavigateScene
  readonly compact?: boolean
}

export function MainlineCompass({ p, onNavigate, compact = false }: MainlineCompassProps) {
  const [expanded, setExpanded] = useState(!compact)
  const [tab, setTab] = useState<'quests' | 'stats' | 'synergies'>('quests')
  const [soundOn, setSoundOn] = useState<boolean>(() => isSoundEnabled())

  const hud = projectMainlineHud(p.view, p.features)

  const toggleSound = () => {
    const next = !soundOn
    setSoundEnabled(next)
    setSoundOn(next)
  }

  return (
    <aside className={'mainline-compass' + (expanded ? ' is-expanded' : ' is-collapsed')} aria-label="时代主线罗盘与角色成长">
      <div className="compass-strip">
        <div className="compass-act-pill">
          <span className="compass-act-badge">{hud.act.title}</span>
          <strong className="compass-act-sub">{hud.act.subtitle}</strong>
          <span className="compass-progress-inline" title="本章主线里程碑完成度">
            本章 {hud.actProgressPercent}%
          </span>
        </div>

        <div className="compass-vitals">
          <span className="vital-chip" title="可控净资产（现金+持仓估值-未履约客户款-未结应付）">
            净值 <b>{moneyText(hud.totalControlledNetWorthFen)}</b>
          </span>
          <span className="vital-chip" title="人生愿景阶梯">
            {wishes[p.view.playerProfile.wishId]} <b>{hud.wishAllDone ? '圆满' : `阶段 ${hud.wishCurrentTier}/3`}</b>
          </span>
          <span className={'vital-chip energy-' + (hud.stats.energy >= 75 ? 'high' : hud.stats.energy >= 45 ? 'mid' : 'low')}>
            状态 <b>{hud.stats.energyStateLabel} ({hud.stats.energy})</b>
          </span>
          <span className="vital-chip">
            协同飞轮 <b>{hud.activeSynergyCount}/6</b>
          </span>
        </div>

        <div className="compass-controls">
          <button
            type="button"
            className="compass-sound-btn"
            aria-pressed={soundOn}
            onClick={toggleSound}
            title="切换轻交互音效"
          >
            {soundOn ? '音效：开' : '音效：静'}
          </button>
          <button
            type="button"
            className="compass-toggle-btn"
            aria-expanded={expanded}
            onClick={() => {
              playPaperTurn()
              setExpanded(prev => !prev)
            }}
          >
            {expanded ? '收起主线罗盘 ▴' : '展开主线与协同 ▾'}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="compass-drawer">
          <div className="compass-era-wave">
            <span>时代风向：{hud.act.eraWave}</span>
            <nav className="compass-subtabs" aria-label="主线罗盘视图">
              <button
                type="button"
                aria-pressed={tab === 'quests'}
                onClick={() => {
                  playPaperTurn()
                  setTab('quests')
                }}
              >
                主线与智能指引
              </button>
              <button
                type="button"
                aria-pressed={tab === 'stats'}
                onClick={() => {
                  playPaperTurn()
                  setTab('stats')
                }}
              >
                五维成长与愿景
              </button>
              <button
                type="button"
                aria-pressed={tab === 'synergies'}
                onClick={() => {
                  playPaperTurn()
                  setTab('synergies')
                }}
              >
                跨路线协同 ({hud.activeSynergyCount}/6)
              </button>
            </nav>
          </div>

          {tab === 'quests' ? (
            <div className="compass-grid-two">
              <section className="compass-card" aria-label="本章三项里程碑">
                <header>
                  <strong>{hud.act.year} 本章主线目标</strong>
                  <small>{hud.act.dilemmaHint}</small>
                </header>
                <ul className="compass-quest-list">
                  {hud.actQuests.map(q => (
                    <li key={q.id} data-done={q.done ? 'true' : 'false'}>
                      <div>
                        <span className="quest-check" aria-hidden="true">
                          {q.done ? '✓' : '○'}
                        </span>
                        <strong>{q.label}</strong>
                        <small>{q.detail}</small>
                      </div>
                      {!q.done ? (
                        <button
                          type="button"
                          onClick={() => {
                            playConfirmTap()
                            if (q.target) onNavigate(q.targetScreen, q.target); else onNavigate(q.targetScreen)
                          }}
                        >
                          前往 →
                        </button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="compass-card" aria-label="当下高价值战略指引">
                <header>
                  <strong>战略行动快捷指引</strong>
                  <small>告别迷茫，直达当前最高收益/最急迫决策</small>
                </header>
                <div className="compass-cue-list">
                  {hud.smartCues.map(cue => (
                    <article key={cue.id} className="compass-cue-item">
                      <div>
                        <span className="cue-badge">{cue.badge}</span>
                        <strong>{cue.label}</strong>
                        <p>{cue.reason}</p>
                      </div>
                      {cue.directCommand ? (
                        <button
                          type="button"
                          className="primary"
                          onClick={() => {
                            playConfirmTap()
                            p.request(cue.directCommand!.kind, cue.directCommand!.payload, cue.directCommand!.label, true)
                          }}
                        >
                          立即核对 →
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            playConfirmTap()
                            if (cue.target) onNavigate(cue.screen, cue.target); else onNavigate(cue.screen)
                          }}
                        >
                          打开面板 ↗
                        </button>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            </div>
          ) : null}

          {tab === 'stats' ? (
            <div className="compass-grid-two">
              <section className="compass-card" aria-label="主角五维能力">
                <header>
                  <strong>主角五维能力成长</strong>
                  <small>由本局真实研发、交付、交易与生活履约累计驱动</small>
                </header>
                <div className="compass-stat-bars">
                  {(
                    [
                      ['技术工程', hud.stats.tech],
                      ['内容审美', hud.stats.craft],
                      ['商业嗅觉', hud.stats.biz],
                      ['行业口碑', hud.stats.reputation],
                      ['身心精力', hud.stats.energy],
                    ] as const
                  ).map(([label, val]) => (
                    <div key={label} className="stat-bar-row">
                      <span>{label}</span>
                      <div className="stat-bar-track" aria-hidden="true">
                        <i style={{ width: `${val}%` }} />
                      </div>
                      <b>{val}</b>
                    </div>
                  ))}
                </div>
              </section>

              <section className="compass-card" aria-label="终极人生愿景阶梯">
                <header>
                  <strong>
                    人生终极愿景：{wishes[p.view.playerProfile.wishId]}（{hud.wishBadge}）
                  </strong>
                  <small>总进度 {hud.wishProgressPercent}%</small>
                </header>
                <div className="wish-tier-box">
                  <p className="wish-objective">{hud.wishAllDone ? '三阶愿景已全部达成！保持零违约迎接2025终局授勋。' : `当前目标：${hud.wishObjective}`}</p>
                  <p className="wish-perk">阶段回响：{hud.wishPerk}</p>
                  <div className="stat-bar-track" aria-hidden="true">
                    <i style={{ width: `${Math.max(12, hud.wishProgressPercent)}%` }} />
                  </div>
                </div>
              </section>
            </div>
          ) : null}

          {tab === 'synergies' ? (
            <section className="compass-synergy-grid" aria-label="跨路线商业与人脉协同飞轮">
              {hud.synergies.map(syn => (
                <article key={syn.id} className="synergy-card" data-active={syn.active ? 'true' : 'false'}>
                  <header>
                    <strong>{syn.name}</strong>
                    <span>{syn.active ? '已点亮' : '待解锁'}</span>
                  </header>
                  <small className="synergy-routes">{syn.routesLabel}</small>
                  <p>{syn.effectSummary}</p>
                  <small className="synergy-cond">条件：{syn.conditionSummary}</small>
                </article>
              ))}
            </section>
          ) : null}
        </div>
      ) : null}
    </aside>
  )
}
