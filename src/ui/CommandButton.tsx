import type { GamePanelProps } from './game-types.ts'
import { reasonText } from './game-text.ts'
export function CommandButton({controller,view,request,kind,payload,label,confirm=false,primary=false}:{controller:GamePanelProps['controller'];view:GamePanelProps['view'];request:GamePanelProps['request'];kind:string;payload:unknown;label:string;confirm?:boolean;primary?:boolean}){
 const preview=controller.preview({runId:view.runId,actorId:'player',commandId:'display-preview',expectedRevision:view.revision,kind,payload})
 const disabled=!preview.allowed||view.busy||view.hasCandidate||view.readOnly||view.saveStatus==='conflict'
 return <div className="command"><button type="button" className={primary?'primary':''} disabled={disabled} onClick={()=>request(kind,payload,label,confirm)}>{label}</button>{!preview.allowed&&preview.reasonCodes[0]?<small className="reason">{reasonText(preview.reasonCodes[0])}</small>:null}</div>
}
