import fs from 'node:fs';
import {json,ident,hash,git,blobOid,proof,tree} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
const root='goal-1/evidence/t17-acceptance-40/wait-feedback-r373',parent='191593d104c2013af6a6e90593c0afcdcedde56e',mode=process.argv[2];
if(fs.existsSync(root+'/stopped.json'))throw Error('ACTIVE_B5_REQUIRED');
if(mode==='stage'){
 if(git(['rev-parse','HEAD']).toString().trim()!==parent||git(['diff','--cached','--name-only']).toString().trim())throw Error('PINNED_PARENT_AND_EMPTY_INDEX_REQUIRED');
 const owned=json(root+'/owned-source.json').paths,source=json(root+'/snapshot390.json');
 if(owned.length!==29||json(root+'/preservation-before-commit.json').latestCompleteSealedPayloads.length!==40)throw Error('FULL_CURRENT_PRESERVATION_REQUIRED');
 for(const path of owned){const row=source.files.find(r=>r.path===path);if(!row||hash(fs.readFileSync(path))!==row.sha256)throw Error('EXACT_390_SOURCE_REQUIRED:'+path)}
 const paths=[...new Set([...owned,...tree(root).files.map(r=>r.path).filter(p=>!p.endsWith('.log')&&!p.endsWith('/checkpoint-manifest.json')&&!p.endsWith('/checkpoint-readback.json'))])].sort();
 const rows=paths.map(path=>({...ident(path),oid:blobOid(fs.readFileSync(path))}));
 fs.writeFileSync(root+'/checkpoint-manifest.json',JSON.stringify({at:new Date().toISOString(),parent,rows,productPaths:owned,status:'B5 incomplete; local checkpoint only; Native wait/stop and main update remain'},null,2)+'\n',{flag:'wx'});
 git(['add','--',...paths]);proof(rows);
 const staged=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort();if(JSON.stringify(staged)!==JSON.stringify(paths))throw Error('EXACT_STAGED_SET_REQUIRED');
 console.log({paths:rows.length,sourceFiles:owned.length,allStagedBytesAndModesExact:true,taskComplete:false});
}else if(mode==='readback'){
 const m=json(root+'/checkpoint-manifest.json'),head=git(['rev-parse','HEAD']).toString().trim();
 if(git(['rev-parse','HEAD^']).toString().trim()!==parent||git(['diff','--cached','--name-only']).toString().trim())throw Error('PARENT_AND_EMPTY_INDEX_REQUIRED');
 const actual=git(['diff-tree','--no-commit-id','--name-only','-r','-z',head]).toString().split('\0').filter(Boolean).sort();if(JSON.stringify(actual)!==JSON.stringify(m.rows.map(r=>r.path)))throw Error('EXACT_COMMIT_PATH_SET_REQUIRED');
 for(const row of m.rows)if(hash(fs.readFileSync(row.path))!==row.sha256)throw Error('OWNED_WORKTREE_CHANGED:'+row.path);
 const result={at:new Date().toISOString(),commit:head,parent,...proof(m.rows,head),indexEmpty:true,pushed:false,taskComplete:false};
 fs.writeFileSync(root+'/checkpoint-readback.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(result);
}else throw Error('EXPLICIT_STAGE_OR_READBACK_REQUIRED');
