import fs from 'node:fs';import cp from 'node:child_process';
const root='goal-1/evidence/t17-acceptance-40/wait-feedback-r373',node='/Users/gordon/.nvm/versions/node/v22.12.0/bin/node';
if(fs.existsSync(root+'/stopped.json')||fs.existsSync(root+'/native-r1/stopped.json'))throw Error('ACTIVE_ROOT_REQUIRED');
const stdout=fs.openSync(root+'/large-budget-fixed.stdout.log','wx'),stderr=fs.openSync(root+'/large-budget-fixed.stderr.log','wx'),args=['--experimental-strip-types',root+'/large-budget-fixed.ts'],started=Date.now();
const result=await new Promise(resolve=>{const child=cp.spawn(node,args,{env:{...process.env,PATH:'/Users/gordon/.nvm/versions/node/v22.12.0/bin:'+process.env.PATH},stdio:['ignore',stdout,stderr]});child.on('error',error=>resolve({exitCode:null,error:String(error)}));child.on('close',(exitCode,signal)=>resolve({exitCode,signal}))});
fs.closeSync(stdout);fs.closeSync(stderr);const report={at:new Date().toISOString(),...result,wallMs:Date.now()-started,args,compatibility:0,wholeU6Complete:false};fs.writeFileSync(root+'/large-budget-fixed.result.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(report);if(result.exitCode!==0)process.exitCode=1;
