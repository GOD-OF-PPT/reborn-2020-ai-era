import type {VideoChoiceAction} from './VideoSceneChoice.tsx'
import {videoWorkCanReturnToday} from './video-work-stage.ts'
import './video-work-stage.css'
import {videoAccountAttemptReading} from './video-account-attempt.ts'
import {VideoFirstAttemptAction,type VideoFirstAttemptExtras} from './VideoFirstAttemptAction.tsx'
import {videoFirstAccount,videoFirstEntryCopy} from './video-first-entry.ts'
import {Fragment,useEffect,useRef,type ReactNode} from 'react'
import {videoInquiryChoiceReading,videoPublicationFeedbackReading} from './video-publication-feedback.ts'
import type {GamePanelProps} from './game-types.ts'
import type {PlayerThreadView} from './player-thread.ts'
import {CommandButton} from './CommandButton.tsx'
import {ClockAdvance} from './ClockAdvance.tsx'
import {makeSharedAction,type SharedActionBinding} from './shared-action.ts'

type Primary={binding:SharedActionBinding;main:ReactNode;firstAttempt?:VideoFirstAttemptExtras}
type Props={p:GamePanelProps;thread:PlayerThreadView;active:boolean;date:string|null;waitLabel:string;onChoose:(intent?:VideoChoiceAction)=>void;onResult:()=>void;onToday:()=>void;children:(primary:Primary|null)=>ReactNode}

/** The foreground object and thought share one original action and the same committed source. */
export function VideoThreadAction({p,thread,active,date,waitLabel,onChoose,onResult,onToday,children}:Props){
 const feedbackLive=useRef(true),feedbackScope=useRef<{key:string;owner:GamePanelProps['controller'];view:GamePanelProps['view'];session:string|undefined;choose:Props['onChoose'];result:Props['onResult'];today:Props['onToday']}|null>(null)
 const key=JSON.stringify([active,thread.focus,thread.stage,thread.outcome])
 if(!feedbackScope.current||feedbackScope.current.key!==key||feedbackScope.current.owner!==p.controller||feedbackScope.current.view!==p.view||feedbackScope.current.session!==p.controller.runtimeSession||feedbackScope.current.choose!==onChoose||feedbackScope.current.result!==onResult||feedbackScope.current.today!==onToday)feedbackScope.current={key,owner:p.controller,view:p.view,session:p.controller.runtimeSession,choose:onChoose,result:onResult,today:onToday}
 const source=feedbackScope.current
 useEffect(()=>{feedbackLive.current=true;return()=>{feedbackLive.current=false}},[])
 if(!active)return children(null)
 const showReason=!p.view.hasCandidate&&!p.view.readOnly&&p.view.saveStatus!=='conflict'
 const choice=(label:string,caption:string,activate:()=>void,more?:SharedActionBinding,other?:SharedActionBinding,canActivate?:()=>boolean)=>{
  const binding=makeSharedAction(p,label,activate,{allowReadOnly:true,...(canActivate?{canActivate}:{})})
  return children({binding,main:<div className="command moment-decision moment-primary" data-video-feedback={canActivate?true:undefined}><button type="button" disabled={binding.disabled} onClick={binding.activate}><b aria-hidden="true">01</b><span>{label}{caption?<small>{caption}</small>:null}</span><i aria-hidden="true">→</i></button>{binding.reason?<small className="reason">{binding.reason}</small>:null}{[more,other].map((more,index)=>more?<Fragment key={index}><button type="button" className="video-work-more" disabled={more.disabled} onClick={more.activate}>{more.label} ↗</button>{more.reason?<small className="reason">{more.reason}</small>:null}</Fragment>:null)}</div>})
 }
 if(thread.focusScope==='history')return choice('合上这份视频留页，回到今天','保留原作品、账号与书签，不重做交付',onToday)
 if(thread.command)return <CommandButton {...p} {...thread.command} confirm={thread.command.confirm} className="moment-decision moment-primary" showReason={showReason} renderAction={(binding,main)=>children({binding,main})}><b aria-hidden="true">01</b><span>{thread.command.label}<small>核对同一份作品与这次原决定</small></span><i aria-hidden="true">→</i></CommandButton>
 if(thread.wait&&date)return <ClockAdvance p={p} date={date} label={waitLabel+' · '+date} room showReason={showReason} renderAction={binding=>children({binding,main:<div className="moment-wait moment-primary"><div className="clock-advance clock-advance-room">{binding.reviewNode}{binding.mainNode}</div></div>})}/>
 const feedback=videoPublicationFeedbackReading(p,thread)
 if(feedback){
  const current=()=>feedbackLive.current&&feedbackScope.current===source
  const bind=(label:string,activate:()=>void)=>makeSharedAction(p,label,activate,{allowReadOnly:true,canActivate:current})
  const more=bind('看看这个账号的其他选择',onResult)
  return feedback.canReply?choice('挑一位询价者，聊聊委托','账号现有'+feedback.currentLeads+'名可回应；先选客户，再核对这单投入。',()=>onChoose('commission'),bind('先回到今天',onToday),more,current):choice('合上这份作品，回到今天','',onToday,more,undefined,current)
 }
 const inquiry=videoInquiryChoiceReading(p,thread)
 if(inquiry){const current=()=>feedbackLive.current&&feedbackScope.current===source;return choice('继续核对委托安排','先选询价者，再核对制作和投入。',()=>onChoose('commission'),makeSharedAction(p,'先回到今天',onToday,{allowReadOnly:true,canActivate:current}),makeSharedAction(p,'看看这个账号的其他选择',onResult,{allowReadOnly:true,canActivate:current}),current)}
 if(videoWorkCanReturnToday(p,thread))return choice('合上这份作品，回到今天','作品与实际反馈保留；下一次投入仍由你决定',onToday,makeSharedAction(p,'继续这个账号，看看下一次选择',onResult,{allowReadOnly:true}))
 if(thread.outcome==='actual'||thread.outcome==='non-success')return choice('这一份之后，想怎样继续','继续这个账号、收好原结果，或回自己的生活',onResult)
 const firstAttempt=videoAccountAttemptReading(p,thread)
 if(firstAttempt&&thread.focus.kind==='video')return <VideoFirstAttemptAction p={p} focus={thread.focus} reading={firstAttempt} onChoose={onChoose}>{children}</VideoFirstAttemptAction>
 if(thread.stage==='video-entry'&&p.view.phase==='playing'&&videoFirstAccount(p.features.video))return choice(videoFirstEntryCopy.action,'',onChoose)
 return choice(thread.stage==='video-entry'?'为谁做一份视频，先选一个账号':thread.stage==='video-revision'?'回应客户的这次修改':thread.stage==='video-quality'?'核对这一版的素材问题':thread.stage==='video-ready-to-publish'?'选择这份作品的发布方式':'给这个账号，选一次具体尝试','先明确这次对象与取舍，真正投入仍需原确认',onChoose)
}
