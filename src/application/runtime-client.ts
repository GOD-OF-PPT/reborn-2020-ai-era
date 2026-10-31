import {assertJsonInput} from '../core/json-input.ts'
import {RuleError,requireRule} from '../core/errors.ts'
import type {CommandEnvelope} from '../core/run-types.ts'
import type {CommandPreview} from '../core/commands.ts'
import type {PublicWaitResult} from './public-wait.ts'
import type {SessionResult} from './session.ts'
import type {GameController,GameStart} from './game-controller.ts'
import type {GameControllerPort} from './game-controller-port.ts'
import {INITIAL_GAME_SNAPSHOT} from './game-snapshot.ts'
import type {RuntimeTransport} from './runtime-transport.ts'
import {record,validCounter,type RuntimeDiagnostics,type RuntimeMethod,type RuntimeResponse,type RuntimeScope,type RuntimeSnapshot} from './runtime-protocol.ts'
import {publicViewHeader,runtimeResultValid} from './runtime-response.ts'

const readMethods=new Set<RuntimeMethod>(['preview','clockCommitments','exportSaved','exportCandidate','exportStored','inspectImport'])
const writeMethods=new Set<RuntimeMethod>(['newLife','submit','waitForFeedback','retry','runRoutine','importNew','restore','restoreBackup'])
type Pending={method:RuntimeMethod;scope:RuntimeScope;commandId?:string;resolve:(value:unknown)=>void;reject:(error:RuleError)=>void;response?:RuntimeResponse}
type TextCopy={runId:string;revision:number;pendingRevision:number|null;text:string}

