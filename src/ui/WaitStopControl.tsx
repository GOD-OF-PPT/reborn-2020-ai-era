import {useEffect,useState} from 'react'
import './wait-stop-control.css'

/** Once visible, this position keeps its stop meaning until this life's header unmounts. */
export function WaitStopControl({active,onStop}:{active:boolean;onStop:()=>void}){
 const [shown,setShown]=useState(active)
 useEffect(()=>{if(active)setShown(true)},[active])
 if(!active&&!shown)return null
 return <span className="scene-wait-control"><button key="wait-stop" type="button" className="scene-text-action" disabled={!active} aria-label={active?'先停下等候':'本段等候已经停止'} onClick={()=>{if(active)onStop()}}>{active?'先停下等候':'等候已停'}</button></span>
}
