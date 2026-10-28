import fs from 'node:fs';
import {spawn} from 'node:child_process';
import {ident} from '../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
const root='goal-1/evidence/t17-acceptance-39',inventory=JSON.parse(fs.readFileSync(root+'/cumulative-inventory-r104.json'));
if(process.version!=='v22.12.0'||inventory.selectedCount!==226||inventory.compatibility!==0)throw Error('PINNED_CURRENT_INVENTORY_REQUIRED');
for(const f of inventory.files){const n=ident(f.path);if(['bytes','sha256','mode'].some(k=>n[k]!==f[k]))throw Error('TEST_SOURCE_CHANGED:'+f.path);}
const node='/Users/gordon/.nvm/versions/node/v22.12.0/bin/node';
const child=spawn('rtk',['proxy',node,root+'/run-step-r1.mjs','cumulative-r104',node,'node_modules/vitest/vitest.mjs','run',...inventory.files.map(f=>f.path),'--reporter=json','--outputFile='+root+'/cumulative-r104.vitest.json'],{stdio:'inherit'});
child.once('error',e=>{console.error(e);process.exitCode=1});child.once('close',(code,signal)=>{console.log(JSON.stringify({wrapper:'cumulative-r104',exitCode:code,signal}));process.exitCode=code??1});
