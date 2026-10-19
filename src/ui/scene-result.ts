import type {PlayingView,PlayFeatures} from './game-types.ts'
import {moneyText} from './game-text.ts'

/** Called only after the controller reports a complete saved transaction. */
export function savedSceneResult(kind:string,label:string,previous:PlayingView|null,current:PlayingView){
 const f=current.features as unknown as PlayFeatures,before=previous?.features as unknown as PlayFeatures|undefined,first=f.firstOrder
 if(kind==='WorkQuarter')return `这一季的工作已经安排好。月末才按实际在岗日期发薪；你还留着${current.budget.available}点，可以做自己的选择。`
 if(kind==='StartFirstOrder')return `你接下了这份手工小单。${first.dates.startAt}开工，${first.dates.submitBy}前完成并提交。客户的钱还没有到账。`
 if(kind==='SubmitDelivery')return '作品交出去了。接下来，等客户真正复核；验收和到账还会留下各自的日期。'
 if(kind==='AdvanceTime'){
  if(first.result.paymentFen>0&&(before?.firstOrder.result.paymentFen??0)===0)return `${current.date}，客户实际付来了${moneyText(first.result.paymentFen)}。制作成本${moneyText(first.result.directCostFen)}，这一单净得${moneyText(first.result.netOrderFen)}。`
  if(first.status==='awaiting_submission')return `${current.date}，这份作品已经做完。下一步，要由你亲手交给客户。`
  if(f.workbench.pause)return `${current.date}，日子在这里停了一下。${f.workbench.progression.barrierLabel??'有一件需要你面对的事。'}`
  return `${current.date}。已经确认的安排按真实日期发生，眼前又多了一次选择。`
 }
 return `${label}，已经记进这段人生。实际结果请看眼前的记录；未完成的承诺仍会延续。`
}
