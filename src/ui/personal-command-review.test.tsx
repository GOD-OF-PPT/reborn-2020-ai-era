import {afterEach,expect,it,vi} from 'vitest'
import {Children,Fragment,isValidElement,type ReactElement,type ReactNode,type ComponentProps} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {previewCommand,projectRun} from '../core/commands.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import type {PlayFeatures,PlayingView} from './game-types.ts'
import {captureLifeDecision,LifeDecisionFacts} from './LifeDecisionFacts.tsx'
import {captureWorkDecision,WorkDecisionFacts} from './WorkDecisionFacts.tsx'
import {CommandDetails} from './CommandDetails.tsx'
import {Dialog} from './Dialog.tsx'
import {PersonalCommandReview,isPersonalDecisionFacts,expandedPersonalDetails} from './PersonalCommandReview.tsx'

// Captured normal public UI facts and local reader callbacks only; no persistence APIs.
const hooks=vi.hoisted(()=>({values:[] as unknown[],index:0}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();return {...actual,useState:<T,>(initial:T|(()=>T))=>{const index=hooks.index++;if(!(index in hooks.values))hooks.values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[index] as T,(value:T)=>{hooks.values[index]=value}] as const}}})
afterEach(()=>{hooks.values=[];hooks.index=0})
const registry=createCampaignRegistry(),run=createCampaignRun({runId:'personal-review-ui',actorId:'player',commandId:'create',seed:'personal-review-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}}),projected=registry.runtime!.project!(run),features=projected as unknown as PlayFeatures
const view:PlayingView={...projectRun(run),features:projected,saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null}
function captured(kind:'WorkQuarter'|'StartLifeWork'='StartLifeWork',life:'rest'|'workspace'='rest'){
 const command:CommandEnvelope={runId:run.runId,actorId:run.actorId,commandId:'original-decision',expectedRevision:run.revision,kind,payload:kind==='WorkQuarter'?{}:{kind:life,personId:null,reference:null}},confirm=previewCommand(run,command,registry,run.actorId)
 const value=kind==='WorkQuarter'?captureWorkDecision(command,confirm,view,features)!:captureLifeDecision(command,confirm,view,features)!
 const facts=kind==='WorkQuarter'?<WorkDecisionFacts value={value as ReturnType<typeof captureWorkDecision>&{}}/>:<LifeDecisionFacts value={value as ReturnType<typeof captureLifeDecision>&{}}/>
 const originalProps={command,confirm,view,features,accountName:()=> '个人账户',clock:null}
 const details=<><CommandDetails {...originalProps}/><p>原附加说明仍保留。</p></>
 return {facts,details,originalProps}
}
function nodes(value:ReactNode):ReactElement<Record<string,unknown>>[]{return Children.toArray(value).flatMap(child=>isValidElement<Record<string,unknown>>(child)?[child,...nodes(child.props.children as ReactNode)]:[])}
const words=(value:unknown):string=>typeof value==='string'?value:Array.isArray(value)?value.map(words).join(''):isValidElement<Record<string,unknown>>(value)?words(value.props.children):''
function driver(){
 const original=captured(),confirm=vi.fn(),close=vi.fn(),actions=<div className="dialog-actions"><button type="button" onClick={close}>返回调整</button><button type="button" onClick={confirm}>开始休整 →</button></div>,status=<p role="status">原当前状态</p>
 const props:ComponentProps<typeof PersonalCommandReview>={title:'原决定',...original,status,actions,onClose:close}
 const render=()=>{hooks.index=0;return nodes(PersonalCommandReview(props))}
 const open=()=>{const button=render().find(node=>node.type==='button'&&words(node.props.children)==='翻阅这次决定的完整说明 ↗')!;(button.props.onClick as ()=>void)()}
 return {props,render,open,confirm,close,original}
}

it('routes only the existing captured personal fact components',()=>{
 expect(isPersonalDecisionFacts(captured().facts)).toBe(true)
 expect(isPersonalDecisionFacts(captured('WorkQuarter').facts)).toBe(true)
 for(const node of [null,'个人费用',<section className="life-decision-facts">自己承担</section>,<Fragment><LifeDecisionFacts value={captureLifeDecision(captured().originalProps.command,captured().originalProps.confirm,view,features)!}/></Fragment>])expect(isPersonalDecisionFacts(node)).toBe(false)
})

it('shows the short facts directly and retains the original footer and cancellation callback',()=>{
 const ui=driver(),dialogs=ui.render().filter(node=>node.type===Dialog)
 expect(dialogs).toHaveLength(1)
 expect(dialogs[0]!.props.layout).toBe('direct')
 expect(dialogs[0]!.props.footer).toBe(ui.props.actions)
 expect(dialogs[0]!.props.onClose).toBe(ui.close)
 expect(nodes(dialogs[0]!.props.children as ReactNode).some(node=>node.type===LifeDecisionFacts)).toBe(true)
 expect(nodes(dialogs[0]!.props.children as ReactNode).some(node=>node.type===CommandDetails)).toBe(false)
 expect(ui.confirm).not.toHaveBeenCalled()
})

it('opens and closes complete reading without confirming or closing the original decision',()=>{
 const ui=driver();ui.open();let dialogs=ui.render().filter(node=>node.type===Dialog)
 expect(dialogs).toHaveLength(2)
 const reader=dialogs[1]!;expect(reader.props.title).toBe('原决定 · 完整说明')
 const back=nodes(reader.props.footer as ReactNode).find(node=>node.type==='button')!
 expect(words(back.props.children)).toBe('回到这次决定')
 ;(back.props.onClick as ()=>void)();dialogs=ui.render().filter(node=>node.type===Dialog)
 expect(dialogs).toHaveLength(1);expect(dialogs[0]!.props.footer).toBe(ui.props.actions)
 expect(ui.confirm).not.toHaveBeenCalled();expect(ui.close).not.toHaveBeenCalled()
})

it.each(['WorkQuarter','StartLifeWork'] as const)('opens complete %s text while keeping every original captured input reference',kind=>{
 const c=captured(kind),expanded=expandedPersonalDetails(c.details),commandNode=nodes(expanded).find(node=>node.type===CommandDetails)!
 for(const key of ['command','confirm','view','features','accountName','clock'] as const)expect(commandNode.props[key]).toBe(c.originalProps[key])
 expect(commandNode.props.personalExpanded).toBe(true)
 const before=renderToStaticMarkup(c.details),after=renderToStaticMarkup(expanded)
 expect(after).toContain('open=""')
 expect(after.replaceAll(' open=""','')).toBe(before)
 expect(after).toContain('原附加说明仍保留')
})

it('keeps unfamiliar detail nodes intact instead of traversing their implementation',()=>{
 const node=<aside data-original="yes"><p>原独立说明</p></aside>
 expect(expandedPersonalDetails(node)).toBe(node)
 expect(expandedPersonalDetails('原文本')).toBe('原文本')
})

it('keeps the original unavailable footer and current reason visible in both reading layers',()=>{
 const ui=driver(),actions=<div className="dialog-actions"><button disabled>原操作不可用</button></div>,status=<p role="alert">原资格尚未满足。</p>
 ui.props.actions=actions;ui.props.status=status;ui.open()
 const dialogs=ui.render().filter(node=>node.type===Dialog)
 expect(dialogs[0]!.props.footer).toBe(actions)
 for(const dialog of dialogs)expect(nodes(dialog.props.children as ReactNode).some(node=>node.props.role==='alert'&&words(node.props.children)==='原资格尚未满足。')).toBe(true)
 expect(ui.confirm).not.toHaveBeenCalled()
})
