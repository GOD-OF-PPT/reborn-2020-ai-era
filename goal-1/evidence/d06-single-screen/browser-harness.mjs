import {readFile,writeFile,appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {existsSync} from 'node:fs';
export function assertEvidenceWritable(root){if(existsSync(root+'/sealed-evidence.json'))throw Error('EVIDENCE_SEALED_USE_NEW_ROOT');}

export function bind(tab,cdp,root,source){
 const dom=async expression=>{const result=await cdp.send('Runtime.evaluate',{expression,returnByValue:true});if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));return result.result.value};
 const read=()=>dom(`(()=>{const top=[...document.querySelectorAll('dialog[open]')].at(-1),root=top||document;return {screen:document.querySelector('[data-screen]')?.getAttribute('data-screen'),date:document.querySelector('.date-label')?.textContent,cash:document.querySelector('.run-numbers strong')?.textContent,save:document.querySelector('.save-badge')?.getAttribute('aria-label'),dialogs:[...document.querySelectorAll('dialog[open] .dialog-heading h2')].map(e=>e.textContent),books:[...root.querySelectorAll('.screen-book')].filter(e=>e.getClientRects().length).map(e=>({name:e.getAttribute('aria-label'),page:Number(e.dataset.page),pages:Number(e.dataset.pages)}))}})()`);
 const journal=async(row)=>{assertEvidenceWritable(root);return appendFile(root+'/native-progress.jsonl',JSON.stringify({source,...row})+'\n')};
 const click=async name=>{
  assertEvidenceWritable(root);
  const before=await read();
  if(before.dialogs.length)await tab.playwright.locator('dialog[open]').last().locator('.book-flow[style*="--book-width"]').waitFor({state:'attached',timeoutMs:10000});
  const info=await dom(`(()=>{const top=[...document.querySelectorAll('dialog[open]')].at(-1),root=top||document;
   const text=n=>n.nodeType===3?n.textContent:n.nodeType===1&&n.getAttribute('aria-hidden')!=='true'?[...n.childNodes].map(text).join(''):'';
   const buttons=[...root.querySelectorAll('button')].filter(e=>(e.getAttribute('aria-label')||text(e)).replace(/\\s+/g,' ').trim()===${JSON.stringify(name)});
   if(buttons.length!==1)return {count:buttons.length};const e=buttons[0],b=e.closest('.screen-book'),f=b?.querySelector('.book-flow'),v=b?.querySelector('.book-viewport');
   if(!b||!f.contains(e))return {page:null};if(!e.getClientRects().length)return {count:'not rendered'};return {page:Math.max(1,Math.floor((e.getClientRects()[0].left-f.getBoundingClientRect().left+1)/(v.getBoundingClientRect().width+48))+1),current:Number(b.dataset.page),pages:Math.max(1,Math.ceil((f.scrollWidth+48-1)/(v.getBoundingClientRect().width+48))),book:b.getAttribute('aria-label')};})()`);
  if(info.count!==undefined)throw Error('VISIBLE_BUTTON_COUNT '+name+' '+info.count);
  if(info.page!==null&&info.page!==info.current){const book=tab.playwright.getByRole('region',{name:info.book,exact:true});await book.locator('.book-page-counter input[max="'+info.pages+'"]').waitFor({state:'attached',timeoutMs:10000});await book.getByLabel(info.book.replace(' · 翻页阅读','')+'页码',{exact:true}).fill(String(info.page),{timeoutMs:10000});await tab.getAXState({emit:false})}
  const current=await read(),scope=current.dialogs.length?tab.playwright.locator('dialog[open]').last():tab.playwright;
  let observationError=null;try{await scope.getByRole('button',{name,exact:true}).click({timeoutMs:15000})}catch(error){if(!/Timed out.*CDP command Input\./s.test(String(error)))throw error;observationError=String(error)}
  if(name==='只读翻阅完整原文')await tab.playwright.locator('.full-save-text').waitFor({state:'attached',timeoutMs:15000});else await tab.getAXState({emit:false});const after=await read();await journal({action:name,before,after,observationError,policy:'No blind repeat of a submitted mutation'});return after;
 };
 const exportRaw=async (label,origin='product_export')=>{
  await click('只读翻阅完整原文');
  const length=await dom(`document.querySelector('.full-save-text')?.textContent.length`);if(!Number.isSafeInteger(length)||length<1)throw Error('NO_PUBLIC_RAW_TEXT');
  let raw='';for(let start=0;start<length;start+=48000){const chunk=await dom(`document.querySelector('.full-save-text').textContent.slice(${start},${start+48000})`);if(chunk.length!==Math.min(48000,length-start))throw Error('RAW_CHUNK_LENGTH');raw+=chunk}
  if(length>20000)await tab.playwright.locator('dialog[open]').last().locator('.screen-book:not([data-pages="1"])').waitFor({state:'attached',timeoutMs:15000});
  const rawGeometry=await geometry();
  const parsed=JSON.parse(raw),row={origin,rawGeometry,label,file:label+'.json',bytes:Buffer.byteLength(raw),sha256:createHash('sha256').update(raw).digest('hex'),runId:parsed.runId,revision:parsed.revision,source,method:(origin==='import_buffer'?'Public product import text buffer before inspection/import':'Original public product saved/candidate/library export')+' -> explicit readonly full-text book -> complete visible DOM text in bounded chunks. No hidden controller, browser internals or filesystem download discovery.'};
  await writeFile(root+'/'+row.file,raw,{flag:'wx'});await appendFile(root+'/exports.jsonl',JSON.stringify(row)+'\n');await tab.pressKey(null,'Escape');await tab.getAXState({emit:false});return row;
 };
 const geometry=()=>dom(`(()=>{const top=[...document.querySelectorAll('dialog[open]')].at(-1),root=top||document;
  const closed=e=>{const d=e.closest('details:not([open])');return !!d&&(d.querySelector(':scope > summary')!==e||!!d.parentElement?.closest('details:not([open])'))};
  return {outsideViewport:[...root.querySelectorAll('button,a[href],input,select,textarea,summary')].filter(e=>!e.inert&&e.getClientRects().length&&!e.matches('.skip-link')&&!closed(e)).filter(e=>{const r=e.getBoundingClientRect();return r.left< -1||r.right>innerWidth+1||r.top< -1||r.bottom>innerHeight+1}).map(e=>({name:e.getAttribute('aria-label')||e.textContent?.slice(0,50),rect:e.getBoundingClientRect().toJSON()})),viewport:[innerWidth,innerHeight],scroll:[scrollX,scrollY],documentSize:[document.documentElement.scrollWidth,document.documentElement.scrollHeight],scrollingPanels:[...root.querySelectorAll('*')].filter(e=>{const s=getComputedStyle(e);return /(auto|scroll)/.test(s.overflowY)&&e.scrollHeight>e.clientHeight+1&&e.getClientRects().length}).map(e=>({tag:e.tagName,class:e.className,height:e.clientHeight,content:e.scrollHeight})),books:[...root.querySelectorAll('.screen-book')].filter(b=>b.getClientRects().length).map(b=>{const v=b.querySelector('.book-viewport').getBoundingClientRect();return {name:b.getAttribute('aria-label'),page:b.dataset.page,pages:b.dataset.pages,viewport:v.toJSON(),unreachableControls:[...b.querySelectorAll('.book-flow button,.book-flow input,.book-flow select,.book-flow textarea,.book-flow summary')].filter(e=>!closed(e)&&e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect(),f=b.querySelector('.book-flow').getBoundingClientRect(),column=Math.floor((r.left-f.left+1)/(v.width+48));return r.height>v.height+1||r.top<v.top-1||r.bottom>v.bottom+1||r.width>v.width+1||r.right-f.left>column*(v.width+48)+v.width+1}).map(e=>({name:e.getAttribute('aria-label')||e.textContent?.slice(0,60),rect:e.getBoundingClientRect().toJSON()})),offPageTabStops:[...b.querySelectorAll('.book-flow button,.book-flow input,.book-flow select,.book-flow textarea,.book-flow summary')].filter(e=>!e.inert&&e.tabIndex>=0&&!e.matches(':disabled')&&e.getClientRects().length).filter(e=>{const r=e.getBoundingClientRect();return r.left<v.left-1||r.right>v.right+1||r.top<v.top-1||r.bottom>v.bottom+1}).map(e=>e.getAttribute('aria-label')||e.textContent?.slice(0,60))}})}})()`);
 return {dom,read,click,exportRaw,geometry,journal};
}

