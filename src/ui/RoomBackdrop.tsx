import {useState} from 'react'
import ordinaryRoom from '../../assets/ui-redesign/cinematic/room-ordinary-v1.jpg'
import improvedRoom from '../../assets/ui-redesign/cinematic/room-improved-v1.jpg'

/** Only committed completion chooses the asset; image load/failure never changes the run. */
export function RoomBackdrop({improved=false}:{improved?:boolean}){
 const desired=improved?improvedRoom:ordinaryRoom,[failed,setFailed]=useState<string|null>(null),[loaded,setLoaded]=useState<string|null>(null),source=failed===desired?ordinaryRoom:desired
 // Isolated native image-error check. Production ignores this parameter.
 const testFailure=import.meta.env.DEV&&typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('sceneTest')==='missing-image',requested=testFailure&&failed!==desired?'/assets/ui-redesign/t15-unavailable-room.png':source
 return <><div className="room-backdrop" aria-hidden="true" style={{backgroundImage:`url(${ordinaryRoom})`}}><img src={requested} alt="" className={loaded===source?'room-image-ready':''} onLoad={()=>setLoaded(source)} onError={()=>setFailed(desired)}/></div>{failed===desired?<p className="scene-image-notice" role="status">场景图片暂未载入，实际工作与完成记录仍保留。</p>:null}</>
}
