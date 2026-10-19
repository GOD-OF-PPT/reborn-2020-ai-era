import {writeFile,appendFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {recorder} from '../d03-cinematic/browser-evidence.mjs';
export function chromeRecorder(tab,root,runtime){
 const base=recorder(tab,root,{source:'source-freeze-c2 unchanged294; Chrome native supplement',runtime,journal:'chrome'});
 async function capture(label,extra={}){
  if(!/^[a-z0-9-]+$/.test(label))throw Error('INVALID_EVIDENCE_LABEL');
  const before=await tab.playwright.evaluate(()=>({viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,scroll:[scrollX,scrollY],overflow:document.documentElement.scrollWidth>innerWidth,screen:document.querySelector('.game-app').getAttribute('data-screen'),hud:document.querySelector('.run-bar')?.innerText??null,text:document.querySelector('.game-app').innerText,focus:document.activeElement?.textContent?.slice(0,150),bodyZoom:getComputedStyle(document.body).zoom,appZoom:getComputedStyle(document.querySelector('.game-app')).zoom,buttons:[...document.querySelectorAll('button')].filter(e=>e.getClientRects().length>0).map(e=>({name:e.innerText,disabled:e.disabled,top:e.getBoundingClientRect().top,bottom:e.getBoundingClientRect().bottom,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right})),images:[...document.images].map(i=>({src:i.getAttribute('src'),complete:i.complete,width:i.naturalWidth,height:i.naturalHeight}))}));
  const ax=await tab.getAXState({emit:false,disableDiffing:true}),bytes=await tab.getScreenshot({emit:false}),after=await tab.playwright.evaluate(()=>({viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,scroll:[scrollX,scrollY]}));
  const ext=bytes[0]===137&&bytes[1]===80?'png':bytes[0]===255&&bytes[1]===216?'jpg':null;if(!ext)throw Error('UNKNOWN_NATIVE_IMAGE_FORMAT');
  const row={label,source:'source-freeze-c2 unchanged294; Chrome native supplement',runtime,before,after,viewportStable:JSON.stringify(before.viewport)===JSON.stringify(after.viewport),image:label+'.'+ext,sha256:createHash('sha256').update(bytes).digest('hex'),...extra};
  await writeFile(root+'/'+row.image,bytes,{flag:'wx'});await writeFile(root+'/'+label+'.ax.txt',ax,{flag:'wx'});await base.save(label,row);await appendFile(root+'/chrome-captures.jsonl',JSON.stringify(row)+'\n');return row;
 }
 return {...base,capture};
}
