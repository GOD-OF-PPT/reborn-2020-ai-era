import type {RelayState} from './relay-schema.ts'

/** Decision views disclose a supply result only after its original letter is read.
 * The saved state and historical service/timer qualification keep the real result.
 */
export function knownRelayState(state:RelayState|null):RelayState|null {
 if(state===null)return null
 return {...state,
  applications:state.applications.map(application=>application.read?application:{...application,approved:null,expiresAt:null}),
  adapters:state.adapters.filter(adapter=>adapter.kind!=='initial_verification'||state.applications.some(application=>application.read&&application.jobId===adapter.jobId&&application.businessId===adapter.businessId&&application.supplierId===adapter.supplierId)),
 }
}
