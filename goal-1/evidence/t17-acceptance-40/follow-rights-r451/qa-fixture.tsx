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
const codec=fixture.codec,store=new IndexedDbRunStore({codec,name:'u6-rights-fixture-native-v1'}),controller=new GameController({codec,store,locks:new WebWriterAccess()})
function Host(){
 const state=useSyncExternalStore(controller.subscribe,()=>controller.snapshot),[intent,setIntent]=useState('follow'),[open,setOpen]=useState(false),[book,setBook]=useState(false),[request,setRequest]=useState<string|null>(null),memory=useMemo(()=>createEquityDraftMemory(),[])
 if(!state.view)return <App controller={controller}/>
 const view=state.view,features=view.features as any,a=features.deepseek.agreements[0],target={runId:view.runId,accountId:a.accountId,businessId:a.businessId,kind:'agreement' as const,recordId:a.id},p={controller,view,features,accountId:a.accountId,equityDraftMemory:memory,request:(kind:string,payload:unknown,label:string,confirm?:boolean)=>{setRequest(JSON.stringify({kind,payload,label,confirm,preview:controller.preview(controller.prepare(kind,payload))}));setOpen(false)}}
 return <div className="game-app cinema-app cinema-playing film-play"><ChapterBackdrop screen="deepseek" workspaceCompleted={false}/><main><p>隔离规则夹具 · 真实组件交互核对 · 非正常人生验收</p><p>{view.date} · 已保存 {view.revision}</p><button onClick={()=>{setOpen(true);setRequest(null)}}>核对这轮融资</button><button onClick={()=>setBook(true)}>翻开原书</button>{request?<output aria-label="夹具宿主捕获的原确认请求">原确认请求，仅捕获未执行：{request}</output>:null}{open?<EquitySceneChoice p={p} target={target} intent={intent as any} onClose={()=>setOpen(false)} onChoose={()=>{}} onIntent={setIntent as any} onInspect={()=>{setOpen(false);setBook(true)}} onToday={()=>setOpen(false)}/>:null}{book?<Dialog title="完整持股手记" onClose={()=>setBook(false)}><EquityPanel {...p} assignment={{resources:[],startAt:''}} initialTarget={target}/></Dialog>:null}</main></div>
}
createRoot(document.getElementById('root')!).render(<StrictMode><Host/></StrictMode>)
await controller.initialize()
