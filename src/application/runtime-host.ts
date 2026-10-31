import {RuleError,requireRule} from '../core/errors.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import type {GameController,GameStart} from './game-controller.ts'
import type {RuntimeChannel} from './runtime-transport.ts'
import {checkRuntimeArgs,readRuntimeRequest,record,validCounter,type RuntimeDiagnostics,type RuntimeMethod,type RuntimeRequest} from './runtime-protocol.ts'

export interface RuntimeOwner{readonly controller:GameController;readonly diagnostics:RuntimeDiagnostics|null}
export type RuntimeOwnerFactory=(options:{storageTest:string|null})=>Promise<RuntimeOwner>
const lifecycle=new Set<RuntimeMethod>(['initialize','newLife','continueLife','importNew','restore','restoreBackup','reload','home'])
const commands=new Set<RuntimeMethod>(['submit','waitForFeedback','retry','runRoutine','stopWaiting','stopRoutineBatch','close'])
const reads=new Set<RuntimeMethod>(['preview','clockCommitments','exportSaved','exportCandidate','exportStored','inspectImport'])

/** The original controller remains the sole owner of rules, leases and transactions. */
export function installRuntimeHost(channel:RuntimeChannel,create:RuntimeOwnerFactory):()=>void{
 let owner:RuntimeOwner|null=null,bootId:string|null=null,highestId=0,sequence=0,session=0,closed=false
 let waitRequestId:number|null=null,routineRequestId:number|null=null,unsubscribe:()=>void=()=>{},recoveryKey:string|null=null
 const publish=()=>{
  if(!owner||!bootId)return
  const c=owner.controller
  channel.postMessage({protocol:1,bootId,kind:'snapshot',sequence:++sequence,session,state:c.snapshot,needsUnsavedWarning:c.needsUnsavedWarning,timeWait:c.timeWait,waitRequestId,routineRequestId,diagnostics:owner.diagnostics})
  const view=c.snapshot.view
  if(!view?.hasCandidate){recoveryKey=null;return}
  const key=view.runId+':'+view.revision+':'+view.pendingRevision
  if(!['unsaved','conflict'].includes(view.saveStatus)||recoveryKey===key)return
  recoveryKey=key
  // Keep the original portable candidate as opaque recovery text. It is never
  // interpreted by the renderer or treated as a committed result.
  try{channel.postMessage({protocol:1,bootId,kind:'recovery',sequence,session,runId:view.runId,revision:view.revision,pendingRevision:view.pendingRevision,text:c.exportCandidate()})}
  catch(error){channel.postMessage({protocol:1,bootId,kind:'recovery-error',sequence,session,error:error instanceof RuleError?error.code:'RUNTIME_OPERATION_FAILED'})}
 }
 const respond=(request:RuntimeRequest,ok:boolean,result?:unknown,error?:string)=>channel.postMessage({protocol:1,bootId:request.bootId,kind:'response',id:request.id,sequence,session,ok,...(ok?{result}:{error})})
 const invoke=(method:RuntimeMethod,args:readonly unknown[]):unknown=>{
  const c=owner!.controller
  switch(method){
   case 'initialize':return c.initialize()
   case 'newLife':return c.newLife(args[0] as GameStart)
   case 'continueLife':return c.continueLife(args[0] as string)
   case 'preview':return c.preview(args[0] as CommandEnvelope)
   case 'clockCommitments':return c.clockCommitments(args[0] as CommandEnvelope)
   case 'submit':return c.submit(args[0] as CommandEnvelope)
   case 'waitForFeedback':return c.waitForFeedback(args[0] as CommandEnvelope)
   case 'runRoutine':return c.runRoutine(args[0] as string,args[1] as boolean|undefined)
   case 'retry':return c.retry()
   case 'reload':return c.reload(args[0] as boolean|undefined)
   case 'home':return c.home(args[0] as boolean|undefined)
   case 'close':return c.close(args[0] as boolean|undefined)
   case 'exportSaved':return c.exportSaved()
   case 'exportCandidate':return c.exportCandidate()
   case 'exportStored':return c.exportStored(args[0] as string,args[1] as boolean|undefined)
   case 'inspectImport':return c.inspectImport(args[0] as string)
   case 'importNew':return c.importNew(args[0] as string)
   case 'restore':return c.restore(args[0] as string)
   case 'restoreBackup':return c.restoreBackup()
   case 'stopWaiting':if(args[0]===waitRequestId)c.stopWaiting();return
   case 'stopRoutineBatch':if(args[0]===routineRequestId)c.stopRoutineBatch();return
   default:throw new RuleError('RUNTIME_METHOD_NOT_ALLOWED')
  }
 }
 const handle=async(value:unknown)=>{
  let request:RuntimeRequest|undefined,markedWait=false,markedRoutine=false
  try{
   request=readRuntimeRequest(value);checkRuntimeArgs(request.method,request.args)
   requireRule(!closed,'SESSION_CLOSED')
   requireRule(request.id>highestId,'RUNTIME_REQUEST_REUSED')
   if(request.method==='boot'){
    requireRule(bootId===null&&request.scope.sequence===0&&request.scope.session===0&&request.scope.runId===null,'RUNTIME_BOOT_REUSED')
    bootId=request.bootId;highestId=request.id
    owner=await create(request.args[0] as {storageTest:string|null})
    unsubscribe=owner.controller.subscribe(publish);publish();respond(request,true,{diagnostics:owner.diagnostics});return
   }
   requireRule(owner&&request.bootId===bootId,'RUNTIME_NOT_READY')
   highestId=request.id
   const view=owner.controller.snapshot.view
   requireRule(request.scope.session===session&&request.scope.runId===(view?.runId??null),'RUNTIME_SCOPE_EXPIRED')
   // Commands still pass through the original fingerprint/revision/idempotency
   // checks. A busy snapshot must not break same-command in-flight coalescing.
   if(!commands.has(request.method))requireRule(request.scope.sequence===sequence&&request.scope.revision===(view?.revision??null),'RUNTIME_SCOPE_EXPIRED')
   if(lifecycle.has(request.method)){session++;publish()}
   if(request.method==='waitForFeedback'&&waitRequestId===null){waitRequestId=request.id;markedWait=true}
   if(request.method==='runRoutine'&&routineRequestId===null){routineRequestId=request.id;markedRoutine=true}
   const result=await invoke(request.method,request.args)
   if(markedWait)waitRequestId=null
   if(markedRoutine)routineRequestId=null
   if(!reads.has(request.method))publish()
   respond(request,true,result)
   if(request.method==='close'){closed=true;unsubscribe()}
  }catch(error){
   if(markedWait)waitRequestId=null
   if(markedRoutine)routineRequestId=null
   if(request){
    if(owner&&!reads.has(request.method))publish()
    respond(request,false,undefined,error instanceof RuleError?error.code:'RUNTIME_OPERATION_FAILED')
   }else if(record(value)&&value.bootId===bootId&&validCounter(value.id)&&value.id>0){
    channel.postMessage({protocol:1,bootId,kind:'response',id:value.id,sequence,session,ok:false,error:error instanceof RuleError?error.code:'RUNTIME_BAD_REQUEST'})
   }
  }
 }
 const unlisten=channel.listen(value=>{void handle(value)})
 return()=>{closed=true;unlisten();unsubscribe()}
}
