import fs from 'node:fs';
import cp from 'node:child_process';
import crypto from 'node:crypto';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';
const root='goal-1/evidence/t17-acceptance-39/popup-delivery-r118';
const expected='14e0debfb0785bbdf58a451dfb86e70e30c657b1';
const git=(...args)=>cp.execFileSync('git',args,{encoding:'utf8'});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
if(git('rev-parse','HEAD').trim()!==expected||git('diff','--cached','--name-only').trim())throw Error('ORIGINAL_HEAD_EMPTY_INDEX_REQUIRED');
const paths=['assets/ui-redesign/cinematic/night-journal-modal-v1.png','src/main.tsx','src/ui/App.tsx','src/ui/Dialog.tsx','src/ui/StoragePanel.tsx','src/ui/confirmation-money.ts','src/ui/relay-station-stop-confirmation.test.tsx','src/ui/night-journal.css'];
const before=paths.map(path=>({path,bytes:fs.statSync(path).size,sha256:sha(fs.readFileSync(path))}));
let app=git('show',expected+':src/ui/App.tsx');
for(const [old,value,count] of [
 ["className={modal.kind==='command'?'command-review':''}","className={modal.kind==='command'?'command-review':modal.kind==='settings'?'display-journal':modal.kind==='storage'?'storage-journal':'safety-journal'}",1],
 ['先看看这项决定要用的钱与时间，再按原安排发生。','先把代价看清，再作决定。',2],
 ["{clockCommand?'日历范围':'执行主体'}","{clockCommand?'日历范围':'由谁承担'}",1]
]){
 if(app.split(old).length-1!==count)throw Error('EXACT_DISPLAY_EDIT_REQUIRED:'+old);
 app=app.replaceAll(old,value);
}
guard(root);fs.writeFileSync(root+'/staged-App.tsx.txt',app,{flag:'wx'});
const blob=cp.execFileSync('git',['hash-object','-w','--stdin'],{input:app,encoding:'utf8'}).trim();
git('add','--',...paths.filter(p=>p!=='src/ui/App.tsx'));
git('update-index','--add','--cacheinfo','100644',blob,'src/ui/App.tsx');
const actual=git('diff','--cached','--name-only').trim().split('\n').sort();
if(JSON.stringify(actual)!==JSON.stringify([...paths].sort()))throw Error('EXACT_EIGHT_INDEX_REQUIRED');
if(before.some(x=>sha(fs.readFileSync(x.path))!==x.sha256))throw Error('WORKTREE_CHANGED');
const report={at:new Date().toISOString(),base:expected,paths,productCount:8,worktreeBefore:before,worktreeUnchanged:true,stagedAppSha256:sha(app),stagedAppBlob:blob,stagedAppIsDisplayEditsOnly:true,completeCUX09:false,independentEightFileBuildRun:false,workingTreeBuild24AndTestsReused:true,p3Staged:0,mastersStaged:0,compatibility:0};
guard(root);fs.writeFileSync(root+'/stage.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
guard(root);fs.writeFileSync(root+'/staged.diff',git('diff','--cached','--no-ext-diff'),{flag:'wx'});
console.log(JSON.stringify({staged:actual.length,base:expected,worktreeUnchanged:true,taskComplete:false}));
