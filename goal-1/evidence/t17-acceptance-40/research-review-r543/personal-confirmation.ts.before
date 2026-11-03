import type {CommandEnvelope} from '../core/run-types.ts'

/** Wording only: execution and eligibility remain with the original command. */
export function personalConfirmationAction(command:CommandEnvelope):string {
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
