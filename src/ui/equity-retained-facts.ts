import type {GamePanelProps} from './game-types.ts'
import {resolveEquitySceneTarget,type EquitySceneContext} from './equity-scene-target.ts'
import {moneyText} from './game-text.ts'

type Equity=NonNullable<GamePanelProps['features']['deepseek']>
const safeSum=(values:readonly number[])=>{const n=values.reduce((a,b)=>a+b,0);return Number.isSafeInteger(n)&&n>=0?n:null}
/** A business may stop while the original shares and credit remain. Known
 * records stay visible even when another original source cannot be resolved. */
export function equityRetainedFacts(v:Equity,b:{readonly id:string;readonly accountId:string},context:EquitySceneContext):string[]{
 const identity={runId:context.runId,accountId:b.accountId,businessId:b.id},facts:string[]=[],held:Equity['agreements'][number][]=[],credits:NonNullable<Equity['exits'][number]['receivable']>[]=[],unknown={holding:false,credit:false}
 for(const row of v.agreements.filter(a=>a.businessId===b.id)){
  const r=resolveEquitySceneTarget(v,{...identity,kind:'agreement',recordId:row.id},context)
  if(r.status!=='valid'||!r.agreement){unknown.holding=true;continue}
  if(r.agreement.shares>0)held.push(r.agreement)
 }
 for(const row of v.exits.filter(e=>e.businessId===b.id&&(e.receivableId!==null||e.receivable!==null||e.operationId!==null||e.soldShares>0))){
  const r=resolveEquitySceneTarget(v,{...identity,kind:'exit',recordId:row.id},context)
  if(r.status!=='valid'||!r.exit?.receivable){unknown.credit=true;continue}
  if(r.exit.receivable.remainingFen>0)credits.push(r.exit.receivable)
 }
 if(held.length)facts.push(`原协议仍持${safeSum(held.map(a=>a.shares))??'待核'}模拟股，尚持有成本${moneyText(safeSum(held.map(a=>a.asset!.bookCostFen)))}；估值不能花，停止不出售这些股份。`)
 if(unknown.holding)facts.push('另有本主体原持股的来源尚待核对；已核部分保留，没有按零补齐或换成另一份协议。')
 if(credits.length){const due=credits.map(c=>c.dueAt).sort()[0]!;facts.push(`本主体原转让仍待收${moneyText(safeSum(credits.map(c=>c.remainingFen)))}（${credits.length}笔），最早原到期${due}；${due<=context.date?'已有原款到约定日，收取仍须显选原金额。':'仍按各笔原到期日等候，应收不是现金。'}可以先保留原款，继续自己的生活。`)}
 if(unknown.credit)facts.push('另有本主体原转让款的来源尚待核对；已核原款继续保留，未知金额或日期没有按零或另一笔代替。')
 return facts
}
