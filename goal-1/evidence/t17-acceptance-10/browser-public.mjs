import {bindRisk,recordBytes} from '../t17-acceptance-07/browser-final.mjs';

export function bindCourseBrowser(tab,root,source){
 const publicTab={
  playwright:tab.playwright,
  getAXState:()=>tab.playwright.domSnapshot(),
  pressKey:async(index,key)=>{
   if(index!==null||key!=='Escape')throw Error('PUBLIC_DIALOG_ESCAPE_ONLY');
   const dialogs=tab.playwright.locator('dialog[open]');
   const target=await dialogs.count()?dialogs.last():tab.playwright.locator('body');
   return target.press('Escape',{timeoutMs:15000});
  },
 };
 return bindRisk(publicTab,root,source);
}
export {recordBytes};
