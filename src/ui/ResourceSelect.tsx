import {useState} from 'react'
type Choice={readonly id:string;readonly label:string}
type Props={options:readonly Choice[];required?:boolean;emptyLabel?:string;ariaLabel?:string}&({appearance:'people';name:string}|{appearance?:'select';name?:string})&({value:string;onChange:(id:string)=>void;initialValue?:never}|{initialValue?:string;value?:never;onChange?:never})
/** Losing an employee must not silently delegate an unconfirmed task to the player. */
export function ResourceSelect(props:Props){
 const [local,setLocal]=useState(props.initialValue??(props.appearance==='people'?'':'player-production')),chosen=props.value??local,visible=props.options.some(o=>o.id===chosen)?chosen:''
 const choose=(id:string)=>{if(props.onChange)props.onChange(id);else setLocal(id)}
 if(props.appearance==='people')return <div className="resource-people" role="radiogroup" aria-label={props.ariaLabel??'谁来做'}>
  {!visible&&chosen!==''?<p className="resource-choice-hint">原人手已不可用，请重新选择。</p>:props.options.length===0?<p className="resource-choice-hint">当前没有可选人手。</p>:null}
  {props.options.map(o=><label className="resource-person-choice" key={o.id} data-selected={visible===o.id?'true':'false'}><input type="radio" name={props.name} required={props.required??true} value={o.id} checked={visible===o.id} onChange={()=>choose(o.id)}/><span>{o.label}</span><span className="resource-person-selected" aria-hidden="true">{visible===o.id?'已选':''}</span></label>)}
 </div>
 return <select name={props.name} required={props.required??true} value={visible} onChange={event=>choose(event.currentTarget.value)}>{!visible?<option value="" disabled>{chosen===''?props.emptyLabel??'原资源不可用，请重新选择':'原资源不可用，请重新选择'}</option>:null}{props.options.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select>
}
