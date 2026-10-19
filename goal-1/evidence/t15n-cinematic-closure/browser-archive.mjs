import {writeFile,appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const timedInput=e=>/Timed out.*CDP command Input\./s.test(String(e));
async function press(tab,name,observations){try{await tab.playwright.getByRole('button',{name,exact:true}).press('Enter',{timeoutMs:15000})}catch(e){if(!timedInput(e))throw e;observations.push({name,inputObservation:String(e),policy:'Observe next visible state before any retry; do not resend an applied command.'})}}

/** Only ordinary input through the visible product import dialog; never access a game controller. */
export async function importVisible(tab,cdp,raw){
 const steps=[],box=tab.playwright.getByRole('textbox',{name:'存档内容',exact:true});
 for(let start=0;start<raw.length;start+=48000){const chunk=raw.slice(start,start+48000);if(start===0)await box.fill(chunk,{timeoutMs:10000});else await box.type(chunk,{timeoutMs:10000});const v=(await cdp.send('Runtime.evaluate',{expression:`(()=>{const e=[...document.querySelectorAll('dialog[open] textarea')].at(-1);return e?{length:e.value.length,tail:e.value.slice(-48)}:null})()`,returnByValue:true})).result.value;const expected=Math.min(start+48000,raw.length),matches=v?.length===expected&&v?.tail===raw.slice(0,expected).slice(-48);steps.push({expectedLength:expected,actualLength:v?.length,tailMatches:matches});if(!matches)throw Error('VISIBLE_IMPORT_PREFIX_MISMATCH');}
 await press(tab,'检查存档',steps);await tab.playwright.getByRole('button',{name:'确认导入为独立人生',exact:true}).waitFor({state:'visible',timeoutMs:20000});await press(tab,'确认导入为独立人生',steps);await tab.playwright.locator('dialog[open]').waitFor({state:'detached',timeoutMs:20000});await tab.getAXState({emit:false});return {characters:raw.length,sha256:createHash('sha256').update(raw).digest('hex'),steps,method:'Public product textarea filled/appended in bounded chunks, then original inspection and import buttons; no injected model, extra extension permission or rewritten archive.'};
}

/** Large exports are read only from the actual visible textarea, in bounded transport chunks. */
export async function exportVisible(tab,cdp,root,label,source){
 const length=(await cdp.send('Runtime.evaluate',{expression:`[...document.querySelectorAll('dialog[open] textarea')].at(-1)?.value.length`,returnByValue:true})).result.value;if(!Number.isSafeInteger(length)||length<1)throw Error('NO_VISIBLE_PRODUCT_EXPORT');
 let raw='';for(let start=0;start<length;start+=48000){const chunk=(await cdp.send('Runtime.evaluate',{expression:`[...document.querySelectorAll('dialog[open] textarea')].at(-1)?.value.slice(${start},${start+48000})`,returnByValue:true})).result.value;if(typeof chunk!=='string'||chunk.length!==Math.min(48000,length-start))throw Error('EXPORT_CHUNK_INCOMPLETE');raw+=chunk;}
 if(raw.length!==length)throw Error('EXPORT_LENGTH_MISMATCH');const parsed=JSON.parse(raw),row={label,file:label+'.json',source,bytes:Buffer.byteLength(raw),sha256:createHash('sha256').update(raw).digest('hex'),runId:parsed.runId,revision:parsed.revision,method:'Read-only visible product export textarea, complete bounded chunks; exact raw bytes, not reformatted.'};await writeFile(root+'/'+row.file,raw,{flag:'wx'});await appendFile(root+'/exports.jsonl',JSON.stringify(row)+'\n');await tab.pressKey(null,'Escape');await tab.getAXState({emit:false});return row;
}
