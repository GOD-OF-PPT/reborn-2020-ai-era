import {useState} from 'react'
type Choice={readonly id:string;readonly label:string}
type Props={options:readonly Choice[];name?:string;required?:boolean}&({value:string;onChange:(id:string)=>void;initialValue?:never}|{initialValue?:string;value?:never;onChange?:never})
/** Losing an employee must not silently delegate an unconfirmed task to the player. */
export function ResourceSelect(props:Props){
 const [local,setLocal]=useState(props.initialValue??'player-production'),chosen=props.value??local,visible=props.options.some(o=>o.id===chosen)?chosen:''
 return <select name={props.name} required={props.required??true} value={visible} onChange={event=>{const id=event.currentTarget.value;if(props.onChange)props.onChange(id);else setLocal(id)}}>{!visible?<option value="" disabled>原资源不可用，请重新选择</option>:null}{props.options.map(o=><option key={o.id} value={o.id}>{o.label}</option>)}</select>
}
