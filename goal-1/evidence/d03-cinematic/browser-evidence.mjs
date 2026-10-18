// Called only from cua_repl with its documented tab API. No direct browser connection.
import {writeFile,appendFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'

const sha=value=>createHash('sha256').update(value).digest('hex')
const safe=label=>{if(!/^[a-z0-9-]+$/.test(label))throw Error('INVALID_EVIDENCE_LABEL');return label}
export function recorder(tab,root,{source,runtime,journal='final'}){
 const save=async(label,value)=>writeFile(root+'/'+safe(label)+'.json',JSON.stringify(value,null,2)+'\n',{flag:'wx'})
 async function capture(label){
  safe(label)
  const before=await tab.playwright.evaluate(()=>({viewport:[innerWidth,innerHeight],scroll:[scrollX,scrollY],overflow:document.documentElement.scrollWidth>innerWidth,screen:document.querySelector('.game-app').getAttribute('data-screen'),hud:document.querySelector('.run-bar')?.innerText??null,text:document.querySelector('.game-app').innerText,ariaLabels:[...document.querySelectorAll('[aria-label]')].map(e=>e.getAttribute('aria-label')),images:[...document.images].map(i=>({src:i.getAttribute('src'),complete:i.complete,width:i.naturalWidth,height:i.naturalHeight})),textOnly:document.querySelector('.game-app').classList.contains('text-mode'),reducedMotion:document.querySelector('.game-app').classList.contains('reduced-motion'),focus:document.activeElement?.textContent?.slice(0,150),buttons:[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length>0).map(e=>({name:e.innerText,disabled:e.disabled,top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom}))}))
  const ax=await tab.getAXState({emit:false,disableDiffing:true}),bytes=await tab.getScreenshot({emit:false}),after=await tab.playwright.evaluate(()=>({viewport:[innerWidth,innerHeight],scroll:[scrollX,scrollY]}))
  if(bytes[0]!==255||bytes[1]!==216)throw Error('NATIVE_JPEG_REQUIRED')
  const row={label,source,runtime,before,after,viewportStable:JSON.stringify(before.viewport)===JSON.stringify(after.viewport),image:label+'.jpg',sha256:sha(bytes)}
  await writeFile(root+'/'+label+'.jpg',bytes,{flag:'wx'});await writeFile(root+'/'+label+'.ax.txt',ax,{flag:'wx'});await save(label,row)
  await appendFile(root+'/'+journal+'-browser-captures.jsonl',JSON.stringify(row)+'\n')
  return row
 }
 async function check(id,row,checks){
  if(Object.values(checks).some(v=>typeof v!=='boolean'))throw Error('EXPLICIT_BOOLEAN_CHECKS_REQUIRED')
  const result={id,capture:row.label,source:row.source,runtime:row.runtime,checks,pass:Object.values(checks).every(v=>v===true)}
  await appendFile(root+'/'+journal+'-native-checks.jsonl',JSON.stringify(result)+'\n');return result
 }
 async function exportOpen(label){
  safe(label)
  const field=tab.playwright.locator('.dialog textarea'),length=await field.evaluate(e=>e.value.length);let raw=''
  for(let i=0;i<length;i+=50000)raw+=await field.evaluate((e,a)=>e.value.slice(a[0],a[1]),[i,i+50000])
  if(raw.length!==length)throw Error('INCOMPLETE_VISIBLE_EXPORT')
  const value=JSON.parse(raw)
  await writeFile(root+'/'+label+'.json',raw,{flag:'wx'})
  const row={label,file:label+'.json',bytes:Buffer.byteLength(raw),sha256:sha(raw),runId:value.runId??value.run?.runId??null,source,runtime}
  await appendFile(root+'/'+journal+'-exports.jsonl',JSON.stringify(row)+'\n')
  await tab.playwright.getByRole('button',{name:'关闭对话框',exact:true}).click();await tab.getAXState({emit:false});return row
 }
 return {capture,check,exportOpen,save}
}
export async function chooseFile(tab,path){
 const pending=tab.playwright.waitForEvent('filechooser',{timeoutMs:10000}).then(value=>({value}),error=>({error}))
 await tab.playwright.locator('input[type="file"]').click()
 const result=await pending;if(result.error)throw result.error
 await result.value.setFiles([path])
}
