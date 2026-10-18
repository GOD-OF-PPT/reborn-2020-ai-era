import {useState} from 'react'
import type {LifePerson} from '../core/life-schema.ts'
import tangYing from '../../assets/ui-redesign/portraits/tang-ying-cinematic-v1.jpg'
import linzhou from '../../assets/ui-redesign/portraits/linzhou-cinematic-v1.jpg'
import xuCheng from '../../assets/ui-redesign/portraits/xu-cheng-cinematic-v1.jpg'
import chenYu from '../../assets/ui-redesign/portraits/chen-yu-cinematic-v1.jpg'

const portraits:Record<LifePerson,string>={'tang-ying':tangYing,linzhou,'xu-cheng':xuCheng,'chen-yu':chenYu}

/** Illustration follows the public contact state; it never creates a relationship. */
export function PersonPortrait({personId,name,revealed,textOnly=false,feature=false}:{personId:LifePerson;name:string;revealed:boolean;textOnly?:boolean;feature?:boolean}){
 const source=portraits[personId],[failed,setFailed]=useState<string|null>(null)
 const missing=import.meta.env.DEV&&typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('portraitTest')==='missing-image'
 const show=revealed&&!textOnly&&failed!==source
 return <span className={'person-portrait portrait-'+personId+(feature?' portrait-feature':'')+(show?'':' portrait-without-image')}>
  {show?<img src={missing?'/assets/d03-unavailable-portrait.jpg':source} alt="" width={1122} height={1402} loading={feature?'eager':'lazy'} decoding="async" onError={()=>setFailed(source)}/>:<span className="portrait-initial" aria-hidden="true"><svg viewBox="0 0 80 100" fill="none"><circle cx="40" cy="34" r="16"/><path d="M12 94V83c0-18 13-29 28-29s28 11 28 29v11"/></svg><span>{name.slice(0,1)}</span></span>}
  {failed===source&&feature&&!textOnly?<span className="portrait-image-notice" role="status">人物插画暂未载入，原记录仍可阅读。</span>:null}
 </span>
}