/** A public projection and request handle. No kernel, codec or private run lives here. */
export class RuntimeGameController implements GameControllerPort{
 readonly asynchronous=true as const
 readonly #factory:()=>RuntimeTransport
 readonly #storageTest:string|null
 readonly #listeners=new Set<()=>void>()
 readonly #disposers=new Set<()=>void>()
 readonly #readListeners=new Set<()=>void>()
 readonly #pending=new Map<number,Pending>()
 readonly #prepared=new WeakMap<CommandEnvelope,string>()
 #transport!:RuntimeTransport;#unlisten=()=>{};#unerror=()=>{}
 #bootId='';#id=0;#sequence=0;#session=0;#server=INITIAL_GAME_SNAPSHOT;#state=INITIAL_GAME_SNAPSHOT
 #needsWarning=false;#failed=false;#closed=false;#busy=0;#writes=0;#uncertainWrite=false;#recovering=false
 #wait:GameController['timeWait']=null;#waitId:number|null=null;#routineId:number|null=null;#stopWaitId:number|null=null;#readCount=0
 #diagnostics:RuntimeDiagnostics|null=null;#candidate:TextCopy|null=null;#saved:TextCopy|null=null
 #ready!:Promise<void>
 constructor(factory:()=>RuntimeTransport,storageTest:string|null=null){this.#factory=factory;this.#storageTest=storageTest;this.#start()}
 get snapshot(){return this.#state}
 get runtimeSequence(){return this.#sequence}
 get runtimeSession(){return this.#bootId+':'+this.#session}
 get runtimeFailed(){return this.#failed}
 get runtimeWriteUncertain(){return this.#uncertainWrite}
 get diagnostics(){return this.#diagnostics}
 get needsUnsavedWarning(){return this.#needsWarning||this.#writes>0||this.#uncertainWrite}
 get timeWait(){return this.#wait&&this.#stopWaitId===this.#waitId?{...this.#wait,stopRequested:true}:this.#wait}
 get readingCount(){return this.#readCount}
 subscribe=(listener:()=>void)=>{this.#listeners.add(listener);return()=>{this.#listeners.delete(listener)}}
 subscribeReads=(listener:()=>void)=>{this.#readListeners.add(listener);return()=>{this.#readListeners.delete(listener)}}
 #notifyReads(){for(const listener of [...this.#readListeners])try{listener()}catch{this.#readListeners.delete(listener)}}
 onDispose(listener:()=>void){this.#disposers.add(listener);return()=>{this.#disposers.delete(listener)}}
 ready(){return this.#ready}
 #notify(){
  this.#state={...this.#server,busy:!this.#failed&&(this.#server.busy||this.#busy>0||this.#recovering)}
  for(const listener of [...this.#listeners])try{listener()}catch{this.#listeners.delete(listener)}
 }
 #scope():RuntimeScope{return {sequence:this.#sequence,session:this.#session,runId:this.#server.view?.runId??null,revision:this.#server.view?.revision??null}}
 #start(){
  this.#bootId=globalThis.crypto.randomUUID();this.#id=0;this.#sequence=0;this.#session=0;this.#failed=false;this.#closed=false
  this.#server=INITIAL_GAME_SNAPSHOT;this.#wait=null;this.#waitId=null;this.#routineId=null;this.#diagnostics=null
  this.#transport=this.#factory();this.#unlisten=this.#transport.listen(value=>this.#message(value));this.#unerror=this.#transport.onError(()=>this.#fault())
  this.#ready=this.#send('boot',[{storageTest:this.#storageTest}]).then(()=>{})
 }
 #fault(code='RUNTIME_UNAVAILABLE'){
  if(this.#failed||this.#closed)return
  this.#failed=true;this.#uncertainWrite=this.#uncertainWrite||this.#writes>0;this.#wait=null;this.#waitId=null;this.#routineId=null
  this.#unlisten();this.#unerror();this.#transport.terminate()
  for(const p of this.#pending.values())p.reject(new RuleError(code))
  this.#pending.clear();this.#readCount=0;this.#notifyReads();this.#server={...this.#server,view:this.#server.view?{...this.#server.view,busy:false}:null,phase:'error',busy:false,error:code,notice:null};this.#notify()
 }
 #message(value:unknown){
  if(!record(value)||value.protocol!==1||value.bootId!==this.#bootId||this.#failed||this.#closed)return
  if(value.kind==='snapshot'){
   if(!validCounter(value.sequence)||value.sequence<=this.#sequence)return
   if(!validCounter(value.session)||value.session<this.#session||!record(value.state)||!['loading','home','playing','error'].includes(String(value.state.phase))||!Array.isArray(value.state.runs)||typeof value.state.busy!=='boolean'||typeof value.needsUnsavedWarning!=='boolean'){this.#fault('RUNTIME_INVALID_RESPONSE');return}
   const packet=value as unknown as RuntimeSnapshot
   const v=packet.state.view
   if(v!==null&&!publicViewHeader(v)){this.#fault('RUNTIME_INVALID_RESPONSE');return}
   if(packet.session!==this.#session||this.#saved?.runId!==v?.runId||this.#saved?.revision!==v?.revision)this.#saved=null
   if(packet.timeWait===null||packet.waitRequestId!==this.#waitId)this.#stopWaitId=null
   this.#sequence=packet.sequence;this.#session=packet.session;this.#server=packet.state;this.#needsWarning=packet.needsUnsavedWarning;this.#wait=packet.timeWait;this.#waitId=packet.waitRequestId;this.#routineId=packet.routineRequestId??null
   if(packet.diagnostics){if(this.#diagnostics?.name===packet.diagnostics.name)Object.assign(this.#diagnostics.trace,packet.diagnostics.trace);else this.#diagnostics=packet.diagnostics}else this.#diagnostics=null
   if(!v?.hasCandidate)this.#candidate=null
   this.#notify();this.#settle();return
  }
  if(value.kind==='recovery'){
   const v=this.#server.view
   if(v?.hasCandidate&&value.sequence===this.#sequence&&value.session===this.#session&&value.runId===v.runId&&value.revision===v.revision&&value.pendingRevision===v.pendingRevision&&typeof value.text==='string'&&value.text.length<=10*1024*1024)this.#candidate={runId:v.runId,revision:v.revision,pendingRevision:v.pendingRevision,text:value.text}
   return
  }
  if(value.kind!=='response'||!validCounter(value.id)||!validCounter(value.sequence)||!validCounter(value.session)||typeof value.ok!=='boolean')return
  const p=this.#pending.get(value.id);if(!p)return
  p.response=value as unknown as RuntimeResponse;this.#settle()
 }
 #settle(){
  for(const [id,p]of this.#pending){
   const response=p.response;if(!response||response.sequence>this.#sequence)continue
   this.#pending.delete(id)
   if(readMethods.has(p.method)){this.#readCount--;this.#notifyReads()}
   if(!response.ok){p.reject(new RuleError(response.error??'RUNTIME_OPERATION_FAILED'));continue}
   if(response.session!==this.#session||readMethods.has(p.method)&&(p.scope.session!==this.#session||p.scope.sequence!==this.#sequence)){p.reject(new RuleError('RUNTIME_SCOPE_EXPIRED'));continue}
   if(!runtimeResultValid(p.method,response.result,this.#server,p.commandId)){p.reject(new RuleError('RUNTIME_INVALID_RESPONSE'));this.#fault('RUNTIME_INVALID_RESPONSE');return}
   p.resolve(response.result)
  }
 }
 #send(method:RuntimeMethod,args:readonly unknown[],scope=this.#scope()):Promise<unknown>{
  if(this.#failed)return Promise.reject(new RuleError('RUNTIME_UNAVAILABLE'))
  if(this.#closed)return Promise.reject(new RuleError('SESSION_CLOSED'))
  try{assertJsonInput(args)}catch(error){return Promise.reject(error instanceof RuleError?error:new RuleError('INVALID_PAYLOAD'))}
  const copied=structuredClone(args),id=++this.#id
  const input=args[0],commandId=method==='submit'&&record(input)&&typeof input.commandId==='string'?input.commandId:undefined
  const promise=new Promise<unknown>((resolve,reject)=>{this.#pending.set(id,{method,scope,...(commandId===undefined?{}:{commandId}),resolve,reject})})
  if(readMethods.has(method)){this.#readCount++;this.#notifyReads()}
  try{this.#transport.postMessage({protocol:1,bootId:this.#bootId,id,method,args:copied,scope})}catch{this.#fault()}
  return promise
 }
 #read<T>(method:RuntimeMethod,args:readonly unknown[],scope=this.#scope()):Promise<T>{return this.#send(method,args,scope) as Promise<T>}
 #change<T>(method:RuntimeMethod,args:readonly unknown[],scope=this.#scope()):Promise<T>{
  if(this.#failed)return Promise.reject(new RuleError('RUNTIME_UNAVAILABLE'))
  if(this.#closed)return Promise.reject(new RuleError('SESSION_CLOSED'))
  this.#busy++;if(writeMethods.has(method))this.#writes++;this.#notify()
  return (this.#send(method,args,scope) as Promise<T>).finally(()=>{this.#busy--;if(writeMethods.has(method))this.#writes--;this.#notify()})
 }
 #commandScope(command:CommandEnvelope){
  const session=this.#prepared.get(command)
  requireRule(session===undefined||session===this.runtimeSession,'RUNTIME_SCOPE_EXPIRED')
  return this.#scope()
 }
 prepare(kind:string,payload:unknown):CommandEnvelope{
  const v=this.#state.view;requireRule(!this.#closed,'SESSION_CLOSED');requireRule(v,'RUN_NOT_FOUND');requireRule(!this.#failed&&!this.#recovering,'RUNTIME_UNAVAILABLE')
  const command={runId:v.runId,actorId:'player',commandId:'command-'+globalThis.crypto.randomUUID(),expectedRevision:v.revision,kind,payload}
  this.#prepared.set(command,this.runtimeSession);return command
 }
 preview(command:CommandEnvelope):CommandPreview{
  const v=this.#state.view,reason=this.#closed?'SESSION_CLOSED':this.#failed?'RUNTIME_UNAVAILABLE':!v?'RUN_NOT_FOUND':v.readOnly?'READ_ONLY_SESSION':this.#state.busy?'SAVE_IN_PROGRESS':v.hasCandidate?'UNSAVED_CANDIDATE':v.saveStatus==='conflict'?'RELOAD_REQUIRED':command.runId!==v.runId||command.expectedRevision!==v.revision?'STALE_REVISION':'RUNTIME_READ_PENDING'
  return {allowed:false,reasonCodes:[reason],actionPoints:0,upfrontCostFen:0,releasedFen:0}
 }
 previewAsync(command:CommandEnvelope){return this.#read<CommandPreview>('preview',[command],this.#commandScope(command))}
 clockCommitments(_command:CommandEnvelope):ReturnType<GameController['clockCommitments']>{throw new RuleError('RUNTIME_READ_PENDING')}
 clockCommitmentsAsync(command:CommandEnvelope){return this.#read<ReturnType<GameController['clockCommitments']>>('clockCommitments',[command],this.#commandScope(command))}
 async initialize(){await this.ready();if(this.#failed)return this.#recover(false,false);await this.#change('initialize',[])}
 newLife(input:GameStart){return this.#change<void>('newLife',[input])}
 continueLife(runId:string){return this.#change<void>('continueLife',[runId])}
 submit(command:CommandEnvelope){return this.#change<SessionResult>('submit',[command],this.#commandScope(command))}
 waitForFeedback(command:CommandEnvelope){return this.#change<PublicWaitResult>('waitForFeedback',[command],this.#commandScope(command))}
 stopWaiting(){if(this.#waitId!==null){this.#stopWaitId=this.#waitId;this.#notify();void this.#send('stopWaiting',[this.#waitId]).catch(()=>{})}}
 runRoutine(planId:string,batch=true){return this.#change<Awaited<ReturnType<GameController['runRoutine']>>>('runRoutine',[planId,batch])}
 stopRoutineBatch(){if(this.#routineId!==null)void this.#send('stopRoutineBatch',[this.#routineId]).catch(()=>{})}
 retry(){return this.#change<SessionResult>('retry',[])}
 reload(discardCandidate=false){return this.#failed?this.#recover(discardCandidate,false):this.#change<void>('reload',[discardCandidate])}
 home(discardCandidate=false){return this.#failed?this.#recover(discardCandidate,true):this.#change<void>('home',[discardCandidate])}
 exportSaved():string{const v=this.#state.view;requireRule(v&&this.#saved?.runId===v.runId&&this.#saved.revision===v.revision,'RUNTIME_READ_PENDING');return this.#saved.text}
 exportCandidate():string{const v=this.#state.view;requireRule(v?.hasCandidate&&this.#candidate?.runId===v.runId&&this.#candidate.revision===v.revision&&this.#candidate.pendingRevision===v.pendingRevision,'RUNTIME_READ_PENDING');return this.#candidate.text}
 async exportSavedAsync(){
  if(this.#failed){requireRule(this.#saved,'RUNTIME_RECORD_UNAVAILABLE');return this.exportSaved()}
  const scope=this.#scope(),text=await this.#read<string>('exportSaved',[]);requireRule(typeof text==='string','RUNTIME_INVALID_RESPONSE')
  if(scope.runId!==null&&scope.revision!==null)this.#saved={runId:scope.runId,revision:scope.revision,pendingRevision:null,text};return text
 }
 async exportCandidateAsync(){
  if(this.#failed){requireRule(this.#candidate,'RUNTIME_CANDIDATE_UNAVAILABLE');return this.exportCandidate()}
  const v=this.#state.view,text=await this.#read<string>('exportCandidate',[]);requireRule(v?.hasCandidate&&typeof text==='string','RUNTIME_INVALID_RESPONSE')
  this.#candidate={runId:v.runId,revision:v.revision,pendingRevision:v.pendingRevision,text};return text
 }
 exportStored(runId:string,backup=false){return this.#read<string>('exportStored',[runId,backup])}
 inspectImport(_text:string):ReturnType<GameController['inspectImport']>{throw new RuleError('RUNTIME_READ_PENDING')}
 inspectImportAsync(text:string){return this.#read<ReturnType<GameController['inspectImport']>>('inspectImport',[text])}
 importNew(text:string){return this.#change<void>('importNew',[text])}
 restore(text:string){return this.#change<void>('restore',[text])}
 restoreBackup(){return this.#change<void>('restoreBackup',[])}
 async #recover(discardCandidate:boolean,toHome:boolean){
  requireRule(!this.#recovering,'SAVE_IN_PROGRESS');requireRule(!this.#state.view?.hasCandidate||discardCandidate||this.#uncertainWrite&&!this.#candidate,'UNSAVED_CANDIDATE_EXISTS')
  const runId=this.#state.view?.runId;this.#recovering=true
  try{
   this.#start();await this.ready();await this.#change('initialize',[])
   if(!toHome&&runId)await this.#change('continueLife',[runId])
   this.#uncertainWrite=false;if(discardCandidate)this.#candidate=null
  }finally{this.#recovering=false;this.#notify()}
 }
 async close(discardCandidate=false){
  if(this.#closed)return
  if(!this.#failed)await this.#change<void>('close',[discardCandidate])
  else requireRule(!this.needsUnsavedWarning||discardCandidate,'UNSAVED_CANDIDATE_EXISTS')
  this.#closed=true;this.#unlisten();this.#unerror();this.#transport.terminate();this.#listeners.clear()
  for(const pending of this.#pending.values())pending.reject(new RuleError('SESSION_CLOSED'))
  this.#pending.clear();this.#readCount=0;this.#notifyReads()
  this.#needsWarning=false;this.#uncertainWrite=false;this.#candidate=null;this.#saved=null;this.#wait=null
  for(const dispose of this.#disposers)dispose();this.#disposers.clear()
  this.#readListeners.clear()
 }
}