export async function importText(tab,cdp,root,source,path,label,{startAt=0,maxChunks=12,mode='new'}={}){
 assertEvidenceWritable(root);
 const h=bind(tab,cdp,root,source),raw=await readFile(path,'utf8'),steps=[];
 const position=await h.dom(`(()=>{const e=[...document.querySelectorAll('dialog[open] textarea')].at(-1),b=e.closest('.screen-book'),f=b.querySelector('.book-flow'),v=b.querySelector('.book-viewport');return {page:Math.floor((e.getBoundingClientRect().left-f.getBoundingClientRect().left+1)/(v.getBoundingClientRect().width+48))+1,current:Number(b.dataset.page)}})()`);
 for(let n=position.current;n<position.page;n++)await h.click('下一页 →');
 const scope=tab.playwright.locator('dialog[open]').last(),box=scope.getByRole('textbox',{name:'存档内容',exact:true}),index=scope.getByLabel('存档文本片段',{exact:true});
 let next=startAt;
 for(let start=startAt;start<Math.min(raw.length,startAt+maxChunks*48000);start+=48000){
  const chunk=raw.slice(start,start+48000);if(start===0)await box.fill(chunk,{timeoutMs:15000});else{await index.fill(String(Math.ceil(start/240)),{timeoutMs:15000});await box.type(chunk,{timeoutMs:15000})}
  const count=await h.dom(`(()=>{const e=[...document.querySelectorAll('dialog[open] .save-text-pages')].at(-1);return Number(e?.textContent.match(/完整文本共\\s*([0-9,]+)\\s*字/)?.[1]?.replaceAll(',',''))})()`),expected=Math.min(start+48000,raw.length);
  steps.push({expected,count});if(count!==expected)throw Error('VISIBLE_IMPORT_COUNT '+JSON.stringify(steps.at(-1)));next=expected;
 }
 if(next<raw.length){await h.journal({action:'partial text import, not submitted',path,label,next,steps});return {complete:false,next,steps}}
 const exported=await h.exportRaw(label+'-text-before-import','import_buffer');if(exported.sha256!==createHash('sha256').update(raw).digest('hex'))throw Error('PUBLIC_IMPORT_TEXT_BYTES_MISMATCH');
 await h.click('检查存档');await h.click(mode==='restore'?'确认恢复这份同一人生存档':'确认导入为独立人生');const expectedRevision=JSON.parse(raw).revision;await tab.playwright.locator('.save-badge[aria-label="已保存，第'+expectedRevision+'次提交"]').waitFor({state:'visible',timeoutMs:20000});const after=await h.read();await h.journal({action:mode==='restore'?'restore actual public text':'import actual public text',path,label,steps,after});return {complete:true,steps,sha256:exported.sha256,after};
}
