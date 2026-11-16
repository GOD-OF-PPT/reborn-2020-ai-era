import {
  ENDING_ARCHETYPES,
  MAINLINE_ACTS,
  SYNERGY_MATRIX,
  WISH_QUESTLINES,
  type EndingArchetype,
  type MainlineActDefinition,
} from '../content/mainline-chapters.ts'
import { moneyText } from './game-text.ts'
import type { PlayFeatures, PlayingView, SceneTarget } from './game-types.ts'
import type { Screen } from './Navigation.tsx'

export interface MainlineQuestItem {
  readonly id: string
  readonly label: string
  readonly detail: string
  readonly done: boolean
  readonly targetScreen: Screen
  readonly target?: SceneTarget
}

export interface ProtagonistStats {
  readonly tech: number
  readonly craft: number
  readonly biz: number
  readonly reputation: number
  readonly energy: number
  readonly energyStateLabel: string
}

export interface SynergyStatusItem {
  readonly id: string
  readonly name: string
  readonly routesLabel: string
  readonly conditionSummary: string
  readonly effectSummary: string
  readonly active: boolean
}

export interface SmartActionCue {
  readonly id: string
  readonly badge: string
  readonly label: string
  readonly reason: string
  readonly screen: Screen
  readonly target?: SceneTarget
  readonly directCommand?: { readonly kind: string; readonly payload: unknown; readonly label: string }
}

export interface MainlineHudProjection {
  readonly act: MainlineActDefinition
  readonly actQuests: readonly MainlineQuestItem[]
  readonly actProgressPercent: number
  readonly wishCurrentTier: 1 | 2 | 3
  readonly wishAllDone: boolean
  readonly wishBadge: string
  readonly wishObjective: string
  readonly wishPerk: string
  readonly wishProgressPercent: number
  readonly totalControlledNetWorthFen: number
  readonly activeRoutesCount: number
  readonly stats: ProtagonistStats
  readonly synergies: readonly SynergyStatusItem[]
  readonly activeSynergyCount: number
  readonly smartCues: readonly SmartActionCue[]
}

export interface EndingVerdictProjection {
  readonly archetype: EndingArchetype
  readonly score: number
  readonly stats: ProtagonistStats
  readonly radarAxes: readonly { readonly label: string; readonly value: number }[]
  readonly activeSynergies: readonly SynergyStatusItem[]
  readonly wishCompletedTiers: number
  readonly highlights: readonly string[]
}

const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, Math.round(value)))

