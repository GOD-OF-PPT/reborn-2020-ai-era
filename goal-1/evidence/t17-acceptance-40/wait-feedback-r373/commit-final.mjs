import fs from 'node:fs';
import {json,ident,hash,git,blobOid,proof} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
const root='goal-1/evidence/t17-acceptance-40/wait-feedback-r373',parent='d167183d046df7d8ea05c5e6824cb904908cf373',mode=process.argv[2];
if(mode==='stage'){
 if(git(['rev-parse','HEAD']).toString().trim()!==parent||git(['diff','--cached','--name-only']).toString().trim())throw Error('PINNED_PARENT_AND_EMPTY_INDEX_REQUIRED');
 const p=json(root+'/preservation-final-commit397.json');if(p.latestCompleteSealedPayloads.length!==42||p.p3Preserved!==26)throw Error('FULL_PRESERVATION_REQUIRED');
 const owned=json(root+'/owned-source.json').paths,source=json(root+'/snapshot397.json');
 for(const path of owned){const row=source.files.find(row=>row.path===path);if(!row||hash(fs.readFileSync(path))!==row.sha256)throw Error('EXACT_FINAL_OWNED_SOURCE_REQUIRED:'+path)}
 const productPaths=git(['diff','HEAD','--name-only','-z','--',...owned]).toString().split('\0').filter(Boolean).sort();
 if(owned.length!==34||productPaths.length!==12||productPaths.some(path=>!owned.includes(path)))throw Error('EXACT_CURRENT_OWNED_DIFF_REQUIRED');
 const names=[...productPaths,...git(['diff','HEAD','--name-only','-z','--',root]).toString().split('\0'),...git(['ls-files','--others','--exclude-standard','-z','--',root]).toString().split('\0')].filter(Boolean);
 const excluded=[root+'/commit-owned-final.json',root+'/commit-final-readback.json',root+'/native-r1/a10-uncommitted-stop-notice.native.png',root+'/native-r1/sealed-evidence.json'];
 const rows=[...new Set(names)].filter(path=>!path.endsWith('.log')&&!excluded.includes(path)).sort().map(path=>{if(!path.startsWith(root+'/')&&!productPaths.includes(path))throw Error('UNEXPECTED_OWNED_PATH:'+path);return {...ident(path),oid:blobOid(fs.readFileSync(path))}});
 if(rows.length<100)throw Error('INCOMPLETE_B5_SET');
 fs.writeFileSync(root+'/commit-owned-final.json',JSON.stringify({at:new Date().toISOString(),parent,rows,productPaths,scope:'B5 meaningful public feedback and bounded original time checkpoints, original rules and complete history preserved; goal/U6 remain active; ignored logs retained locally'},null,2)+'\n',{flag:'wx'});
 git(['add','--',...rows.map(row=>row.path)]);proof(rows);
 const actual=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort();if(JSON.stringify(actual)!==JSON.stringify(rows.map(row=>row.path)))throw Error('EXACT_STAGED_SET_REQUIRED');
 console.log({rows:rows.length,sourceFiles:productPaths.length,exactStagedBytesAndModes:true,parent});
}else if(mode==='readback'){
 const m=json(root+'/commit-owned-final.json'),head=git(['rev-parse','HEAD']).toString().trim();
 if(git(['rev-parse','HEAD^']).toString().trim()!==parent||head===parent||git(['diff','--cached','--name-only']).toString().trim())throw Error('COMMIT_PARENT_AND_EMPTY_INDEX_REQUIRED');
 const paths=git(['diff-tree','--no-commit-id','--name-only','-r','-z',head]).toString().split('\0').filter(Boolean).sort();if(JSON.stringify(paths)!==JSON.stringify(m.rows.map(row=>row.path)))throw Error('EXACT_COMMIT_PATHS_REQUIRED');
 for(const row of m.rows)if(hash(fs.readFileSync(row.path))!==row.sha256)throw Error('OWNED_WORKTREE_CHANGED:'+row.path);
 const result={at:new Date().toISOString(),commit:head,parent,...proof(m.rows,head),exactCommitPaths:true,indexEmpty:true,productSourceFiles:m.productPaths.length,pushed:false};fs.writeFileSync(root+'/commit-final-readback.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(result);
}else throw Error('EXPLICIT_STAGE_OR_READBACK_REQUIRED');
