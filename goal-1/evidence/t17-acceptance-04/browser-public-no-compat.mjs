import {readFile,writeFile,appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {bind,assertEvidenceWritable} from '../d06-single-screen/browser-harness.mjs';

// Same public text workflow as the sealed D06 helper, without its geometry audit.
// Call only inside the CUA runtime. No browser internals or hidden application state.
export function bindPublicExport(tab,cdp,root,source){
 const h=bind(tab,cdp,root,source);
 const exportRaw=async(label,origin='product_export')=>{
  assertEvidenceWritable(root);await h.click('只读翻阅完整原文');
  const length=await h.dom('document.querySelector(".full-save-text")?.textContent.length');
  if(!Number.isSafeInteger(length)||length<1)throw Error('NO_PUBLIC_RAW_TEXT');
  let raw='';for(let start=0;start<length;start+=48000){
   const chunk=await h.dom(`document.querySelector('.full-save-text').textContent.slice(${start},${start+48000})`);
   if(chunk.length!==Math.min(48000,length-start))throw Error('RAW_CHUNK_LENGTH');raw+=chunk;
  }
  const parsed=JSON.parse(raw),row={origin,label,file:label+'.json',bytes:Buffer.byteLength(raw),sha256:createHash('sha256').update(raw).digest('hex'),revision:parsed.revision,source,method:'Public product text buffer/export -> original full-text book DOM in bounded chunks; no geometry, viewport, hidden controller, storage injection or compatibility checks.'};
  await writeFile(root+'/'+row.file,raw,{flag:'wx'});await appendFile(root+'/exports.jsonl',JSON.stringify(row)+'\n');
  await tab.pressKey(null,'Escape');await tab.getAXState({emit:false});return row;
 };
 const importText=async(path,label,{startAt=0,maxChunks=10,mode='new'}={})=>{
  assertEvidenceWritable(root);const raw=await readFile(path,'utf8'),scope=tab.playwright.locator('dialog[open]').last();
  const box=scope.getByRole('textbox',{name:'存档内容',exact:true}),index=scope.getByLabel('存档文本片段',{exact:true}),steps=[];
  let next=startAt;
  for(let start=startAt;start<Math.min(raw.length,startAt+maxChunks*48000);start+=48000){
   const chunk=raw.slice(start,start+48000);if(start===0)await box.fill(chunk,{timeoutMs:15000});else{await index.fill(String(Math.ceil(start/240)),{timeoutMs:15000});await box.type(chunk,{timeoutMs:15000})}
   const count=await h.dom(`(()=>{const e=[...document.querySelectorAll('dialog[open] .save-text-pages')].at(-1);return Number(e?.textContent.match(/完整文本共\\s*([0-9,]+)\\s*字/)?.[1]?.replaceAll(',',''))})()`),expected=Math.min(start+48000,raw.length);
   steps.push({expected,count});if(count!==expected)throw Error('VISIBLE_IMPORT_COUNT '+JSON.stringify(steps.at(-1)));next=expected;
  }
  if(next<raw.length){await h.journal({action:'partial public text import, not submitted',path,label,next,steps});return {complete:false,next,steps}}
  const exported=await exportRaw(label+'-text-before-import','import_buffer');if(exported.sha256!==createHash('sha256').update(raw).digest('hex'))throw Error('PUBLIC_IMPORT_BYTES_MISMATCH');
  await h.click('检查存档');await h.click(mode==='restore'?'确认恢复这份同一人生存档':'确认导入为独立人生');
  await tab.playwright.locator('.save-badge[aria-label="已保存，第'+JSON.parse(raw).revision+'次提交"]').waitFor({state:'visible',timeoutMs:20000});
  const after=await h.read();await h.journal({action:'actual public import '+mode,path,label,steps,after});return {complete:true,steps,sha256:exported.sha256,after};
 };
 return {...h,exportRaw,importText};
}
