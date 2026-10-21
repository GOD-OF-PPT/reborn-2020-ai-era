import {createHash} from 'node:crypto';

export class AuditInputBoundaryError extends Error {
  constructor(code) { super(code); this.name='AuditInputBoundaryError'; this.code=code; }
}
const fail=code=>{throw new AuditInputBoundaryError(code);};
const sha=text=>createHash('sha256').update(text,'utf8').digest('hex');
const metadata=(text,replayedCanonical)=>({bytes:Buffer.byteLength(text,'utf8'),sha256:sha(text),canonicalBytes:Buffer.byteLength(replayedCanonical,'utf8'),canonicalSha256:sha(replayedCanonical)});

/** Compare one original role-bound text. No filesystem reads, trimming, JSON normalization, or game execution. */
export function classifyAuditText({folder,file,origin,text,replayedCanonical,sourceText,binding}) {
  if (![folder,file,origin,text,replayedCanonical].every(v=>typeof v==='string')) fail('AUDIT_TEXT_STRING_FIELDS_REQUIRED');
  const byteEqual=text===replayedCanonical;
  if(origin!=='import_buffer') {
    if(binding!==undefined||sourceText!==undefined) fail('NON_IMPORT_MUST_NOT_CONSUME_BINDING');
    if(!byteEqual) fail('STRICT_EXPORT_BYTE_MISMATCH');
    return {comparison:'exact',byteEqual:true,originalSourceEqual:null,originalTerminalLfSeparately:false,originalTerminalLfCount:null,...metadata(text,replayedCanonical)};
  }
  if(!binding||typeof binding!=='object'||Array.isArray(binding)) fail('IMPORT_SOURCE_BINDING_REQUIRED');
  if(binding.folder!==folder||binding.file!==file||binding.origin!=='import_buffer'||binding.origin!==origin) fail('IMPORT_SOURCE_BINDING_IDENTITY_MISMATCH');
  if(typeof binding.sourceFile!=='string'||!binding.sourceFile||binding.sourceFile.startsWith('/')||binding.sourceFile.split('/').some(p=>p==='..'||p==='')) fail('IMPORT_SOURCE_FILE_REQUIRED');
  if(!Number.isSafeInteger(binding.bytes)||binding.bytes<0||typeof binding.sha256!=='string'||!/^[0-9a-f]{64}$/.test(binding.sha256)||(binding.terminalLf!==0&&binding.terminalLf!==1)) fail('IMPORT_SOURCE_BINDING_METADATA_REQUIRED');
  if(typeof sourceText!=='string') fail('IMPORT_SOURCE_TEXT_REQUIRED');
  if(Buffer.byteLength(sourceText,'utf8')!==binding.bytes||sha(sourceText)!==binding.sha256) fail('IMPORT_SOURCE_BYTES_MISMATCH');
  if(text!==sourceText) fail('IMPORT_BUFFER_NOT_ORIGINAL_SOURCE');
  let terminalLf=0;
  for(let i=sourceText.length-1;i>=0&&sourceText[i]==='\n';i--) terminalLf++;
  if(terminalLf!==binding.terminalLf) fail('IMPORT_SOURCE_TERMINAL_LF_METADATA_MISMATCH');
  if(sourceText.endsWith('\r\n')) fail('IMPORT_SOURCE_CRLF_REJECTED');
  if(!byteEqual&&!(binding.terminalLf===1&&replayedCanonical+'\n'===text)) fail('IMPORT_BUFFER_CANONICAL_MISMATCH');
  return {comparison:byteEqual?'exact':'source-bound-single-terminal-lf',byteEqual,originalSourceEqual:true,originalTerminalLfSeparately:!byteEqual,originalTerminalLfCount:terminalLf,...metadata(text,replayedCanonical)};
}
