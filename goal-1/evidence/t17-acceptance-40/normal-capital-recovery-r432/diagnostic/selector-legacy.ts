// Baseline extracted from the failing author branch; never used by the game.
type Input={pause:{reason:string;instanceId:string}|null;events:readonly unknown[];legacyInstances?:readonly {id:string;definitionId:string;openedBy:string;status:string}[];legacyDefaults?:Record<string,string>}
export function currentPausedDefault(input:Input){
 if(input.pause?.reason!=='CONTENT_DECISION_PENDING')throw Error('CONTENT_PAUSE_REQUIRED')
 const rows=(input.legacyInstances??[]).filter(i=>i.openedBy===input.pause!.instanceId&&i.status==='open')
 if(rows.length!==1)throw Error('UNIQUE_PUBLIC_OBJECT_REQUIRED')
 const event=rows[0]!,choiceId=input.legacyDefaults?.[event.definitionId];if(!choiceId)throw Error('DEFAULT_CHOICE_REQUIRED')
 return {instanceId:event.id,choiceId}
}
