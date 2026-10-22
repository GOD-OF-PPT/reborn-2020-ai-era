import {lstatSync} from 'node:fs';
import {resolve,relative,dirname,join,sep} from 'node:path';
import {fileURLToPath} from 'node:url';

const evidenceRoot=resolve(fileURLToPath(new URL('../goal-1/evidence/',import.meta.url)));

/** A nested browser journal must obey every enclosing evidence seal. */
export function assertBrowserEvidenceWritable(root){
 const target=resolve(root),name=relative(evidenceRoot,target);
 if(!name||name==='..'||name.startsWith('..'+sep)||resolve(evidenceRoot,name)!==target)throw Error('BROWSER_EVIDENCE_ROOT_REQUIRED');
 for(let current=target;;current=dirname(current)){
  const stat=lstatSync(current);
  if(stat.isSymbolicLink()||!stat.isDirectory())throw Error('BROWSER_EVIDENCE_DIRECTORY_SYMLINK_OR_NON_DIRECTORY');
  if(lstatSync(join(current,'sealed-evidence.json'),{throwIfNoEntry:false}))throw Error('EVIDENCE_SEALED_USE_NEW_ROOT');
  if(current===evidenceRoot)break;
 }
 for(const name of ['native-progress.jsonl','exports.jsonl']){
  const stat=lstatSync(join(target,name),{throwIfNoEntry:false});
  if(stat&&(!stat.isFile()||stat.isSymbolicLink()))throw Error('BROWSER_EVIDENCE_APPEND_TARGET_REQUIRED:'+name);
 }
}

/** Read-only observation stays available; each mutating entry checks the actual directory tree first. */
export function protectBrowserEvidence(h,root){
 const guarded={...h};
 for(const name of ['journal','click','exportRaw','importText']){
  if(typeof h[name]!=='function')throw Error('BROWSER_EVIDENCE_ENTRY_REQUIRED:'+name);
  guarded[name]=async(...args)=>{
   assertBrowserEvidenceWritable(root);
   const label=name==='exportRaw'?args[0]:name==='importText'?args[1]:null;
   if((name==='exportRaw'||name==='importText')&&(typeof label!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(label)))throw Error('BROWSER_EVIDENCE_SINGLE_FILENAME_LABEL_REQUIRED');
   return h[name](...args);
  };
 }
 return guarded;
}