export function projectMainlineHud(view: PlayingView, features: PlayFeatures): MainlineHudProjection {
  const yearNum = Math.max(2020, Math.min(2025, Number(view.date.slice(0, 4)) || 2020)) as 2020 | 2021 | 2022 | 2023 | 2024 | 2025
  const act = MAINLINE_ACTS.find(a => a.year === yearNum) ?? MAINLINE_ACTS[0]!
  const w = features.workbench

  // Aggregate real committed financial & operational metrics across controlled accounts
  const totalCashFen = w.finance.reduce((sum, f) => sum + f.cashFen, 0)
  const totalAvailableFen = w.finance.reduce((sum, f) => sum + f.availableFen, 0)
  const totalPrepaidFen = w.finance.reduce((sum, f) => sum + f.prepaidLiabilityFen, 0)
  const totalPayableFen = w.finance.reduce((sum, f) => sum + f.payableFen, 0)
  const totalShortfallFen = w.finance.reduce((sum, f) => sum + Math.max(f.protectionShortfallFen, f.commitmentShortfallFen), 0)
  const totalInvestmentFen = w.finance.reduce((sum, f) => sum + (f.investmentValueFen ?? f.lastKnownInvestmentValueFen ?? 0), 0)
  const totalIncomeFen = w.finance.reduce(
    (sum, f) => sum + f.metrics.filter(m => m.kind === 'income').reduce((acc, m) => acc + m.deltaFen, 0),
    0
  )
  const totalControlledNetWorthFen = totalCashFen + totalInvestmentFen - totalPrepaidFen - totalPayableFen

  const firstPaid = features.firstOrder.result.paymentFen > 0
  const researchesDone = features.market.researches.filter(r => r.status === 'completed').length
  const marketFills = features.market.fills.filter(f => f.date <= view.date).length
  const videoWorksDone = (features.video?.works.filter(wk => wk.reviewedAt !== null).length ?? 0) + (firstPaid ? 1 : 0)
  const videoAudience = features.video?.audiences.reduce((sum, a) => sum + a.size, 0) ?? 0
  const courseSamplesDone = features.course?.courses.filter(c => c.sampleReady).length ?? 0
  const courseCohortsClosed = features.course?.cohorts.filter(c => c.closedAt !== null).length ?? 0
  const courseGraduates = features.course?.enrollments.filter(e => e.graduated && e.refundedFen === 0).length ?? 0
  const relayPermissions = features.relay?.applications.filter(a => a.status === 'approved').length ?? 0
  const relayPeriodsDone = features.relay?.periods.filter(p => p.status === 'closed').length ?? 0
  const ecoContractsDone = features.deepseek?.contracts.filter(c => c.status === 'completed').length ?? 0
  const equityAgreements = features.deepseek?.agreements.length ?? 0
  const linzhouPilots = features.story.linzhou.jobs.pilot?.status === 'completed' ? 1 : 0
  const linzhouPublished = features.story.linzhou.publishedAt !== null && features.story.linzhou.publishedAt <= view.date
  const workspaceUpgraded = features.life.scene.workspaceCompleted
  const restsCompleted = features.life.jobs.filter(j => j.kind === 'rest' && j.status === 'completed').length
  const lifeCompleted = features.life.jobs.filter(j => j.status === 'completed').length
  const promisesFulfilled = features.life.promises.filter(p => p.status === 'fulfilled').length
  const promisesMissed = features.life.promises.filter(p => p.status === 'missed').length
  const unresolvedIncidents = features.story.incidents.filter(i => i.resolvedAt === null && i.stage !== 'normal').length

  const activeRoutesCount = [
    marketFills > 0 || researchesDone > 0,
    videoWorksDone > 0,
    courseSamplesDone > 0 || courseCohortsClosed > 0,
    relayPermissions > 0 || relayPeriodsDone > 0,
    ecoContractsDone > 0 || equityAgreements > 0,
  ].filter(Boolean).length

  // Derive 5-Dimension Protagonist Mastery & Energy cleanly from committed game history
  const baseTech = view.backgroundId === 'technical_employee' ? 28 : 16
  const baseCraft = view.backgroundId === 'content_employee' ? 28 : 16
  const tech = clamp(
    baseTech +
      researchesDone * 6 +
      relayPermissions * 12 +
      relayPeriodsDone * 8 +
      ecoContractsDone * 14 +
      linzhouPilots * 12 +
      (linzhouPublished ? 10 : 0)
  )
  const craft = clamp(
    baseCraft +
      videoWorksDone * 9 +
      courseSamplesDone * 12 +
      courseCohortsClosed * 10 +
      Math.min(18, Math.floor(videoAudience / 25)) +
      (features.life.jobs.some(j => j.kind === 'peer_notes' && j.status === 'completed') ? 10 : 0)
  )
  const biz = clamp(
    18 +
      (firstPaid ? 8 : 0) +
      Math.min(20, marketFills * 4) +
      courseCohortsClosed * 9 +
      relayPeriodsDone * 9 +
      ecoContractsDone * 12 +
      equityAgreements * 15 +
      (features.life.jobs.some(j => j.kind === 'partner_review' && j.status === 'completed') ? 10 : 0)
  )
  const reputation = clamp(
    20 +
      (firstPaid ? 8 : 0) +
      videoWorksDone * 5 +
      courseGraduates * 3 +
      relayPeriodsDone * 7 +
      ecoContractsDone * 10 +
      promisesFulfilled * 8 -
      promisesMissed * 14 -
      unresolvedIncidents * 12 -
      (totalShortfallFen > 0 ? 18 : 0)
  )
  const quarterSpentAp = view.budget.total - view.budget.available
  const rawEnergy =
    72 +
    (workspaceUpgraded ? 10 : 0) +
    restsCompleted * 9 +
    promisesFulfilled * 5 -
    quarterSpentAp * 6 -
    unresolvedIncidents * 10 -
    (totalShortfallFen > 0 ? 12 : 0)
  const energy = clamp(rawEnergy, 15, 100)
  const energyStateLabel = energy >= 80 ? '心流充沛' : energy >= 55 ? '节奏平稳' : energy >= 35 ? '略感疲惫' : '高压透支'

  const stats: ProtagonistStats = { tech, craft, biz, reputation, energy, energyStateLabel }

  // Cross-Route Synergies
  const hasCompanyCapital = (view.operations?.businesses.filter(b => b.company).length ?? 0) > 0 && marketFills > 0
  const synergyMap: Record<string, boolean> = {
    'content-to-course': videoAudience > 0 && (courseSamplesDone > 0 || (features.course?.businesses.length ?? 0) > 0),
    'audience-to-relay': videoAudience > 0 && (relayPermissions > 0 || (features.relay?.businesses.length ?? 0) > 0),
    'course-to-deepseek': courseGraduates > 0 && (features.deepseek?.businesses.length ?? 0) > 0,
    'capital-to-venture': hasCompanyCapital,
    'linzhou-open-tech': firstPaid && linzhouPilots > 0,
    'life-anchor-flow': workspaceUpgraded && (promisesFulfilled >= 1 || lifeCompleted >= 2),
  }
  const synergies: SynergyStatusItem[] = SYNERGY_MATRIX.map(item => ({
    ...item,
    active: synergyMap[item.id] === true,
  }))
  const activeSynergyCount = synergies.filter(s => s.active).length

  // Act-Specific Concrete Quests
  const employedNow = w.employment.some(e => e.segments.some(s => s.to === null))
  const actQuestsByYear: Record<number, readonly MainlineQuestItem[]> = {
    2020: [
      {
        id: 'act1-work-or-cash',
        label: '稳住生存现金流（安排在岗工作或保持可花 ≥ ¥32,000）',
        detail: employedNow ? '本季在岗安排已生效' : '可前往本季安排确认在岗工作（2点）',
        done: employedNow || totalAvailableFen >= 3_200_000,
        targetScreen: 'quarter',
      },
      {
        id: 'act1-first-attempt',
        label: '完成破局首试（手工首单回款 或 完成1次市场研究/委托）',
        detail: firstPaid ? '手工首单已实收 ¥1,300' : researchesDone > 0 || marketFills > 0 ? '已完成首次市场动作' : '从首单或模拟市场迈出第一步',
        done: firstPaid || researchesDone > 0 || marketFills > 0,
        targetScreen: view.playerProfile.approach === 'investment' ? 'market' : 'quarter',
      },
      {
        id: 'act1-life-connection',
        label: '安顿生活节奏（完成休整、改善住处或联系1位伙伴）',
        detail: lifeCompleted > 0 ? `已完成 ${lifeCompleted} 项生活记录` : '留1点给生活，稳住长线状态',
        done: lifeCompleted > 0,
        targetScreen: 'life',
      },
    ],
    2021: [
      {
        id: 'act2-networth',
        label: '构筑早期安全垫（可控净资产达到 ¥60,000）',
        detail: `当前可控净资产 ${moneyText(totalControlledNetWorthFen)}`,
        done: totalControlledNetWorthFen >= 6_000_000,
        targetScreen: 'finance',
      },
      {
        id: 'act2-linzhou-or-case',
        label: '蓄势未来连接（参与林舟早期试点 或 积累 ≥2 项作品/研究）',
        detail: linzhouPilots > 0 ? '已完成林舟早期协作试点' : `当前作品/研究累计 ${videoWorksDone + researchesDone} 项`,
        done: linzhouPilots > 0 || videoWorksDone + researchesDone >= 2,
        targetScreen: firstPaid ? 'story' : 'video',
      },
      {
        id: 'act2-workspace',
        label: '点亮出租屋工作台（改善桌椅照明 或 兑现1项伙伴约定）',
        detail: workspaceUpgraded ? '工作间照明与桌椅已焕新' : '在生活面板投入 ¥3,000 / 1点永久升级住处',
        done: workspaceUpgraded || promisesFulfilled >= 1,
        targetScreen: 'life',
      },
    ],
    2022: [
      {
        id: 'act3-era-anchor',
        label: '迎接生成式破晓（获取图像辅助/API资格 或 筹备首门实操课）',
        detail: '2022下半年 Stable Diffusion 与 ChatGPT 节点相继开启',
        done: courseSamplesDone > 0 || relayPermissions > 0 || videoWorksDone >= 2,
        targetScreen: 'routes',
      },
      {
        id: 'act3-dual-route',
        label: '跑通多元布局（激活 ≥2 条路线或点亮1项跨路线协同）',
        detail: `已探索路线 ${activeRoutesCount} 条 · 激活协同 ${activeSynergyCount} 项`,
        done: activeRoutesCount >= 2 || activeSynergyCount >= 1,
        targetScreen: 'routes',
      },
      {
        id: 'act3-capital',
        label: '跨过十万门槛（可控净资产达到 ¥120,000）',
        detail: `当前可控净资产 ${moneyText(totalControlledNetWorthFen)}`,
        done: totalControlledNetWorthFen >= 12_000_000,
        targetScreen: 'finance',
      },
    ],
    2023: [
      {
        id: 'act4-linzhou-branch',
        label: '时代的十字路口（见证或参与林舟工具发布抉择 / 完成课程更新）',
        detail: linzhouPublished ? `林舟路线已揭晓（${features.story.linzhou.branch === 'open' ? '开放路径' : '默认封闭'}）` : '关注变化与处置及课程更新窗口',
        done: linzhouPublished || courseCohortsClosed > 0 || relayPeriodsDone > 0,
        targetScreen: 'story',
      },
      {
        id: 'act4-reputation',
        label: '建立行业口碑护城河（口碑 ≥ 45 且零违约资金缺口）',
        detail: `当前口碑 ${reputation} · 缺口 ${moneyText(totalShortfallFen)}`,
        done: reputation >= 45 && totalShortfallFen === 0,
        targetScreen: 'quarter',
      },
      {
        id: 'act4-scale',
        label: '经营正循环（累计确认经营/服务收入 ≥ ¥30,000 或净资产 ≥ ¥220,000）',
        detail: `累计确认收入 ${moneyText(totalIncomeFen)}`,
        done: totalIncomeFen >= 3_000_000 || totalControlledNetWorthFen >= 22_000_000,
        targetScreen: 'routes',
      },
    ],
    2024: [
      {
        id: 'act5-deepseek-wave',
        label: '拥抱国产大模型浪潮（布局 DeepSeek 生态/可灵视频/多源中转）',
        detail: '2024.05 DeepSeek-V2 与 06月可灵AI相继开放条件接入',
        done: (features.deepseek?.businesses.length ?? 0) > 0 || relayPeriodsDone >= 1 || videoWorksDone >= 3,
        targetScreen: 'deepseek',
      },
      {
        id: 'act5-risk-boundary',
        label: '守住控制权边界（无失控未核查事故且客户预款足额受保护）',
        detail: unresolvedIncidents === 0 ? '当前控制边界清晰安全' : `有 ${unresolvedIncidents} 项风险信号待核实`,
        done: unresolvedIncidents === 0 && totalShortfallFen === 0,
        targetScreen: 'story',
      },
      {
        id: 'act5-synergy',
        label: '形成商业飞轮（点亮 ≥2 项跨路线协同 或 净资产 ≥ ¥400,000）',
        detail: `已点亮协同 ${activeSynergyCount}/6 项`,
        done: activeSynergyCount >= 2 || totalControlledNetWorthFen >= 40_000_000,
        targetScreen: 'routes',
      },
    ],
    2025: [
      {
        id: 'act6-r1-or-equity',
        label: '时代巅峰抉择（完成 DeepSeek 生态履约、架空股权评估或主业收官）',
        detail: '2025.01 R1 节点开启，04月起可核对明确架空股权尽调与跟投',
        done: ecoContractsDone > 0 || equityAgreements > 0 || totalControlledNetWorthFen >= 50_000_000,
        targetScreen: 'deepseek',
      },
      {
        id: 'act6-clean-obligations',
        label: '清白履约收尾（零资金缺口、零逾期债务、妥善回应伙伴约定）',
        detail: totalPayableFen === 0 && totalShortfallFen === 0 ? '当前无逾期欠款与保护缺口' : '请在终局前结清到期应付或退款义务',
        done: totalPayableFen === 0 && totalShortfallFen === 0 && unresolvedIncidents === 0,
        targetScreen: 'finance',
      },
      {
        id: 'act6-epilogue-ready',
        label: '走完二十四季长卷（抵达 2025-12-31 解锁人生终局评定）',
        detail: `已走过 ${features.journey?.closedQuarters ?? 0}/24 个季度`,
        done: (features.journey?.closedQuarters ?? 0) >= 24 || view.phase !== 'playing',
        targetScreen: 'room',
      },
    ],
  }

  const actQuests = actQuestsByYear[yearNum] ?? actQuestsByYear[2020]!
  const actDoneCount = actQuests.filter(q => q.done).length
  const actProgressPercent = Math.round((actDoneCount / actQuests.length) * 100)

  // Wish Tier Evaluation
  const wishId = view.playerProfile.wishId
  const wishDefs = WISH_QUESTLINES[wishId]
  const wishChecks: Record<typeof wishId, readonly [boolean, boolean, boolean]> = {
    financial_independence: [
      totalControlledNetWorthFen >= 5_000_000 && totalShortfallFen === 0,
      totalControlledNetWorthFen >= 20_000_000 && (marketFills > 0 || totalIncomeFen > 3_000_000),
      totalControlledNetWorthFen >= 80_000_000 && totalShortfallFen === 0 && totalPayableFen === 0,
    ],
    own_brand: [
      firstPaid || videoWorksDone >= 1,
      videoAudience >= 80 || courseSamplesDone >= 1 || courseCohortsClosed >= 1,
      activeRoutesCount >= 2 && totalIncomeFen >= 15_000_000 && totalShortfallFen === 0,
    ],
    important_technology: [
      researchesDone >= 1 || relayPermissions >= 1 || linzhouPilots >= 1,
      linzhouPilots >= 1 || relayPeriodsDone >= 1 || (features.deepseek?.businesses.length ?? 0) > 0,
      (linzhouPublished || ecoContractsDone >= 1 || equityAgreements >= 1) && unresolvedIncidents === 0,
    ],
    autonomy: [
      restsCompleted >= 1 || workspaceUpgraded,
      promisesFulfilled >= 2 && promisesMissed === 0,
      workspaceUpgraded && promisesFulfilled >= 3 && promisesMissed === 0 && totalShortfallFen === 0 && totalAvailableFen >= 10_000_000,
    ],
  }
  const tiers = wishChecks[wishId]
  const completedTiers = tiers.filter(Boolean).length
  const wishAllDone = completedTiers === 3
  const currentTierIdx = Math.min(2, completedTiers)
  const currentWishDef = wishDefs[currentTierIdx]!
  const wishProgressPercent = Math.round((completedTiers / 3) * 100)

  // Smart Strategic Action Cues (Top 2 immediate actionable guidance)
  const smartCues: SmartActionCue[] = []
  if (w.pause || w.progression.requiresDelivery || totalShortfallFen > 0 || unresolvedIncidents > 0) {
    smartCues.push({
      id: 'cue-urgent',
      badge: '优先处置',
      label: w.progression.requiresDelivery ? '提交已完成的作品以推进回款' : '处理当前暂停事项或资金缺口',
      reason: w.progression.barrierLabel ?? '解决当前阻断事项后即可顺畅推进日历',
      screen: unresolvedIncidents > 0 ? 'story' : 'quarter',
    })
  }
  if (view.phase === 'playing' && !employedNow && !w.atQuarterEnd && view.budget.available >= 2 && totalAvailableFen < 15_000_000) {
    smartCues.push({
      id: 'cue-work',
      badge: '稳健现金流',
      label: '保留本季在岗工作（2点）',
      reason: `每月稳定领薪 ${moneyText(w.employmentMonthlySalaryFen)}，为副业与投资兜底生活费`,
      screen: 'quarter',
      directCommand: { kind: 'WorkQuarter', payload: {}, label: '保留这一季的工作' },
    })
  }
  if (w.quarter === '2020-Q1' && features.firstOrder.status === 'available' && view.budget.available >= 1) {
    smartCues.push({
      id: 'cue-first-order',
      badge: '破局首单',
      label: '承接 ¥1,300 手工剪辑小单（1点）',
      reason: '净赚 ¥800 并沉淀首份真实已付案例，是后续开启视频与卖课的关键基石',
      screen: 'quarter',
      directCommand: { kind: 'StartFirstOrder', payload: {}, label: '接下这笔手工单' },
    })
  }
  if (smartCues.length < 2 && view.budget.available >= 1 && !workspaceUpgraded && totalAvailableFen >= 700_000) {
    smartCues.push({
      id: 'cue-workspace',
      badge: '永久增益',
      label: '改善桌椅与照明（¥3,000 · 1点）',
      reason: '永久焕新房间视觉场景，提升身心精力上限并推进生活自主愿景',
      screen: 'life',
      target: { accountId: 'personal', lifeSelection: 'workspace' },
    })
  }
  if (smartCues.length < 2 && view.budget.available >= 1) {
    smartCues.push({
      id: 'cue-explore-route',
      badge: '时代机遇',
      label: yearNum >= 2024 ? '前往 DeepSeek 与五路线拓展新飞轮' : yearNum >= 2022 ? '抓住生成式AI节点布局视频/课程/中转' : '利用剩余行动点进行市场研习或人物交往',
      reason: `本季尚余 ${view.budget.available} 点行动预算，合理组合投资、实业与生活羁绊`,
      screen: yearNum >= 2024 ? 'deepseek' : yearNum >= 2022 ? 'routes' : 'market',
    })
  }
  if (smartCues.length < 2 && view.phase === 'playing') {
    smartCues.push({
      id: 'cue-advance',
      badge: '推进时光',
      label: `推进至下一关键反馈（${w.progression.nextQuarterDate ?? w.progression.quarterTarget}）`,
      reason: '本季核心安排已就绪，让时间检验你的布局与约定',
      screen: 'quarter',
    })
  }

  return {
    act,
    actQuests,
    actProgressPercent,
    wishCurrentTier: currentWishDef.tier,
    wishAllDone,
    wishBadge: currentWishDef.badge,
    wishObjective: currentWishDef.objective,
    wishPerk: currentWishDef.perkLabel,
    wishProgressPercent,
    totalControlledNetWorthFen,
    activeRoutesCount,
    stats,
    synergies,
    activeSynergyCount,
    smartCues: smartCues.slice(0, 2),
  }
}

