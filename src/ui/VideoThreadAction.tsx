import {videoFirstAccount,videoFirstEntryCopy} from './video-first-entry.ts'
import type {ReactNode} from 'react'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'

type Primary={binding:SharedActionBinding;main:ReactNode}
type Props={p:GamePanelProps;thread:PlayerThreadView;active:boolean;date:string|null;waitLabel:string;onChoose:()=>void;onResult:()=>void;onToday:()=>void;children:(primary:Primary|null)=>ReactNode}

/** The foreground object and thought share one original action and the same committed source. */
export function VideoThreadAction({p,thread,active,date,waitLabel,onChoose,onResult,onToday,children}:Props){
 if(!active)return children(null)
 const showReason=!p.view.hasCandidate&&!p.view.readOnly&&p.view.saveStatus!=='conflict'
 const choice=(label:string,caption:string,activate:()=>void)=>{
  const binding=makeSharedAction(p,label,activate,{allowReadOnly:true})
  return children({binding,main:<div className="command moment-decision moment-primary"><button type="button" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{label}{caption?<small>{caption}</small>:null}</span><i aria-hidden="true">→</i></button>{binding.reason?<small className="reason">{binding.reason}</small>:null}</div>})
 }
 if(thread.focusScope==='history')return choice('合上这份视频留页，回到今天','保留原作品、账号与书签，不重做交付',onToday)
 if(thread.command)return <CommandButton {...p} {...thread.command} confirm={thread.command.confirm} className="moment-decision moment-primary" showReason={showReason} renderAction={(binding,main)=>children({binding,main})}><b aria-hidden="true">01</b><span>{thread.command.label}<small>核对同一份作品与这次原决定</small></span><i aria-hidden="true">→</i></CommandButton>
 if(thread.wait&&date)return <ClockAdvance p={p} date={date} label={waitLabel+' · '+date} room showReason={showReason} renderAction={binding=>children({binding,main:<div className="moment-wait moment-primary"><div className="clock-advance clock-advance-room">{binding.reviewNode}{binding.mainNode}</div></div>})}/>
 if(thread.outcome==='actual'||thread.outcome==='non-success')return choice('这一份之后，想怎样继续','继续这个账号、收好原结果，或回自己的生活',onResult)
 if(thread.stage==='video-entry'&&p.view.phase==='playing'&&videoFirstAccount(p.features.video))return choice(videoFirstEntryCopy.action,'',onChoose)
 return choice(thread.stage==='video-entry'?'为谁做一份视频，先选一个账号':thread.stage==='video-revision'?'回应客户的这次修改':thread.stage==='video-quality'?'核对这一版的素材问题':thread.stage==='video-ready-to-publish'?'选择这份作品的发布方式':'给这个账号，选一次具体尝试','先明确这次对象与取舍，真正投入仍需原确认',onChoose)
}
