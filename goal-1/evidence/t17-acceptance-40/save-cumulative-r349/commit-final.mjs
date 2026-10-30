import fs from 'node:fs';
import {json,ident,hash,git,blobOid,proof} from '../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
const root='goal-1/evidence/t17-acceptance-40/save-cumulative-r349',parent='7f1cf70deb7579f1a5c8c3db243af389cf8aa2ff',mode=process.argv[2];
if(mode==='stage'){
  if(git(['rev-parse','HEAD']).toString().trim()!==parent||git(['diff','--cached','--name-only']).toString().trim())throw Error('PINNED_PARENT_EMPTY_INDEX_REQUIRED');
  const p=json(root+'/preservation-before-commit.json');if(p.latestCompleteSealedPayloads.length!==35||p.p3Preserved!==26)throw Error('FULL_PRESERVATION_REQUIRED');
  const productPaths=['src/core/ledger.ts','src/core/ledger-signature-cache.test.ts'];const names=[...productPaths,...git(['diff','HEAD','--name-only','-z','--',root]).toString().split('\0'),...git(['ls-files','--others','--exclude-standard','-z','--',root]).toString().split('\0')].filter(Boolean);
  const rows=[...new Set(names)].sort().map(path=>{if((!path.startsWith(root+'/')&&!productPaths.includes(path))||path.endsWith('.log')||path===root+'/commit-owned-final.json'||path===root+'/commit-final-readback.json')throw Error('UNEXPECTED_OWNED_PATH:'+path);return {...ident(path),oid:blobOid(fs.readFileSync(path))};});
  if(rows.length<50)throw Error('INCOMPLETE_C_B3_SET');
  fs.writeFileSync(root+'/commit-owned-final.json',JSON.stringify({at:new Date().toISOString(),parent,rows,productEdits:2,scope:'C-B3 bounded pure receipt parsing, full original outcome/format and current Native/main proofs; goal/U6 remain active; ignored logs kept locally'},null,2)+'\n',{flag:'wx'});
  git(['add','--',...rows.map(r=>r.path)]);proof(rows);
  const actual=git(['diff','--cached','--name-only','-z']).toString().split('\0').filter(Boolean).sort();if(JSON.stringify(actual)!==JSON.stringify(rows.map(r=>r.path)))throw Error('EXACT_STAGED_SET_REQUIRED');
  console.log(JSON.stringify({rows:rows.length,productEdits:2,exactStagedBytesAndModes:true,parent}));
}else if(mode==='readback'){
  const m=json(root+'/commit-owned-final.json'),head=git(['rev-parse','HEAD']).toString().trim();
  if(git(['rev-parse','HEAD^']).toString().trim()!==m.parent||head===m.parent||git(['diff','--cached','--name-only']).toString().trim())throw Error('COMMIT_PARENT_AND_EMPTY_INDEX_REQUIRED');
  const paths=git(['diff-tree','--no-commit-id','--name-only','-r','-z',head]).toString().split('\0').filter(Boolean).sort();if(JSON.stringify(paths)!==JSON.stringify(m.rows.map(r=>r.path)))throw Error('EXACT_COMMIT_PATHS_REQUIRED');
  for(const r of m.rows)if(hash(fs.readFileSync(r.path))!==r.sha256)throw Error('OWNED_WORKTREE_CHANGED:'+r.path);
  const result={at:new Date().toISOString(),commit:head,parent:m.parent,...proof(m.rows,head),exactCommitPaths:true,indexEmpty:true,productEdits:2,pushed:false};
  fs.writeFileSync(root+'/commit-final-readback.json',JSON.stringify(result,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(result));
}else throw Error('EXPLICIT_STAGE_OR_READBACK_REQUIRED');