export function projectEndingVerdict(view: PlayingView, features: PlayFeatures): EndingVerdictProjection {
  const hud = projectMainlineHud(view, features)
  const w = features.workbench
  const totalShortfallFen = w.finance.reduce((sum, f) => sum + Math.max(f.protectionShortfallFen, f.commitmentShortfallFen), 0)
  const unpaidObligations = w.finance.reduce((sum, f) => sum + f.payableFen, 0)
  const unresolvedIncidents = features.story.incidents.filter(i => i.resolvedAt === null && i.stage !== 'normal').length
  const promisesFulfilled = features.life.promises.filter(p => p.status === 'fulfilled').length

  const wealthAxis = clamp(Math.round(Math.log10(Math.max(10_000, hud.totalControlledNetWorthFen / 100)) * 20 - 40))
  const radarAxes = [
    { label: '财富厚度', value: wealthAxis },
    { label: '技术深度', value: hud.stats.tech },
    { label: '内容品牌', value: hud.stats.craft },
    { label: '商业协同', value: clamp(hud.stats.biz + hud.activeSynergyCount * 8) },
    { label: '行业信誉', value: hud.stats.reputation },
    { label: '生活温度', value: clamp(40 + promisesFulfilled * 15 + (features.life.scene.workspaceCompleted ? 15 : 0)) },
  ]

  const wishCompletedTiers = Math.round((hud.wishProgressPercent / 100) * 3)
  const rawScore = Math.round(
    radarAxes.reduce((s, a) => s + a.value, 0) / radarAxes.length +
      wishCompletedTiers * 6 +
      hud.activeSynergyCount * 4 -
      (totalShortfallFen > 0 ? 25 : 0) -
      (unpaidObligations > 0 ? 12 : 0) -
      unresolvedIncidents * 10
  )
  const score = clamp(rawScore, 10, 100)

  let archetypeId = 'steady-practitioner'
  if (totalShortfallFen > 0 || unpaidObligations > 200_000 || unresolvedIncidents > 0) {
    archetypeId = 'turbulent-survivor'
  } else if (score >= 82 && hud.activeSynergyCount >= 2 && wishCompletedTiers >= 2) {
    archetypeId = 'era-architect'
  } else if (hud.totalControlledNetWorthFen >= 60_000_000 && view.playerProfile.wishId === 'financial_independence') {
    archetypeId = 'independent-magnate'
  } else if (hud.stats.craft >= 60 || view.playerProfile.wishId === 'own_brand' && wishCompletedTiers >= 2) {
    archetypeId = 'lighthouse-creator'
  } else if (hud.stats.tech >= 60 || view.playerProfile.wishId === 'important_technology' && wishCompletedTiers >= 2) {
    archetypeId = 'tech-guardian'
  } else if (promisesFulfilled >= 2 && features.life.scene.workspaceCompleted) {
    archetypeId = 'poetic-autonomy'
  }

  const archetype = ENDING_ARCHETYPES.find(a => a.id === archetypeId) ?? ENDING_ARCHETYPES[5]!
  const activeSynergies = hud.synergies.filter(s => s.active)

  const highlights: string[] = [
    `六年可控净资产终值：${moneyText(hud.totalControlledNetWorthFen)}`,
    `人生愿景阶梯达成：${wishCompletedTiers} / 3 阶`,
    `跨赛道商业协同飞轮点亮：${activeSynergies.length} / 6 项`,
    `人物共同约定兑现：${promisesFulfilled} 项 · 住处升级：${features.life.scene.workspaceCompleted ? '已完成' : '原貌'}`,
  ]

  return {
    archetype,
    score,
    stats: hud.stats,
    radarAxes,
    activeSynergies,
    wishCompletedTiers,
    highlights,
  }
}
