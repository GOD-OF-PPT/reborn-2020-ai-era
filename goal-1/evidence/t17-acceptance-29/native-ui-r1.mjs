import {writeFile} from 'node:fs/promises';
import {assertBrowserEvidenceWritable as guard} from '../../../scripts/browser_evidence_guard.mjs';
import {nativeUiHarness} from '../t17-acceptance-27/native-ui-harness-r5.mjs';
/** Reuse the sealed raw reader; every action/output remains bound to its fresh evidence directory. */
export function bindNative(tab,directory){
 const h=nativeUiHarness(tab,directory);
 const key=async(name,dialog,compact=false)=>{guard(directory);let error=null;try{const root=dialog?tab.playwright.getByRole('dialog',{name:dialog,exact:true}):tab.playwright;await root.getByRole('button',{name,exact:true}).press('Enter',{timeoutMs:30000})}catch(e){error=String(e)}const observed=compact?await h.brief():await tab.getAXState({emit:false,disableDiffing:true});await h.journal({type:'native-key',name:String(name),dialog:dialog??null,error,observed});return observed};
 const radio=async(name)=>{guard(directory);await tab.playwright.getByRole('radio',{name}).press('Space',{timeoutMs:30000});const state=await tab.getAXState({emit:false,disableDiffing:true});await h.journal({type:'native-radio',name:String(name),state});return state};
 const shot=async(label)=>{guard(directory);if(!/^[a-zA-Z0-9_.-]+$/.test(label))throw Error('LABEL');const ax=await tab.getAXState({emit:false,disableDiffing:true}),png=await tab.screenshot({fullPage:false});guard(directory);await writeFile(directory+'/'+label+'.ax.txt',ax,{flag:'wx'});guard(directory);await writeFile(directory+'/'+label+'.png',png,{flag:'wx'});return {bytes:png,path:directory+'/'+label+'.png'}};
 const exportSaved=async(label,origin,source)=>{guard(directory);await key('个人账户 · 翻开原账 ↗');await key('导出已保存存档','账本与存档');await key('只读翻阅完整原文','本机存档与备份',true);const result=await h.readRaw(label,origin,source);await key('关闭对话框','完整存档原文 · 只读');await key('关闭对话框','本机存档与备份');const state=await key('关闭对话框','账本与存档');if(typeof state!=='string'||!state.includes('button 住处'))throw Error('OBSERVED_ROOM_RETURN_REQUIRED');await key('住处');return result};
 return {...h,key,radio,shot,exportSaved};
}
