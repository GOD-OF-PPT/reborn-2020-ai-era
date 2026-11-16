import type { PlayerProfile } from '../core/player-profile.ts'

export interface MainlineActDefinition {
  readonly actNumber: 1 | 2 | 3 | 4 | 5 | 6
  readonly year: 2020 | 2021 | 2022 | 2023 | 2024 | 2025
  readonly title: string
  readonly subtitle: string
  readonly eraWave: string
  readonly dilemmaHint: string
}

export interface WishTierDefinition {
  readonly tier: 1 | 2 | 3
  readonly badge: string
  readonly objective: string
  readonly perkLabel: string
}

export interface SynergyDefinition {
  readonly id: string
  readonly name: string
  readonly routesLabel: string
  readonly conditionSummary: string
  readonly effectSummary: string
}

export interface EndingArchetype {
  readonly id: string
  readonly rank: 'S' | 'A' | 'B' | 'C'
  readonly title: string
  readonly tagline: string
  readonly epilogueSummary: string
}

export const MAINLINE_ACTS: readonly MainlineActDefinition[] = [
  {
    actNumber: 1,
    year: 2020,
    title: '第一幕 · 微光破局',
    subtitle: '寒冬出租屋里的第一桶金与安全垫',
    eraWave: '2020.06 OpenAI API 私有测试开启先锋信号；远程协作与手工数字内容需求萌发。',
    dilemmaHint: '先稳住本职现金流，并用首笔小单或首次产业调研验证前世记忆的边界。',
  },
  {
    actNumber: 2,
    year: 2021,
    title: '第二幕 · 暗流蓄势',
    subtitle: '副业现金流、林舟早期协作与生活支点',
    eraWave: '2021.01 林舟团队发出工具协作邀约；传统互联网见顶，算力与数据暗流涌动。',
    dilemmaHint: '避免精力透支：改善出租屋工作台、积累已交付案例，为生成式浪潮储备筹码。',
  },
  {
    actNumber: 3,
    year: 2022,
    title: '第三幕 · 奇点前夜',
    subtitle: 'Stable Diffusion 开源与 ChatGPT 破晓',
    eraWave: '2022.08 Stable Diffusion 开源、2022.11 ChatGPT 研究预览上线，内容与知识赛道洗牌。',
    dilemmaHint: '抢先完成本地图像辅助资格或开启知识实操课筹备，打通第一组跨路线协同飞轮。',
  },
  {
    actNumber: 4,
    year: 2023,
    title: '第四幕 · 百模大战',
    subtitle: 'GPT-4 冲击、开源抉择与服务口碑护城河',
    eraWave: '2023.03 GPT-4 发布、05月林舟开源/封闭抉择、07月 Llama 2 与生成式服务规范落地。',
    dilemmaHint: '面对模型换代带来的课程更新与API价格调整，守住真实交付比盲目扩招更重要。',
  },
  {
    actNumber: 5,
    year: 2024,
    title: '第五幕 · 深水博弈',
    subtitle: 'DeepSeek-V2/V3 降价风暴、可灵视频与代理风控',
    eraWave: '2024.05 DeepSeek-V2、06月可灵AI、10月智能代理支持、12月 DeepSeek-V3 接连登场。',
    dilemmaHint: '切入企业级模型适配与生成式视频；若启用代理辅助，务必设好预算上限与独立核查。',
  },
  {
    actNumber: 6,
    year: 2025,
    title: '第六幕 · 时代答卷',
    subtitle: 'R1 推理破圈、架空股权博弈与六年终章回响',
    eraWave: '2025.01 DeepSeek-R1 发布、04月起架空股权尽调与谈判开启、09月合成内容标识施行。',
    dilemmaHint: '冲刺开局人生终极愿景，结清所有客户保护预款与挚友承诺，交出无悔的六年答卷。',
  },
] as const

export const WISH_QUESTLINES: Readonly<Record<PlayerProfile['wishId'], readonly WishTierDefinition[]>> = {
  financial_independence: [
    { tier: 1, badge: '安全储备', objective: '可控净资产突破 ¥50,000 且无逾期债务', perkLabel: '市场调研视野开启' },
    { tier: 2, badge: '多元现金流', objective: '可控净资产突破 ¥200,000 且至少跑通 1 条经营或投资正收益闭环', perkLabel: '复利直觉（资金周转从容度提升）' },
    { tier: 3, badge: '财务自由彼岸', objective: '可控净资产突破 ¥800,000、零资金缺口且持有跨周期优质资产', perkLabel: '时代长期主义者勋章' },
  ],
  own_brand: [
    { tier: 1, badge: '署名起点', objective: '完成首笔客户验收回款作品或真实交付案例', perkLabel: '真实案例库解锁' },
    { tier: 2, badge: '垂直口碑', objective: '累计受众突破 80 人或成功开办真实样课/班期且零未退违约', perkLabel: '私域信任飞轮（课程/中转自然引流）' },
    { tier: 3, badge: '长青个人品牌', objective: '打通视频与课程/生态双线，累计确认经营收入突破 ¥150,000 且口碑完好', perkLabel: '灯塔创作者勋章' },
  ],
  important_technology: [
    { tier: 1, badge: '技术探路', objective: '完成至少 1 项技术准备/市场深度研习或 API 供应资格申请', perkLabel: '底层工具链敏感度' },
    { tier: 2, badge: '开源与算力实践', objective: '参与林舟协作试点或跑通 API 中转/模型适配完整履约周期', perkLabel: '工程容灾经验' },
    { tier: 3, badge: '大模型生态筑路人', objective: '完成林舟关键分支或 DeepSeek 生态交付/架空治理提案，风险全核验', perkLabel: '时代架构师勋章' },
  ],
  autonomy: [
    { tier: 1, badge: '安顿身心', objective: '完成一次七天休整或改善出租屋桌椅照明', perkLabel: '温暖房间与充沛精力' },
    { tier: 2, badge: '真挚连接', objective: '兑现至少 2 项人物共同约定且保持零失约记录', perkLabel: '同路人羁绊回响' },
    { tier: 3, badge: '把日子握在手里', objective: '改善住处、兑现 3 项以上挚友约定、无资金缺口且拥有可支配生活储备', perkLabel: '人间清醒自由人勋章' },
  ],
}

