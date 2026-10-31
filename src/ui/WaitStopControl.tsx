import {useEffect,useState} from 'react'
import './wait-stop-control.css'

/** Once visible, this position keeps its stop meaning until this life's header unmounts. */
export function WaitStopControl({active,onStop,stopping=false,interrupted=false}:{active:boolean;onStop:()=>void;stopping?:boolean;interrupted?:boolean}){
 const [shown,setShown]=useState(active)
 useEffect(()=>{if(active)setShown(true)},[active])
 if(!active&&!shown)return null
 return <span className="scene-wait-control"><button key="wait-stop" type="button" className="scene-text-action" disabled={!active||stopping} aria-label={active?stopping?'本次记录完成后停下':'先停下等候':interrupted?'本段等候已经中断':'本段等候已经停止'} onClick={()=>{if(active&&!stopping)onStop()}}>{active?stopping?'记录完成后停下':'先停下等候':interrupted?'等候中断':'等候已停'}</button></span>
}
