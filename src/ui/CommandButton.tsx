import type { GamePanelProps } from './game-types.ts'
import type {ReactNode} from 'react'
import { reasonText } from './game-text.ts'
export function CommandButton({controller,view,request,kind,payload,label,confirm=false,primary=false,children,className=''}:{controller:GamePanelProps['controller'];view:GamePanelProps['view'];request:GamePanelProps['request'];kind:string;payload:unknown;label:string;confirm?:boolean;primary?:boolean;children?:ReactNode;className?:string}){
 const preview=controller.preview({runId:view.runId,actorId:'player',commandId:'display-preview',expectedRevision:view.revision,kind,payload})
 const disabled=!preview.allowed||view.busy||view.hasCandidate||view.readOnly||view.saveStatus==='conflict'
 return <div className={'command '+className}><button type="button" className={primary?'primary':''} aria-label={children?label:undefined} disabled={disabled} onClick={()=>request(kind,payload,label,confirm)}>{children??label}</button>{!preview.allowed&&preview.reasonCodes[0]?<small className="reason">{reasonText(preview.reasonCodes[0])}</small>:null}</div>
}
