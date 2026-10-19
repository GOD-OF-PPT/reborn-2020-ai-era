import {writeFile,appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

export function observer(tab,cdp,root,source){
 async function save(name,value){await writeFile(root+'/'+name,JSON.stringify(value,null,2)+'\n',{flag:'wx'});return value;}
 async function capture(label){
  const result=await cdp.send('Runtime.evaluate',{expression:`(()=>({url:location.href,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,scroll:[scrollX,scrollY],screen:document.querySelector('.game-app')?.getAttribute('data-screen'),overflow:document.documentElement.scrollWidth>innerWidth,hud:document.querySelector('.run-bar')?.innerText,text:document.querySelector('main')?.innerText??document.querySelector('#main-content')?.innerText,focus:document.activeElement?.textContent?.slice(0,160),buttons:[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length>0).map(e=>({name:e.innerText,disabled:e.disabled,rect:{x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}})),images:[...document.images].map(i=>({src:i.getAttribute('src'),complete:i.complete,width:i.naturalWidth,height:i.naturalHeight}))}))()`,returnByValue:true});
  if(!result.result?.value)throw Error('NO_VISIBLE_DOM_OBSERVATION');
  const ax=await tab.getAXState({emit:false,disableDiffing:true}),bytes=await tab.getScreenshot({emit:false});
  const ext=bytes[0]===137&&bytes[1]===80?'png':bytes[0]===255&&bytes[1]===216?'jpg':null;if(!ext)throw Error('UNKNOWN_NATIVE_IMAGE');
  const row={label,source,observedAtUtc:new Date().toISOString(),dom:result.result.value,image:label+'.'+ext,sha256:createHash('sha256').update(bytes).digest('hex')};
  await writeFile(root+'/'+row.image,bytes,{flag:'wx'});await writeFile(root+'/'+label+'.ax.txt',ax,{flag:'wx'});await save(label+'.json',row);await appendFile(root+'/captures.jsonl',JSON.stringify(row)+'\n');return row;
 }
 async function exportOpen(label){
  const result=await cdp.send('Runtime.evaluate',{expression:'(()=>{const e=document.querySelector(".dialog textarea");return e?[e.value.length,e.value]:null})()',returnByValue:true});
  const value=result.result?.value;if(!Array.isArray(value)||typeof value[1]!=="string"||value[0]!==value[1].length)throw Error('INCOMPLETE_VISIBLE_EXPORT');
  const raw=value[1],parsed=JSON.parse(raw);await writeFile(root+'/'+label+'.json',raw,{flag:'wx'});
  const row={label,file:label+'.json',source,bytes:Buffer.byteLength(raw),sha256:createHash('sha256').update(raw).digest('hex'),runId:parsed.runId,revision:parsed.revision,method:'Read-only visible product export textarea; exact length and raw bytes'};
  await appendFile(root+'/exports.jsonl',JSON.stringify(row)+'\n');await tab.pressKey(null,'Escape');await tab.getAXState({emit:false});return row;
 }
 async function check(id,actual,checks){const passed=Object.values(checks).every(v=>v===true);const row={id,source,actual,checks,passed};await appendFile(root+'/checks.jsonl',JSON.stringify(row)+'\n');if(!passed)throw Error('CHECK_FAILED '+id);return row;}
 return {capture,exportOpen,check,save};
}
