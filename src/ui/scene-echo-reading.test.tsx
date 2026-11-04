import {afterEach,expect,it,vi} from 'vitest'
import {isValidElement,type ReactElement} from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import {createCampaignRegistry,createCampaignRun} from '../application/campaign.ts'
import {evaluateCommand,projectRun} from '../core/commands.ts'
import type {GameRun} from '../core/run-types.ts'
import type {PlayingView} from './game-types.ts'
import {SceneEcho,SceneTimeNotice,committedEcho,type EchoFrame} from './SceneEcho.tsx'
import {Dialog} from './Dialog.tsx'
import {savedSceneResult} from './scene-result.ts'

// Pure UI from normal in-memory proposals. No persistence or import/export.
const hooks=vi.hoisted(()=>({enabled:false,values:[] as unknown[],index:0}))
vi.mock('react',async original=>{const actual=await original<typeof import('react')>();return {...actual,useState:<T,>(initial:T|(()=>T))=>{if(!hooks.enabled)return actual.useState(initial);const index=hooks.index++;if(!(index in hooks.values))hooks.values[index]=typeof initial==='function'?(initial as ()=>T)():initial;return [hooks.values[index] as T,(value:T)=>{hooks.values[index]=value}] as const}}})
afterEach(()=>{hooks.enabled=false;hooks.values=[];hooks.index=0})
const registry=createCampaignRegistry(),initial=createCampaignRun({runId:'echo-reader-ui',actorId:'player',commandId:'create',seed:'echo-reader-ui',backgroundId:'technical_employee',playerProfile:{wishId:'autonomy',approach:'free'}})
function act(run:GameRun,kind:string,payload:unknown={}){const result=evaluateCommand(run,{runId:run.runId,actorId:run.actorId,commandId:'echo-'+(run.revision+1),expectedRevision:run.revision,kind,payload},registry,run.actorId);if(result.status!=='proposed')throw Error('NORMAL_PROPOSAL_REQUIRED');return result.nextRun}
const view=(run:GameRun):PlayingView=>({...projectRun(run),features:registry.runtime!.project!(run),saveStatus:'saved',busy:false,readOnly:false,readOnlyReason:null,hasCandidate:false,pendingRevision:null})
function paid(){const run=act(initial,'ResearchMarket',{definitionId:'market-foundation-course'}),before=view(initial),after=view(run);return {text:savedSceneResult('ResearchMarket','规则研习',before,after),frame:committedEcho(before,after)!,onClose:vi.fn(),accountName:vi.fn(()=> '个人账户')}}
type Element=ReactElement<Record<string,unknown>>
function nodes(value:unknown):Element[]{if(Array.isArray(value))return value.flatMap(nodes);return isValidElement<Record<string,unknown>>(value)?[value,...nodes(value.props.children),...nodes(value.props.footer)]:[]}
const text=(value:unknown):string=>typeof value==='string'||typeof value==='number'?String(value):Array.isArray(value)?value.map(text).join(''):isValidElement<Record<string,unknown>>(value)?text(value.props.children):''

it('reads a real paid research in one page with the complete original text and all five facts',()=>{
 const p=paid(),before=JSON.stringify(p.frame),tree=SceneEcho(p),rows=nodes(tree)
 expect(tree.type).toBe(Dialog);expect(tree.props.layout).toBe('direct')
 expect(rows.find(row=>row.props.className==='echo-result')?.props.children).toBe(p.text)
 expect(rows.filter(row=>row.type==='dt').map(row=>text(row.props.children))).toEqual(['日历翻到','可用行动','预留行动','已用行动','个人账户 · 可花'])
 expect(rows.filter(row=>row.type==='dd').map(row=>text(row.props.children))).toEqual(['2020-01-01','4 → 3 点','0 点 · 未变','0 → 1 点','¥26,000 → ¥23,000'])
 expect(p.accountName).toHaveBeenCalledExactlyOnceWith('personal');expect(JSON.stringify(p.frame)).toBe(before)
 const html=renderToStaticMarkup(tree);expect(html).not.toContain('screen-book');expect(html).not.toContain('这一步，已经记下')
})

it('keeps planned reservations distinct from actual consumed action and money',()=>{
 const run=act(initial,'StartFirstOrder'),before=view(initial),after=view(run),p={text:savedSceneResult('StartFirstOrder','原小单',before,after),frame:committedEcho(before,after),onClose:vi.fn(),accountName:()=> '个人账户'},tree=SceneEcho(p),html=renderToStaticMarkup(tree)
 expect(tree.props.layout).toBe('direct');expect(html).toContain('预留行动');expect(html).toContain('0 → 1 点');expect(html).toContain('0 点 · 未变')
 expect(html).toContain('尚未开工的预留还没有算作已用行动');expect(html).toContain('本次预留制作费¥500和1点')
 expect(p.onClose).not.toHaveBeenCalled()
})

