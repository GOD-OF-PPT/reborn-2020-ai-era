import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './ui/App.tsx'
import './ui/styles.css'
import './ui/art-direction.css'
import './ui/cinematic.css'
import './ui/film-gameplay.css'
import './ui/single-screen.css'
import './ui/scene-play.css'
import './ui/journey.css'
import './ui/scene-decisions.css'
import './ui/game-clarity.css'
import './ui/scene-encounters.css'
import './ui/opening-play.css'
import './ui/night-journal.css'

const root = document.getElementById('root')
if (!root) throw new Error('Application root is missing')

const app=createRoot(root)
app.render(<StrictMode><App/></StrictMode>)
void import('./application/browser-game.ts').then(async({createBrowserGame})=>{
 const {controller,diagnostics}=await createBrowserGame()
 app.render(<StrictMode><App controller={controller} diagnostics={diagnostics}/></StrictMode>)
 await controller.initialize().catch(()=>{})
}).catch(()=>app.render(<StrictMode><App startupError="本机存档暂不可用，尚未创建或修改人生。请检查浏览器存储权限后刷新重试。"/></StrictMode>))
