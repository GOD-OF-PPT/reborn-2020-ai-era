import {useState} from 'react'
import letter from '../../assets/ui-redesign/cinematic/props/equity-financing-letter-v1.png'

/** Material only. The caller owns its original record, text and action. */
export function EquityFinancingLetter({className=''}:{className?:string}){
 const [state,setState]=useState<'loading'|'ready'|'failed'>('loading')
 return <span className={'equity-financing-art '+className} data-image-state={state} aria-hidden="true">
  {state!=='failed'?<img src={letter} alt="" draggable={false} onLoad={()=>setState('ready')} onError={()=>setState('failed')}/>:null}
  <svg className="equity-financing-fallback" viewBox="0 0 300 200" focusable="false"><ellipse className="letter-contact" cx="149" cy="174" rx="124" ry="13"/><path className="letter-lining" d="m36 80 111-53 119 63-14 86-229-18z"/><path className="letter-sheet" d="m65 34 172 20-13 112-171-22z"/><path className="letter-envelope" d="m35 81 105 69 125-60-13 85-229-18z"/><path className="letter-fold" d="m24 156 105-65 123 83"/><path className="letter-clip" d="m80 56 3-23c2-16 24-13 22 3l-4 34c-2 15-20 12-18-2l3-24"/></svg>
 </span>
}
