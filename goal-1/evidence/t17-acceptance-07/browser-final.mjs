import {bindPublicExport} from '../t17-acceptance-04/browser-public-no-compat-r2.mjs';
import {writeFile} from 'node:fs/promises';
import {assertBrowserEvidenceWritable,protectBrowserEvidence} from '../../../scripts/browser_evidence_guard.mjs';
export function bindRisk(tab,root,source){
 const readDom={send:async(method,p)=>{if(method!=='Runtime.evaluate')throw Error('READ_ONLY_DOM_REQUIRED');return {result:{value:await tab.playwright.evaluate(p.expression)}}}};
 return protectBrowserEvidence(bindPublicExport(tab,readDom,root,source),root);
}

export async function recordBytes(root,name,bytes){assertBrowserEvidenceWritable(root);if(!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(name))throw Error('SINGLE_OUTPUT_NAME_REQUIRED');await writeFile(root+'/'+name,bytes,{flag:'wx'});}
