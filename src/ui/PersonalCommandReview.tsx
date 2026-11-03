import {Children,Fragment,cloneElement,isValidElement,useState,type ReactNode,type ComponentProps} from 'react'
import {Dialog} from './Dialog.tsx'
import {CommandDetails} from './CommandDetails.tsx'
import {LifeDecisionFacts} from './LifeDecisionFacts.tsx'
import {WorkDecisionFacts} from './WorkDecisionFacts.tsx'
import './personal-command-review.css'

/** Select only the two existing captured fact components, never a label. */
export function isPersonalDecisionFacts(value:ReactNode):boolean {
 return isValidElement(value)&&(value.type===LifeDecisionFacts||value.type===WorkDecisionFacts)
}

/** Only presentation changes; original captured command/view/preview references
 * and unrelated detail nodes are passed through intact. */
export function expandedPersonalDetails(value:ReactNode):ReactNode {
 if(!isValidElement(value))return value
 if(value.type===CommandDetails&&isValidElement<ComponentProps<typeof CommandDetails>>(value))return cloneElement(value,{personalExpanded:true})
 if(value.type===Fragment&&isValidElement<{children?:ReactNode}>(value))return cloneElement(value,{},Children.map(value.props.children,expandedPersonalDetails))
 return value
}

export function PersonalCommandReview({title,facts,details,status,actions,onClose}:{title:string;facts:ReactNode;details:ReactNode;status:ReactNode;actions:ReactNode;onClose:()=>void}){
 const [reading,setReading]=useState(false)
 return <>
  <Dialog title={title} layout="direct" className="command-review personal-command-review" footer={actions} onClose={onClose}>
   {facts}
   <button type="button" className="personal-review-read" onClick={()=>setReading(true)}>翻阅这次决定的完整说明 ↗</button>
   {status}
  </Dialog>
  {reading?<Dialog title={title+' · 完整说明'} className="command-review personal-command-details" onClose={()=>setReading(false)} footer={<div className="button-row dialog-actions"><button type="button" onClick={()=>setReading(false)}>回到这次决定</button></div>}>
   {expandedPersonalDetails(details)}
   {status}
  </Dialog>:null}
 </>
}
