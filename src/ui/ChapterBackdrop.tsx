import {useState} from 'react'
import type {Screen} from './Navigation.tsx'
import opportunities from '../../assets/ui-redesign/cinematic/opportunities-v1.jpg'
import memory from '../../assets/ui-redesign/cinematic/memory-v1.jpg'
import ledger from '../../assets/ui-redesign/cinematic/ledger-v1.jpg'
import room from '../../assets/ui-redesign/cinematic/room-ordinary-v1.jpg'
import improved from '../../assets/ui-redesign/cinematic/room-improved-v1.jpg'
import {sceneArt} from './scene-art.ts'

/** A decorative layer only; all numbers and revealed facts remain in the public projection. */
export function ChapterBackdrop({screen,workspaceCompleted}:{screen:Screen;workspaceCompleted:boolean}){
 const source=screen==='finance'?ledger:screen==='memory'||screen==='story'?memory:screen==='room'||screen==='life'||screen==='quarter'||screen==='routines'?(workspaceCompleted?improved:room):screen==='market'?sceneArt.market:screen==='video'?sceneArt.video:screen==='course'?sceneArt.course:screen==='relay'?sceneArt.relay:screen==='deepseek'?sceneArt.deepseek:opportunities
 const [failed,setFailed]=useState<string|null>(null)
 return <div className="cinematic-background" aria-hidden="true">{failed!==source?<img src={source} alt="" width={1672} height={941} onError={()=>setFailed(source)}/>:null}</div>
}
