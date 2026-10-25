import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {assertBrowserEvidenceWritable as guard} from '../../../scripts/browser_evidence_guard.mjs';

/** Reuse the native reader; preserve the actual returned encoding without converting pixels. */
export function captureFor(h){return async label=>{
 guard(h.directory);if(!/^[a-zA-Z0-9_.-]+$/.test(label))throw Error('CAPTURE_LABEL_REQUIRED');
 const ax=await h.tab.getAXState({emit:false,disableDiffing:true}),bytes=await h.tab.screenshot({fullPage:false});
 const png=bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71,jpeg=bytes[0]===255&&bytes[1]===216;
 if(!png&&!jpeg)throw Error('KNOWN_CAPTURE_ENCODING_REQUIRED');
 const ext=png?'png':'jpg',path=h.directory+'/'+label+'.'+ext;
 guard(h.directory);await writeFile(h.directory+'/'+label+'.ax.txt',ax,{flag:'wx'});
 guard(h.directory);await writeFile(path,bytes,{flag:'wx'});
 await h.journal({type:'screenshot',path,encoding:ext,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),converted:false});
 return {bytes,path};
};}
