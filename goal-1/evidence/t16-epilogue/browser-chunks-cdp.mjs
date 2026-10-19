// Local developer inspection of the public full-text book only. No controller,
// storage internals, model objects or page mutations are accessed.
export async function readBatch(cdp,text,total,maxChunks=6){
 for(let n=0;n<maxChunks&&text.length<total;n++){
  const result=await cdp.send('Runtime.evaluate',{expression:`document.querySelector('.full-save-text').textContent.slice(${text.length},${text.length+48000})`,returnByValue:true});
  if(result.exceptionDetails)throw Error('PUBLIC_BOOK_DOM_READ_FAILED');
  const chunk=result.result?.value;if(typeof chunk!=='string'||chunk.length!==Math.min(48000,total-text.length))throw Error('PUBLIC_RAW_CHUNK_LENGTH_MISMATCH');text+=chunk;
 }
 return text;
}
