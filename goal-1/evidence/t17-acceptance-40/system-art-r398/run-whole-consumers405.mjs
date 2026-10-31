import fs from 'node:fs';import cp from 'node:child_process';
const root='goal-1/evidence/t17-acceptance-40/system-art-r398',node='/Users/gordon/.nvm/versions/node/v22.12.0/bin/node';
if(fs.existsSync(root+'/stopped.json'))throw Error('ACTIVE_REQUIRED');
const files=JSON.parse(fs.readFileSync(root+'/whole-consumer-files.json','utf8')).files;
const child=cp.spawn(node,[root+'/check-source.mjs','405','r405-whole-consumers',...files],{env:{...process.env,PATH:'/Users/gordon/.nvm/versions/node/v22.12.0/bin:'+process.env.PATH},stdio:'inherit'});child.on('error',e=>{console.error(e);process.exitCode=1});child.on('close',code=>{process.exitCode=code??1});
