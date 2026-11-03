import type {SeasonFocusChoice} from './season-thread.ts'

/** These are reading destinations, not commands or new promises. */
export function seasonChoiceDirection(choice:SeasonFocusChoice):{title:string;next:string}|null{
 const f=choice.focus
 if(choice.scope!=='entry'||choice.disabledReason!==null||(f.entityId!==null&&!(f.kind==='life'&&f.entityId===f.selection))||f.businessId!==undefined)return null
 switch(f.kind){
  case 'work':return {title:'保留一份工作',next:'先看行动占用与工资日期，再决定是否上班。'}
  case 'life':
   if(f.selection==='rest')return {title:'给自己放几天假',next:'先看休整的时间与代价，再决定如何安排。'}
   if(f.selection==='workspace')return {title:'改善住处',next:'先看改善住处的费用与时间，再决定投入。'}
   {const person=/^与(.+)的原安排$/.exec(choice.title)?.[1]
    return person?{title:'和'+person+'相处',next:'先看看对方的近况，再决定怎样留出时间。'}:null}
  case 'market':return f.entityKind===undefined?{title:f.accountId==='personal'?'研究模拟投资':'企业的模拟投资',next:'先看模拟市场资料，再决定是否研究或下单。'}:null
  case 'video':return f.videoTarget===null?{title:'尝试视频创作',next:'先看账号与作品选择，再决定要不要开工。'}:null
  case 'course':return f.courseTarget===null?{title:'筹备一门课',next:choice.stage==='course-unavailable'?'课程尚未开放，先看看准备条件与已有案例。':'先看主题与教学准备，再决定投入。'}:null
  case 'relay':return f.relayTarget===null?{title:'经营中转服务',next:'先看开站条件与客户约定，再决定投入。'}:null
  case 'ecosystem':return f.ecosystemTarget===null?{title:'尝试 AI 项目合作',next:'先看模型、用途与合作条件，再决定投入。'}:null
  case 'equity':return f.equityTarget===null?{title:'了解架空股权',next:'先看架空模式与参与条件，再决定是否投入。'}:null
  default:return null
 }
}
export function seasonChoiceTitle(choice:SeasonFocusChoice):string{return seasonChoiceDirection(choice)?.title??choice.title}
export function seasonChoiceDateLabel(choice:SeasonFocusChoice,currentDate:string):string{
 if(choice.scope==='entry'&&choice.focus.kind==='course'&&choice.focus.courseTarget===null&&choice.stage==='course-unavailable')return '开放日期'
 return choice.nextDate!==null&&choice.nextDate>currentDate?'下次反馈':'原反馈'
}
