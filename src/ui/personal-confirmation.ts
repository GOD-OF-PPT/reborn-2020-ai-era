import type {CommandEnvelope} from '../core/run-types.ts'

/** Wording only: execution and eligibility remain with the original command. */
export function personalConfirmationAction(command:CommandEnvelope):string {
 if(command.kind==='StartFirstOrder')return '接下这笔手工单'
 if(command.kind==='DeclineOffer')return '婉拒这笔报价'
 if(command.kind==='SkipOffer')return '略过这次委托'
 if(command.kind==='SubmitDelivery')return '交出这份作品'
 if(command.kind==='AdvanceTime')return '让日子继续'
 if(command.kind==='ResearchMarket')return '开始这项研究'
 if(command.kind==='WorkQuarter')return '安排本季工作'
 if(command.kind==='StartLifeWork'){
  const p=command.payload!==null&&typeof command.payload==='object'&&!Array.isArray(command.payload)?command.payload as Record<string,unknown>:null
  if(p?.personId===null&&p.reference===null){
   if(p.kind==='rest')return '开始休整'
   if(p.kind==='workspace')return '开始改善住处'
  }
 }
 return '就这样决定'
}
