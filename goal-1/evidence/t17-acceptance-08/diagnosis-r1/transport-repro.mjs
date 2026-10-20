import {readFileSync,openSync,closeSync,writeFileSync,appendFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url)),payloadPath=root+'transport-payload.json',bytes=readFileSync(payloadPath),payload=bytes.toString('utf8'),expected=createHash('sha256').update(bytes).digest('hex');
const args=['proxy','python3','-c','import sys,hashlib,json; b=sys.stdin.buffer.read(268435457); print(json.dumps({"bytes":len(b),"sha256":hashlib.sha256(b).hexdigest()}),flush=True)'];
writeFileSync(root+'transport-results.jsonl','',{flag:'wx'});
const results=[];
for(const mode of ['pipe','file']){
 const limit=mode==='pipe'?20:4;
 for(let iteration=0;iteration<limit;iteration++){
  let fd=null;const started=Date.now();let row;
  try{
   if(mode==='file')fd=openSync(payloadPath,'r');
   const options={encoding:'utf8',maxBuffer:1024*1024,timeout:8000,...(mode==='pipe'?{input:payload}:{stdio:[fd,'pipe','pipe']})};
   const actual=JSON.parse(execFileSync('rtk',args,options));
   row={mode,iteration,elapsedMs:Date.now()-started,passed:actual.bytes===bytes.length&&actual.sha256===expected,actual,timeout:false};
  }catch(error){row={mode,iteration,elapsedMs:Date.now()-started,passed:false,timeout:error.code==='ETIMEDOUT',code:error.code,signal:error.signal,error:String(error)};}
  finally{if(fd!==null)closeSync(fd);}
  results.push(row);appendFileSync(root+'transport-results.jsonl',JSON.stringify(row)+'\n');console.log(JSON.stringify(row));
  if(!row.passed)break;
 }
}
writeFileSync(root+'transport-summary.json',JSON.stringify({payloadBytes:bytes.length,expectedSha256:expected,results,pipeReproduced:results.some(r=>r.mode==='pipe'&&r.timeout),fileAllPassed:results.filter(r=>r.mode==='file').length===4&&results.filter(r=>r.mode==='file').every(r=>r.passed)},null,2)+'\n',{flag:'wx'});
