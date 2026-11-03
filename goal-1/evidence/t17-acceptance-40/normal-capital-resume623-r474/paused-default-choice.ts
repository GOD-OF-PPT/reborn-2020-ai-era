/** Author automation only: use the same published current event/default as the game UI. */
export type PublicPause={reason:string;instanceId:string}|null
export interface PublicPausedEvent{readonly id:string;readonly isBlocking:boolean;readonly defaultChoiceId:string;readonly choices:readonly {readonly id:string;readonly isDefault:boolean}[]}
export interface PublicEventView{readonly pause:PublicPause;readonly events:readonly PublicPausedEvent[]}
export class AuthorSelectionError extends Error{
 readonly code:string
 readonly details:unknown
 constructor(code:string,details:unknown){super(code);this.name='AuthorSelectionError';this.code=code;this.details=details}
}
export function currentPausedDefault(input:PublicEventView):{instanceId:string;choiceId:string}{
 if(input.pause?.reason!=='CONTENT_DECISION_PENDING')throw new AuthorSelectionError('CONTENT_PAUSE_REQUIRED',{pause:input.pause})
 const events=input.events.filter(event=>event.isBlocking)
 if(events.length!==1)throw new AuthorSelectionError('UNIQUE_CURRENT_PUBLIC_EVENT_REQUIRED',{pause:input.pause,candidates:events.map(event=>event.id)})
 const event=events[0]!,defaults=event.choices.filter(choice=>choice.isDefault)
 if(defaults.length!==1||defaults[0]!.id!==event.defaultChoiceId)throw new AuthorSelectionError('UNIQUE_ORIGINAL_DEFAULT_REQUIRED',{instanceId:event.id,defaultChoiceId:event.defaultChoiceId,candidates:defaults.map(choice=>choice.id)})
 return {instanceId:event.id,choiceId:defaults[0]!.id}
}
