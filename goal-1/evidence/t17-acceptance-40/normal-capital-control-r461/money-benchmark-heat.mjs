import fs from'node:fs';import path from'node:path';import{pathToFileURL}from'node:url';import{performance}from'node:perf_hooks';
const root='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461/money-sum-r464',implementations=[];
for(const revision of [464,465,466]){const s=JSON.parse(fs.readFileSync(root+'/snapshot'+revision+'.json','utf8'));implementations.push({revision,fn:(await import(pathToFileURL(path.join(s.target,'src/core/money.ts')).href)).sumMoney})}
const vectors=Array.from({length:32},(_,n)=>[...Array.from({length:1000},(_,i)=>i%2?-200:200),n]),rows=[];
for(const implementation of implementations){const start=performance.now();for(let n=0;n<20000;n++)implementation.fn(vectors[n%32],true);console.log({phase:'warm',revision:implementation.revision,wallMs:performance.now()-start})}
for(let sample=0;sample<3;sample++)for(const implementation of sample%2?[...implementations].reverse():implementations){const start=performance.now(),cpu=process.cpuUsage();let sink=0;for(let n=0;n<10000;n++)sink+=implementation.fn(vectors[n%32],true);const used=process.cpuUsage(cpu);const row={sample,revision:implementation.revision,wallMs:performance.now()-start,cpuUserMs:used.user/1000,sink};rows.push(row);console.log(row)}
if(rows.some(r=>r.sink!==rows[0].sink))throw Error('RESULT_CHANGED');
fs.writeFileSync(root+'/long-array-heat.json',JSON.stringify({at:new Date().toISOString(),warmCalls:20000,measuredCalls:10000,length:1001,rows,compatibility:0,newCommands:0,microbenchmarkOnly:true},null,2)+'\n',{flag:'wx'});
