import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';

const root='goal-1/evidence/t17-acceptance-39/original-files-r61';
if(process.version!=='v22.12.0')throw Error('ORIGINAL_NODE22_REQUIRED');
const targets=[
 ['player-thread','src/ui/player-thread.test.ts'],
 ['video-command-details','src/ui/video-command-details.test.tsx'],
 ['relay-quote-effective-wait','src/ui/relay-quote-effective-wait.test.tsx'],
 ['story-agency','src/application/story-agency.test.ts'],
 ['scene-domain-results','src/ui/scene-domain-results.test.ts'],
 ['App.course-workspace','src/ui/App.course-workspace.test.tsx'],
];
const results=[];
for(const [name,file] of targets){
 guard(root);
 const report=root+'/'+name+'.vitest.json';
 if(fs.existsSync(report))throw Error('FRESH_ORIGINAL_FILE_REPORT_REQUIRED');
 const start=Date.now(),argv=['proxy',process.execPath,'node_modules/vitest/vitest.mjs','run',file,'--reporter=json','--outputFile='+report];
 const child=spawn('rtk',argv,{stdio:['ignore','pipe','pipe']});
 fs.writeFileSync(root+'/'+name+'.started.json',JSON.stringify({at:new Date().toISOString(),file,argv:['rtk',...argv],pid:child.pid,originalWholeFile:true,compatibility:0},null,2)+'\n',{flag:'wx'});
 child.stdout.pipe(process.stdout);child.stderr.pipe(process.stderr);
 const outcome=await new Promise(resolve=>{child.once('error',e=>resolve({exitCode:null,error:String(e)}));child.once('close',(exitCode,signal)=>resolve({exitCode,signal}))});
 const row={name,file,...outcome,wallMs:Date.now()-start,report:fs.existsSync(report)?report:null};
 results.push(row);guard(root);fs.writeFileSync(root+'/'+name+'.result.json',JSON.stringify(row,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify(row));
}
guard(root);fs.writeFileSync(root+'/result.json',JSON.stringify({at:new Date().toISOString(),results,compatibility:0},null,2)+'\n',{flag:'wx'});
process.exitCode=results.every(row=>row.exitCode===0)?0:1;
