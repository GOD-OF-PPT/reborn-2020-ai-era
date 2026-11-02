import {StrictMode,useState,useSyncExternalStore,useMemo} from 'react'
import {createRoot} from 'react-dom/client'
import App from '/src/ui/App.tsx'
import {GameController} from '/src/application/game-controller.ts'
import {IndexedDbRunStore} from '/src/persistence/indexeddb.ts'
import {WebWriterAccess} from '/src/persistence/writer-lock.ts'
import {createDeepseekFixture} from '/src/testing/deepseek-fixture.ts'
import {campaignMarket} from '/src/application/campaign.ts'
import {projectDeepseek} from '/src/core/deepseek-projection.ts'
import {projectWorkbench} from '/src/application/workbench-projection.ts'
import {projectSceneCommands} from '/src/application/scene-commands.ts'
import {RoomTableau} from '/src/ui/RoomTableau.tsx'
import {EquityPaper} from '/src/ui/EquityPaper.tsx'
import {equityJourneyFor,equityFocusFor} from '/src/ui/equity-player-thread.ts'
import {equityStageCopy} from '/src/ui/equity-stage-copy.ts'
import {EquitySceneChoice} from '/src/ui/EquitySceneChoice.tsx'
import EquityPanel from '/src/ui/EquityPanel.tsx'
import {createEquityDraftMemory} from '/src/ui/equity-draft.ts'
import {Dialog} from '/src/ui/Dialog.tsx'
import {ChapterBackdrop} from '/src/ui/ChapterBackdrop.tsx'
import '/src/ui/styles.css'
import '/src/ui/art-direction.css'
import '/src/ui/cinematic.css'
import '/src/ui/film-gameplay.css'
import '/src/ui/single-screen.css'
import '/src/ui/scene-play.css'
import '/src/ui/journey.css'
import '/src/ui/scene-decisions.css'
import '/src/ui/game-clarity.css'
import '/src/ui/scene-encounters.css'
import '/src/ui/opening-play.css'
import '/src/ui/night-journal.css'
import '/src/ui/runtime-feedback.css'
// Explicit fixture-only component host. Original App owns entry/import only.
// Original projectors read fixture state. No normal life/story data is fabricated.
const fixture=createDeepseekFixture()
Object.assign(fixture.runtime,{project:(run:typeof fixture.run)=>({sceneCommands:projectSceneCommands(run),deepseek:projectDeepseek(run,fixture.deepseek),workbench:projectWorkbench(run,fixture.runtime,fixture.operations.catalog,campaignMarket.catalog)})})
const codec=fixture.codec,store=new IndexedDbRunStore({codec,name:'u6-follow-stage-fixture-native-v1'}),controller=new GameController({codec,store,locks:new WebWriterAccess()})
function Host(){
 const state=useSyncExternalStore(controller.subscribe,()=>controller.snapshot),[intent,setIntent]=useState('follow'),[open,setOpen]=useState(false),[book,setBook]=useState(false),[request,setRequest]=useState<string|null>(null),memory=useMemo(()=>createEquityDraftMemory(),[])
 if(!state.view)return <App controller={controller}/>
 const view=state.view,features=view.features as any,a=features.deepseek.agreements[0],target={runId:view.runId,accountId:a.accountId,businessId:a.businessId,kind:'agreement' as const,recordId:a.id},p={controller,view,features,accountId:a.accountId,equityDraftMemory:memory,request:(kind:string,payload:unknown,label:string,confirm?:boolean)=>{setRequest(JSON.stringify({kind,payload,label,confirm,preview:controller.preview(controller.prepare(kind,payload))}));setOpen(false)}}
 const journey=equityJourneyFor(p,equityFocusFor(p,target)),copy=equityStageCopy(p,journey),binding={label:copy.action,disabled:false,reason:null,activate:()=>{setIntent('follow');setOpen(true);setRequest(null)}}
 return <div className="game-app cinema-app cinema-playing film-play"><ChapterBackdrop screen="deepseek" workspaceCompleted={false}/><header className="site-header"><strong>隔离规则夹具 · 限定整幕组件核对</strong><span>{view.date} · 已保存 {view.revision}</span></header><main id="main-content"><div className="ecosystem-stage equity-stage opening-room"><RoomTableau scene="equity" state={journey.phase} perspective="current" intention={<span>明确架空 · 非正常人生完整验收</span>} heading={<div className="moment-heading"><p className="moment-overline">本轮原融资</p><h1>{copy.heading}</h1></div>} context={<><p className="moment-stage-label">今天 {view.date}</p><p>{copy.line}</p></>} facts={<>{copy.facts.map(line=><p key={line}>{line}</p>)}</>} decisions={<><button className="moment-decision moment-primary" onClick={binding.activate}><b>01</b><span>{copy.action}</span><i>→</i></button><button className="moment-decision" onClick={()=>setRequest('已显选回今天；此宿主不替代完整App的Today生活。')}><b>02</b><span>先过自己的日子</span><i>↗</i></button></>} object={<EquityPaper p={p} journey={journey} binding={binding}/>} record={<button className="scene-text-action" onClick={()=>setBook(true)}>翻开原书</button>}/>{request?<output aria-label="夹具宿主捕获的原确认请求">原请求，仅捕获未执行：{request}</output>:null}{open?<EquitySceneChoice p={p} target={target} intent={intent as any} onClose={()=>setOpen(false)} onChoose={()=>{}} onIntent={setIntent as any} onInspect={()=>{setOpen(false);setBook(true)}} onToday={()=>{setOpen(false);setRequest('已显选回今天；此宿主不替代完整App的Today生活。')}}/>:null}{book?<Dialog title="完整持股手记" onClose={()=>setBook(false)}><EquityPanel {...p} assignment={{resources:[],startAt:''}} initialTarget={target}/></Dialog>:null}</div></main></div>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Host/></StrictMode>)
await controller.initialize()
