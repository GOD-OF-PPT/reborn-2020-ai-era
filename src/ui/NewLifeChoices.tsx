import {BOOTSTRAP_CONTENT} from '../content/bootstrap.ts'
import type {PlayerProfile} from '../core/player-profile.ts'
import {backgroundNames,wishes,approaches,moneyText} from './game-text.ts'
import './home-onboarding.css'

export type NewLifeStep='identity'|'wish'|'approach'
export type NewLifeBackground='technical_employee'|'content_employee'
type Props={
 step:NewLifeStep;backgroundId:NewLifeBackground;wishId:PlayerProfile['wishId'];approach:PlayerProfile['approach'];seed:string
 onBackground:(id:NewLifeBackground)=>void;onWish:(id:PlayerProfile['wishId'])=>void;onApproach:(id:PlayerProfile['approach'])=>void;onSeedSettings:()=>void;onMemoryExplanation:()=>void
}
const wishThoughts={financial_independence:'让手里的钱，换来选择的余地。',own_brand:'留下能被人记住的作品与名字。',important_technology:'亲手参与一些值得的变化。',autonomy:'工作之外，也有自己想过的日子。'} as const

/** Only presentation and draft choices. Starting a life stays with Home's original form. */
export function NewLifeChoices({step,backgroundId,wishId,approach,seed,onBackground,onWish,onApproach,onSeedSettings,onMemoryExplanation}:Props){
 const profile=BOOTSTRAP_CONTENT.profiles.find(p=>p.id===backgroundId)!
 return <div className="entry-choice-layout">
  <div className="entry-choice-main">
   {step==='identity'?<>
    <fieldset><legend>你在2020年的背景</legend><div className="entry-backgrounds">
     {Object.entries(backgroundNames).map(([id,name])=><label key={id} className="entry-option"><input type="radio" name="background" value={id} checked={backgroundId===id} onChange={()=>onBackground(id as NewLifeBackground)}/><span><strong>{name}</strong><small>{id==='technical_employee'?'偏原型、技术学习与部署':'偏选题、表达与客户沟通'}</small></span></label>)}
    </div></fieldset>
    <dl className="entry-budget"><div><dt>期初储蓄</dt><dd>{moneyText(profile.initialCashFen)}</dd></div><div><dt>每月生活费</dt><dd>{moneyText(profile.monthlyLivingCostFen)}</dd></div><div><dt>全月在岗工资</dt><dd>{moneyText(profile.monthlySalaryFen)}</dd></div></dl>
    <p className="entry-note">工资按实际上班日期结算。</p>
   </>:step==='wish'?<fieldset><legend>这一次，最想留住什么？</legend><div className="entry-wishes">
    {Object.entries(wishes).map(([id,name])=><label key={id} className="entry-option"><input type="radio" name="wish" value={id} checked={wishId===id} onChange={()=>onWish(id as PlayerProfile['wishId'])}/><span><strong>{name}</strong><small>{wishThoughts[id as keyof typeof wishThoughts]}</small></span></label>)}
    </div><p className="entry-note">这是你在意的方向。每一次投入仍由你决定，不增加钱或行动。</p></fieldset>:<fieldset className="entry-approach-field" aria-label="先试哪一种安排？"><div className="entry-approaches">
     {Object.entries(approaches).map(([id,name])=><label key={id} className="entry-option"><input type="radio" name="approach" value={id} checked={approach===id} onChange={()=>onApproach(id as PlayerProfile['approach'])}/><span><strong>{name}</strong><small>{id==='first_order'?'保留工作，预览一笔当时可用的手工交付。':id==='investment'?'先理解产业、仓位和生活储备，再看模拟订单。':'不接受建议组合，自主选择时间和本金的去处。'}</small></span></label>)}
    </div><p className="entry-note">开局后逐项确认，也可以跳过引导；不会自动工作、接单或买股。</p></fieldset>}
  </div>
  <aside className="entry-choice-aside" aria-label="眼前的起点与已选方向">
   <p className="entry-aside-date">2020 · 重新出发</p>
   <dl className="entry-selection"><div><dt>你的起点</dt><dd>{backgroundNames[backgroundId]}</dd></div>{step!=='identity'?<div><dt>你在意的生活</dt><dd>{wishes[wishId]}</dd></div>:null}{step==='approach'?<div><dt>先从这里开始</dt><dd>{approaches[approach]}</dd></div>:null}</dl>
   {step==='approach'?<><p className="entry-note">记忆不是精确价格、购买资格或额外的钱。</p><button type="button" className="entry-seed-link" onClick={onMemoryExplanation}>那段模糊的记忆 ↗</button>
    <button type="button" className="entry-seed-link" onClick={onSeedSettings}>{seed?'固定种子 · 已填写 ↗':'固定种子（可选） ↗'}</button></>:<p className="entry-aside-thought">从一间普通住处，<br/>重新开始。</p>}
  </aside>
 </div>
}
