import fs from 'node:fs'
import path from 'node:path'
import {spawnSync} from 'node:child_process'
import {read,same,bindings,guard,repo,directory} from '../io.mjs'
import {put,correctionOutput} from './io.mjs'
const correctionDirectory=directory+'/readback-correction-r2'
guard(correctionOutput);if(fs.existsSync(path.join(correctionOutput,'command.json'))||fs.existsSync(path.join(correctionOutput,'result.json')))throw Error('ONE_CORRECTED_READBACK_ONLY')
const contract=JSON.parse(read(directory+'/frozen-contract.json').bytes),before=bindings(),started=Date.now(),self=['input.md','plan.md','io.mjs','readback.mjs','run-once.mjs','correction-intent.json'].map(name=>read(correctionDirectory+'/'+name).identity)
for(const key of ['sources','p3','references','dependencies','input','snapshots'])if(!same(before[key],key==='sources'?contract.officialSources:contract[key]))throw Error('ORIGINAL_REMAINING_INPUT_CHANGED:'+key)
put('source-before.json',before)
const args=['proxy','node','--experimental-strip-types',correctionDirectory+'/readback.mjs']
put('command.json',{at:new Date().toISOString(),cwd:repo,command:['rtk',...args],self,originalSuccessfulFullReplay:read(directory+'/report/normal-browser-export-audit.json').identity,originalRedResult:read(directory+'/result.json').identity,scope:'One corrected public readback only. Original full Create audit reused without reexecution; exact profile values compared per field. Other25 assertions unchanged.'})
const execution=spawnSync('rtk',args,{cwd:repo,encoding:'utf8',maxBuffer:32*1024*1024}),terminal={command:['rtk',...args],exitCode:execution.status,signal:execution.signal,error:execution.error?.message??null,wallMs:Date.now()-started}
put('stdout.log',execution.stdout??'');put('stderr.log',execution.stderr??'');put('terminal.json',terminal)
const after=bindings(),freeze=Object.fromEntries(Object.keys(before).map(key=>[key,same(before[key],after[key])])),selfUnchanged=self.every(row=>same(row,read(row.path).identity)),readbackFile=path.join(correctionOutput,'readback-result.json'),readback=fs.existsSync(readbackFile)?JSON.parse(fs.readFileSync(readbackFile,'utf8')):null
put('source-after.json',after)
const passed=terminal.exitCode===0&&terminal.signal===null&&terminal.error===null&&Object.values(freeze).every(Boolean)&&selfUnchanged&&readback?.passed===true&&readback.checkCount===26&&readback.passedChecks===26
const result={at:new Date().toISOString(),passed,terminal,freeze,selfUnchanged,originalRedPreserved:read(directory+'/result.json').identity,originalHelperPreserved:read(directory+'/readback.mjs').identity,readback,fullCreateReexecuted:false,reason:'Original25/26 sole red was order-sensitive profile object comparison, not incorrect product values.'}
put('result.json',result);console.log(JSON.stringify(result));if(!passed)process.exitCode=1
