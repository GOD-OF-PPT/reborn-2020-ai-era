import {writeFile,appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
export async function readOpenChromeExport(tab,cdp,root,label,runtime){
 if(!/^[a-z0-9-]+$/.test(label))throw Error('INVALID_EVIDENCE_LABEL');
 const result=await cdp.send('Runtime.evaluate',{expression:'(()=>{const e=document.querySelector(".dialog textarea");return e?[e.value.length,e.value]:null})()',returnByValue:true});
 const value=result?.result?.value;if(!Array.isArray(value)||typeof value[1]!=="string"||value[0]!==value[1].length)throw Error('INCOMPLETE_VISIBLE_EXPORT');
 const raw=value[1],parsed=JSON.parse(raw);await writeFile(root+'/'+label+'.json',raw,{flag:'wx'});
 const row={label,file:label+'.json',bytes:Buffer.byteLength(raw),sha256:createHash('sha256').update(raw).digest('hex'),runId:parsed.runId,revision:parsed.revision,source:'source-freeze-c2 unchanged294; Chrome native supplement',runtime,method:'Read-only Runtime.evaluate of the visible product dialog textarea, full length verified; no hidden app state'};
 await appendFile(root+'/chrome-exports.jsonl',JSON.stringify(row)+'\n');await tab.pressKey(null,'Escape');await tab.getAXState({emit:false});return row;
}
