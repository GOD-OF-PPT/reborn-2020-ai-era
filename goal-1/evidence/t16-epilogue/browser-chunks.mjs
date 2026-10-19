// The selected tab and buffer are explicit arguments: REPL cell closures must
// never substitute another tab or report a private captured buffer as complete.
export async function inputBatch(tab,raw,startAt=0,maxChunks=6){
 const scope=tab.playwright.locator('dialog[open]').last(),box=scope.getByRole('textbox',{name:'存档内容',exact:true}),index=scope.getByLabel('存档文本片段',{exact:true});let next=startAt;const steps=[];
 for(let start=startAt;start<Math.min(raw.length,startAt+maxChunks*48000);start+=48000){
  const part=raw.slice(start,start+48000);
  if(start===0)await box.fill(part,{timeoutMs:15000});else{await index.fill(String(Math.ceil(start/240)),{timeoutMs:15000});await box.type(part,{timeoutMs:15000});}
  const count=await tab.playwright.evaluate(()=>{const text=[...document.querySelectorAll('dialog[open] .save-text-pages')].at(-1)?.textContent;return Number(text?.match(/完整文本共\s*([0-9,]+)\s*字/)?.[1]?.replaceAll(',',''));});
  next=start+part.length;steps.push({expected:next,count});if(count!==next)throw Error('VISIBLE_INPUT_LENGTH_MISMATCH');
 }
 return {next,total:raw.length,complete:next===raw.length,steps};
}
export async function readBatch(tab,text,total,maxChunks=6){
 for(let n=0;n<maxChunks&&text.length<total;n++){
  const chunk=await tab.playwright.evaluate(start=>document.querySelector('.full-save-text').textContent.slice(start,start+48000),text.length);
  if(chunk.length!==Math.min(48000,total-text.length))throw Error('PUBLIC_RAW_CHUNK_LENGTH_MISMATCH');text+=chunk;
 }
 return text;
}
