import fs from 'node:fs';import {spawnSync} from 'node:child_process';import {assertBrowserEvidenceWritable as guard} from '../../../scripts/browser_evidence_guard.mjs';
const root='goal-1/evidence/t17-acceptance-29';guard(root);
const cases=[
 ['src/ui/player-thread.test.ts','keeps the technical_employee actual first-order stages and atomic payment tied to one original contract'],
 ['src/ui/player-thread.test.ts','keeps the content_employee actual first-order stages and atomic payment tied to one original contract'],
 ['src/ui/player-thread.test.ts','preserves the real declined first-order exit without a success, reward or replacement order'],
 ['src/ui/player-thread.test.ts','lets a free life retain real work and salary without making it exclusive with the manual order'],
 ['src/ui/player-thread.test.ts','follows explicit saved first-order choices while work and time do not steal another intended object'],
 ['src/ui/player-thread.test.ts','recovers the last explicit non-work life-last source among real arrangements while an automatic invitation never steals it'],
 ['src/ui/player-thread.test.ts','recovers the last explicit non-work market-last source among real arrangements while an automatic invitation never steals it'],
 ['src/ui/today-thread.test.ts','keeps a real first salary active, then separates the quarter result from old history without renewing work'],
 ['src/ui/today-thread.test.ts','carries an actual rest job across a quarter and only calls its later public completion a result']
];const results=[];for(const [i,[file,title]] of cases.entries()){const name='isolated-timeout-r1-'+(i+1),r=spawnSync('rtk',['proxy','node',root+'/run-step-r1.mjs',name,'node_modules/.bin/vitest','run',file,'--maxWorkers=1','-t','^'+title+'$'],{maxBuffer:8*1024*1024});guard(root);fs.writeFileSync(root+'/'+name+'.wrapper.stdout.log',r.stdout,{flag:'wx'});fs.writeFileSync(root+'/'+name+'.wrapper.stderr.log',r.stderr,{flag:'wx'});const row={file,title,step:name,exitCode:r.status,signal:r.signal,originalDefaultTimeoutUnchanged:true};results.push(row);console.log(JSON.stringify(row));}guard(root);fs.writeFileSync(root+'/isolated-timeouts-r1.result.json',JSON.stringify({at:new Date().toISOString(),cases:results,allPassed:results.every(r=>r.exitCode===0),sourceAssertionsAndExplicitLimitsUnchanged:true,noGlobalTimeoutOverride:true},null,2)+'\n',{flag:'wx'});process.exitCode=results.every(r=>r.exitCode===0)?0:1;
