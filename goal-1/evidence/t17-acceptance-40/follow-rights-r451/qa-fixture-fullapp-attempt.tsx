import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import App from '/src/ui/App.tsx'
import {GameController} from '/src/application/game-controller.ts'
import {IndexedDbRunStore} from '/src/persistence/indexeddb.ts'
import {WebWriterAccess} from '/src/persistence/writer-lock.ts'
import {createCampaignCodec,campaignMarket} from '/src/application/campaign.ts'
import {projectDeepseek} from '/src/core/deepseek-projection.ts'
import {projectWorkbench} from '/src/application/workbench-projection.ts'
import {createDeepseekFixture} from '/src/testing/deepseek-fixture.ts'
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
// QA-only explicit fixture codec. No state injection: import uses original App UI.
const fixture=createDeepseekFixture(),fullProject=createCampaignCodec().registry.runtime!.project!
Object.assign(fixture.runtime,{project:(run:Parameters<typeof fullProject>[0])=>({...fullProject(run),deepseek:projectDeepseek(run,fixture.deepseek),workbench:projectWorkbench(run,fixture.runtime,fixture.operations.catalog,campaignMarket.catalog)})})
const codec=fixture.codec,store=new IndexedDbRunStore({codec,name:'u6-rights-fixture-native-v1'}),controller=new GameController({codec,store,locks:new WebWriterAccess()})
createRoot(document.getElementById('root')!).render(<StrictMode><App controller={controller}/></StrictMode>)
await controller.initialize()
