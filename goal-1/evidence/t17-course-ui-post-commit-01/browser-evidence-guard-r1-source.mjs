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
}

/** Read-only observation stays available; each mutating entry checks the actual directory tree first. */
export function protectBrowserEvidence(h,root){
 const guarded={...h};
 for(const name of ['journal','click','exportRaw','importText']){
  if(typeof h[name]!=='function')throw Error('BROWSER_EVIDENCE_ENTRY_REQUIRED:'+name);
  guarded[name]=async(...args)=>{assertBrowserEvidenceWritable(root);return h[name](...args);};
 }
 return guarded;
}
