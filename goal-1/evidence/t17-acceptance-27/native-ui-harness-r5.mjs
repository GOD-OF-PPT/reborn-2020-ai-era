import {appendFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {assertBrowserEvidenceWritable as guard} from '../../../scripts/browser_evidence_guard.mjs';

// Imported only by CUA. Every UI action uses the supplied documented tab API.
// It never reads a browser profile, storage API, app controller, or hidden state.
export function nativeUiHarness(tab,directory){
 guard(directory);
 const label=value=>{if(typeof value!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(value))throw Error('SINGLE_FILENAME_LABEL_REQUIRED');return value;};
 const journal=async value=>{guard(directory);await appendFile(directory+'/native-progress.jsonl',JSON.stringify({at:new Date().toISOString(),...value})+'\n');};
 const brief=()=>tab.playwright.evaluate(()=>({screen:document.querySelector('.game-app')?.getAttribute('data-screen'),save:document.querySelector('.save-badge')?.textContent,dialogs:Array.from(document.querySelectorAll('dialog')).map(e=>e.querySelector('h2')?.textContent),rawLength:document.querySelector('pre[aria-label="完整存档原文"]')?.textContent?.length??0,hasCandidate:!!document.querySelector('.unsaved-banner')}));
 const observe=async()=>{const state=await brief();return state.rawLength?state:await tab.playwright.domSnapshot();};
 const click=async(name,dialog)=>{
  guard(directory);let error=null;
  try{const root=dialog?tab.playwright.getByRole('dialog',{name:dialog,exact:true}):tab.playwright;await root.getByRole('button',{name,exact:true}).click();}catch(e){error=String(e);}
  const observed=await observe();await journal({action:name,dialog:dialog??null,error,observed});return observed;
 };
 const closeDialog=async name=>{
  guard(directory);let error=null;
  try{await tab.playwright.getByRole('dialog',{name,exact:true}).getByRole('button',{name:'关闭对话框',exact:true}).click();}catch(e){error=String(e);}
  const state=await brief();await journal({action:'Close observed dialog '+name,error,observed:state});if(state.dialogs.includes(name))throw Error('DIALOG_STILL_OPEN:'+name);return state;
 };
 const shot=async name=>{
  label(name);guard(directory);const observed=await observe();await writeFile(directory+'/'+name+'.ax.txt',typeof observed==='string'?observed:JSON.stringify(observed,null,2)+'\n',{flag:'wx'});
  const bytes=await tab.screenshot({fullPage:false});guard(directory);await writeFile(directory+'/'+name+'.png',bytes,{flag:'wx'});return {bytes,path:directory+'/'+name+'.png'};
 };
 const readRaw=async(name,origin,source)=>{
  label(name);guard(directory);const length=await tab.playwright.evaluate(()=>document.querySelector('pre[aria-label="完整存档原文"]')?.textContent?.length??0);if(!length)throw Error('VISIBLE_FULL_RAW_REQUIRED');
  const chunks=[];for(let start=0;start<length;start+=150000){const end=Math.min(length,start+150000),part=await tab.playwright.evaluate(({start,end})=>document.querySelector('pre[aria-label="完整存档原文"]')?.textContent?.slice(start,end)??null,{start,end});if(typeof part!=='string'||part.length!==end-start)throw Error('RAW_CHUNK_LENGTH_MISMATCH');chunks.push(part);}
  const raw=chunks.join(''),run=JSON.parse(raw),row={file:name+'.json',origin,source,bytes:Buffer.byteLength(raw),sha256:createHash('sha256').update(raw).digest('hex'),runId:run.runId,revision:run.revision};
  guard(directory);await writeFile(directory+'/'+row.file,raw,{flag:'wx'});guard(directory);await appendFile(directory+'/exports.jsonl',JSON.stringify(row)+'\n');return {row,raw};
 };
 const fillImport=async text=>{
  guard(directory);const root=tab.playwright.getByRole('dialog',{name:'本机存档与备份',exact:true});
  const initial=await tab.playwright.evaluate(()=>document.querySelector('.save-text-pages .field-help')?.textContent??'');if(!/共0字/.test(initial))throw Error('EMPTY_VISIBLE_IMPORT_REQUIRED');
  let length=0,steps=0;while(length<text.length){
   guard(directory);const pages=Math.max(1,Math.ceil(length/240)),start=(pages-1)*240,end=Math.min(text.length,start+24000);
   await root.getByRole('spinbutton',{name:'存档文本片段',exact:true}).fill(String(pages));await root.getByRole('textbox',{name:'存档内容',exact:true}).fill(text.slice(start,end));
   const observed=await tab.playwright.evaluate(()=>document.querySelector('.save-text-pages .field-help')?.textContent??''),match=observed.match(/共([\d,]+)字/);if(!match||Number(match[1].replaceAll(',',''))!==end)throw Error('VISIBLE_IMPORT_LENGTH_MISMATCH:'+observed);length=end;steps++;
  }
  await journal({action:'Fill original visible import in bounded fragments',characters:length,steps,notYetImported:true});return {characters:length,steps};
 };
 return {tab,directory,journal,brief,observe,click,closeDialog,shot,readRaw,fillImport};
}
