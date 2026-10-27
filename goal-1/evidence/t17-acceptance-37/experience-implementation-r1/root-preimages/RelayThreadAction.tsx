import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import type {RelaySceneTarget} from './relay-scene-target.ts'
import {relayJourneyAction,type RelayChoiceIntent} from './relay-journey.ts'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'

type Props={p:GamePanelProps;thread:PlayerThreadView;target:RelaySceneTarget|null|undefined;active:boolean;date:string|null;waitLabel:string;onChoose:(intent:RelayChoiceIntent)=>void;onToday:()=>void;children:(primary:{binding:SharedActionBinding;main:ReactNode;hint:string}|null)=>ReactNode}
/** The thought, keyboard and foreground paper share this same original decision. */
export function RelayThreadAction({p,thread,target,active,date,waitLabel,onChoose,onToday,children}:Props){
 if(!active)return children(null)
 const action=relayJourneyAction(p,target),showReason=!p.view.readOnly&&!p.view.hasCandidate&&p.view.saveStatus!=='conflict'
 const choice=(label:string,caption:string,activate:()=>void,hint:string)=>{const binding=makeSharedAction(p,label,activate,{allowReadOnly:true});return children({binding,hint,main:<div className="command moment-decision moment-primary"><button type="button" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{label}<small>{caption}</small></span><i aria-hidden="true">→</i></button>{binding.reason?<small className="reason">{binding.reason}</small>:null}</div>})}
 if(thread.focusScope==='history'&&target?.kind==='business')return choice('合上这份服务留页，回到今天','保留原对象与书签，不续约、不清旧账。',onToday,'回到今天')
 if(thread.command)return <CommandButton {...p} {...thread.command} className="moment-decision moment-primary" showReason={showReason} renderAction={(binding,main)=>children({binding,main,hint:thread.command?.kind==='ReadRelaySupplyDecision'?'拆开回信':thread.command?.kind==='CollectRelayDue'?'核对到期款':'核对这次决定'})}><b aria-hidden="true">01</b><span>{thread.command.label}<small>核对同一份原记录，再由你决定</small></span><i aria-hidden="true">→</i></CommandButton>
 if(thread.outcome==='non-success')return choice('看清停下之后，仍要面对什么','先核对已耗成本与旧承诺；原支持等待和原账仍可到达。',()=>onChoose('next'),'看看停下之后')
 if(thread.wait&&date)return <ClockAdvance p={p} date={date} label={waitLabel+' · '+date} room showReason={showReason} renderAction={binding=>children({binding,hint:'到下一处反馈',main:<div className="moment-wait moment-primary"><div className="clock-advance clock-advance-room">{binding.reviewNode}{binding.mainNode}</div></div>})}/>
 if(action.command)return <CommandButton {...p} {...action.command} label={action.label} className="moment-decision moment-primary" showReason={showReason} renderAction={(binding,main)=>children({binding,main,hint:'核对启用'})}><b aria-hidden="true">01</b><span>{action.label}<small>{action.caption}</small></span><i aria-hidden="true">→</i></CommandButton>
 const hints:Record<RelayChoiceIntent,string>={open:'核对投入',capital:'核对自有资本',basics:'安排技术学习',materials:'安排材料准备',application:'准备寄出申请',adapter:'安排线路适配',marketing:'选择客群',offer:'写下报价',customers:'选择客户约定','customer-funds':'核对本次充值','supplier-funds':'核对供应预付',service:'拟一期服务',audit:'核对已有计量',objects:'选回原对象',record:'翻阅这份记录',next:'看看下一步',more:'看看其他选择'}
 return choice(action.label,action.caption,()=>onChoose(action.intent),hints[action.intent])
}