export const SYNERGY_MATRIX: readonly SynergyDefinition[] = [
  {
    id: 'content-to-course',
    name: '内容私域引流飞轮',
    routesLabel: 'AI短视频 × AI卖课',
    conditionSummary: '积累已验收视频作品与真实视频受众后筹备同垂类课程',
    effectSummary: '直接复用同目标人群视频受众，省去 ¥6,000 冷启动推广费并提高招生精准度',
  },
  {
    id: 'audience-to-relay',
    name: '开发者种子转化池',
    routesLabel: 'AI短视频 × API中转站',
    conditionSummary: '拥有技术向视频受众后开启 API 中转服务获客',
    effectSummary: '视频受众直接转化为中转站潜客来源，降低获客摩擦并建立真实口碑连接',
  },
  {
    id: 'course-to-deepseek',
    name: '毕业学员企业转介',
    routesLabel: 'AI卖课 × DeepSeek生态',
    conditionSummary: '拥有完课未退款的毕业学员群体并开启 DeepSeek 生态主体',
    effectSummary: '解锁 0 现金成本「毕业学员新服务需求转介」，精准对接企业培训与部署商机',
  },
  {
    id: 'capital-to-venture',
    name: '二级资本反哺实业',
    routesLabel: '模拟A股 × 独立企业主体',
    conditionSummary: '通过模拟市场研究与交收积累超额个人现金并注资实业企业',
    effectSummary: '跨越课程工作室、API中转站（¥5,000+）与架空股权（¥8,000+）自有资金门槛',
  },
  {
    id: 'linzhou-open-tech',
    name: '林舟技术共创回响',
    routesLabel: '手工/视频案例 × 林舟协作线',
    conditionSummary: '凭真实手工案例参与林舟试点与持续协作，抵达 2023 发布分支',
    effectSummary: '解锁本局专属开放工具路径与后续风险核查先手优势',
  },
  {
    id: 'life-anchor-flow',
    name: '生活锚点与心流续航',
    routesLabel: '改善住处 × 四大人物羁绊',
    conditionSummary: '完成改善桌椅照明并与唐萤/许澄/陈屿建立真实履约经历',
    effectSummary: '房间视觉永久焕新，在高强度多线经营中稳住身心节奏与人生终章评价',
  },
] as const

export const ENDING_ARCHETYPES: readonly EndingArchetype[] = [
  {
    id: 'era-architect',
    rank: 'S',
    title: '破浪筑路者 · 时代的清醒掌舵人',
    tagline: '你既抓住了改变命运的浪潮，也没有在狂热中弄丢自己的边界与挚友。',
    epilogueSummary: '六年二十四季，你从一间普通出租屋起步，打通了跨赛道商业飞轮，兑现了对客户与朋友的每一份承诺，在AI时代的奇点处留下了属于自己的坐标。',
  },
  {
    id: 'independent-magnate',
    rank: 'S',
    title: '复利远航家 · 跨越周期的资本与实业双修者',
    tagline: '不赌虚幻的暴富神话，把每一分确定性酿成了真正的自由。',
    epilogueSummary: '你在市场波动与实业经营之间建立了坚固的安全垫，资产丰厚且账目清白，未来每一天的时间都真正归你自己支配。',
  },
  {
    id: 'lighthouse-creator',
    rank: 'A',
    title: '灯塔创作者 · 把手艺与知识做成长期品牌',
    tagline: '工具换了一代又一代，但别人记住的始终是你认真交付的名字。',
    epilogueSummary: '从第一单手工剪辑到成体系的内容与课程服务，你没有靠贩卖焦虑收割，而是用真实案例赢得了长久的信任。',
  },
  {
    id: 'tech-guardian',
    rank: 'A',
    title: '算力守夜人 · 技术浪潮里的可靠连接者',
    tagline: '当所有人都在谈论风口时，你在幕后把每一条线路、每一次部署核对清楚。',
    epilogueSummary: '你深入API中转、开源协作与大模型企业落地一线，在权限与风险面前守住了独立验证的底线。',
  },
  {
    id: 'poetic-autonomy',
    rank: 'A',
    title: '人间清醒客 · 把日子稳稳握在自己手里',
    tagline: '没有被时代的焦虑裹挟，钱够花、屋有光、身边有人可约。',
    epilogueSummary: '你用适度的工作与经营换来了宽裕的生活余地，认真赴了每一场朋友的约，把重来一次的六年过成了真正想要的生活。',
  },
  {
    id: 'steady-practitioner',
    rank: 'B',
    title: '笃行实干派 · 在风浪中站稳脚跟的普通英雄',
    tagline: '虽未席卷八方财富，却凭双手把生活一步步推向了温暖的高处。',
    epilogueSummary: '六年里你有取有舍，守住了本金与信用，为2025年之后的漫长人生攒下了扎实的底气。',
  },
  {
    id: 'turbulent-survivor',
    rank: 'C',
    title: '风暴幸存者 · 带着未结账单走过时代洪流',
    tagline: '浪潮比想象中更湍急，留下的教训与未完的责任同样真实。',
    epilogueSummary: '你在高速扩张或风险冲击中留下了尚未结清的义务或遗憾，但只要账目看清、脚步不停，尾声里依然有弥补与重整的机会。',
  },
] as const
