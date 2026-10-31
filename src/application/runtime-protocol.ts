import {assertJsonInput} from '../core/json-input.ts'
import {requireRule} from '../core/errors.ts'
import type {GameSnapshot} from './game-snapshot.ts'
import type {GameController} from './game-controller.ts'

export const RUNTIME_METHODS=['boot','initialize','newLife','continueLife','preview','clockCommitments','submit','waitForFeedback','stopWaiting','runRoutine','stopRoutineBatch','retry','reload','exportSaved','exportCandidate','exportStored','inspectImport','importNew','restore','restoreBackup','home','close'] as const
export type RuntimeMethod=typeof RUNTIME_METHODS[number]
export interface RuntimeScope{readonly sequence:number;readonly session:number;readonly runId:string|null;readonly revision:number|null}
export interface RuntimeRequest{readonly protocol:1;readonly bootId:string;readonly id:number;readonly method:RuntimeMethod;readonly args:readonly unknown[];readonly scope:RuntimeScope}
export interface RuntimeDiagnostics{readonly name:string;readonly trace:{writeSucceeded:boolean;abortIssued:boolean}}
export interface RuntimeSnapshot{
 readonly protocol:1;readonly bootId:string;readonly kind:'snapshot';readonly sequence:number;readonly session:number
 readonly state:GameSnapshot;readonly needsUnsavedWarning:boolean;readonly timeWait:GameController['timeWait']
 readonly waitRequestId:number|null;readonly routineRequestId?:number|null;readonly diagnostics:RuntimeDiagnostics|null
}
export interface RuntimeResponse{
 readonly protocol:1;readonly bootId:string;readonly kind:'response';readonly id:number;readonly sequence:number;readonly session:number
 readonly ok:boolean;readonly result?:unknown;readonly error?:string
}
const methods=new Set<string>(RUNTIME_METHODS)
export const validCounter=(value:unknown):value is number=>Number.isSafeInteger(value)&&typeof value==='number'&&value>=0
export const record=(value:unknown):value is Record<string,unknown>=>value!==null&&typeof value==='object'&&!Array.isArray(value)
export function readRuntimeRequest(value:unknown):RuntimeRequest{
 assertJsonInput(value)
 requireRule(record(value)&&Object.keys(value).length===6&&['protocol','bootId','id','method','args','scope'].every(k=>Object.hasOwn(value,k)),'RUNTIME_BAD_REQUEST')
 requireRule(value.protocol===1&&typeof value.bootId==='string'&&value.bootId.length>0&&value.bootId.length<=512&&validCounter(value.id)&&value.id>0,'RUNTIME_BAD_REQUEST')
 requireRule(typeof value.method==='string'&&methods.has(value.method),'RUNTIME_METHOD_NOT_ALLOWED')
 requireRule(Array.isArray(value.args)&&value.args.length<=2&&record(value.scope),'RUNTIME_BAD_REQUEST')
 const scope=value.scope
 requireRule(Object.keys(scope).length===4&&validCounter(scope.sequence)&&validCounter(scope.session),'RUNTIME_BAD_REQUEST')
 requireRule(scope.runId===null&&scope.revision===null||typeof scope.runId==='string'&&scope.runId.length>0&&scope.runId.length<=512&&validCounter(scope.revision)&&scope.revision>0,'RUNTIME_BAD_REQUEST')
 return value as unknown as RuntimeRequest
}

export function checkRuntimeArgs(method:RuntimeMethod,args:readonly unknown[]):void{
 const count=(n:number)=>requireRule(args.length===n,'RUNTIME_BAD_REQUEST')
 if(['initialize','retry','exportSaved','exportCandidate','restoreBackup'].includes(method)){count(0);return}
 if(['reload','home','close'].includes(method)){requireRule(args.length<=1&&(args.length===0||typeof args[0]==='boolean'),'RUNTIME_BAD_REQUEST');return}
 if(['continueLife','inspectImport','importNew','restore'].includes(method)){count(1);requireRule(typeof args[0]==='string','RUNTIME_BAD_REQUEST');return}
 if(['preview','clockCommitments','submit','waitForFeedback','newLife'].includes(method)){count(1);requireRule(record(args[0]),'RUNTIME_BAD_REQUEST');return}
 if(method==='exportStored'||method==='runRoutine'){requireRule((args.length===1||args.length===2)&&typeof args[0]==='string'&&(args.length===1||typeof args[1]==='boolean'),'RUNTIME_BAD_REQUEST');return}
 if(method==='stopWaiting'||method==='stopRoutineBatch'){count(1);requireRule(validCounter(args[0])&&args[0]>0,'RUNTIME_BAD_REQUEST');return}
 count(1);requireRule(record(args[0])&&Object.keys(args[0]).length===1&&(args[0].storageTest===null||typeof args[0].storageTest==='string'&&args[0].storageTest.length<=64),'RUNTIME_BAD_REQUEST')
}