it('keeps quarter labels and a new account value without claiming an extra gain',()=>{
 const p=paid(),frame:EchoFrame={...p.frame,dateBefore:'2020-03-31',dateAfter:'2020-04-01',quarterChanged:true,pointsBefore:0,pointsAfter:4,reservedBefore:0,reservedAfter:0,spentBefore:4,spentAfter:0,accounts:[{id:'ui-new-account',before:null,after:10000}]}
 // A reading-layout example, not a fabricated gameplay quarter or transfer.
 const tree=SceneEcho({...p,frame,text:'原季度回响',accountName:()=> '经营账户'}),html=renderToStaticMarkup(tree)
 expect(text(nodes(tree).find(row=>row.props.className==='echo-date-value')?.props.children)).toBe('2020-03-31 → 2020-04-01')
 for(const value of ['新季度可用行动','新季度预留行动','新季度已用行动','新账户 → ¥100','未完成的约定仍留在日历里'])expect(html).toContain(value)
})

it('retains every account and the entire narrative in the original book for complex results',()=>{
 const p=paid(),long='第一项原约定仍待处理，完整金额与期限都要保留。'.repeat(15),frame={...p.frame,accounts:[...p.frame.accounts,{id:'business',before:120000,after:123456}]},tree=SceneEcho({...p,text:long,frame,accountName:id=>id==='personal'?'个人账户':'原企业账户'}),rows=nodes(tree)
 expect(tree.props.layout).toBe('book');expect(rows.find(row=>row.props.className==='echo-result')?.props.children).toBe(long)
 expect(rows.filter(row=>row.type==='dt').map(row=>text(row.props.children))).toContain('原企业账户 · 可花')
 expect(rows.filter(row=>row.type==='dd').map(row=>text(row.props.children))).toContain('¥1,200 → ¥1,234.56')
 expect(rows.filter(row=>row.type==='dd').map(row=>text(row.props.children))).toContain('¥26,000 → ¥23,000')
})

it('keeps absent frames, long labels and multiline original content readable without invented facts',()=>{
 const p=paid(),plain=SceneEcho({...p,frame:null,text:'原款¥88仍待核对。'});expect(plain.props.layout).toBe('book');expect(nodes(plain).some(row=>row.type==='dl')).toBe(false)
 expect(SceneEcho({...p,accountName:()=> '原账户的完整名称必须保留'.repeat(4)}).props.layout).toBe('book')
 const multiline='第一项\n第二项\n第三项\n第四项\n第五项'
 const tree=SceneEcho({...p,text:multiline});expect(tree.props.layout).toBe('book');expect(nodes(tree).find(row=>row.props.className==='echo-result')?.props.children).toBe(multiline)
})

it('renders supplied narrative and account names as text while retaining dates and amounts',()=>{
 const p=paid(),html=renderToStaticMarkup(<SceneEcho {...p} text={'原应付¥1,234.56仍保留；2020-01-08前处理。<img src=x onerror="danger()">'} accountName={()=>'<b>原账户</b>'}/>)
 expect(html).toContain('¥1,234.56');expect(html).toContain('2020-01-08');expect(html).toContain('&lt;img');expect(html).toContain('&lt;b&gt;原账户&lt;/b&gt;');expect(html).not.toContain('<img')
})

it('keeps the same close callback on the dialog and return button',()=>{
 const p=paid(),tree=SceneEcho(p),button=nodes(tree.props.footer).find(row=>row.type==='button')!
 expect(tree.props.onClose).toBe(p.onClose);expect(button.props.onClick).toBe(p.onClose)
 ;(button.props.onClick as ()=>void)();expect(p.onClose).toHaveBeenCalledOnce()
})

it('closes only the full reader before the outer scene echo is explicitly dismissed',()=>{
 hooks.enabled=true;const p=paid(),onClose=vi.fn(),props={...p,date:'2020-01-01',compact:true,brief:'短回响',onClose}
 const render=()=>{hooks.index=0;return nodes(SceneTimeNotice(props))}
 const inspect=render().find(row=>row.props['data-interaction']==='inspect')!;(inspect.props.onClick as ()=>void)()
 const full=render().find(row=>row.type===SceneEcho)!;expect(full.props.text).toBe(p.text);expect(full.props.frame).toBe(p.frame)
 ;(full.props.onClose as ()=>void)();expect(render().some(row=>row.type===SceneEcho)).toBe(false);expect(onClose).not.toHaveBeenCalled()
 const dismiss=render().find(row=>row.props['aria-label']==='收起这次时间回响')!;(dismiss.props.onClick as ()=>void)();expect(onClose).toHaveBeenCalledOnce()
})
