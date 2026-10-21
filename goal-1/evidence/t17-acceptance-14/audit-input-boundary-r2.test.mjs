import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {classifyAuditText,AuditInputBoundaryError} from './audit-input-boundary-r2.mjs';
import {createCampaignCodec} from '../../../src/application/campaign.ts';

const canonical='{"message":"原文","value":1}';
const sha=text=>createHash('sha256').update(text,'utf8').digest('hex');
const bind=(sourceText,terminalLf=0)=>({folder:'chrome-unit',file:'buffer.json',origin:'import_buffer',sourceFile:'goal-1/evidence/original.json',bytes:Buffer.byteLength(sourceText,'utf8'),sha256:sha(sourceText),terminalLf});
const input=(text=canonical)=>({folder:'chrome-unit',file:'buffer.json',origin:'import_buffer',text,replayedCanonical:canonical,sourceText:text,binding:bind(text,text.endsWith('\n')?1:0)});
const rejected=(args,code)=>assert.throws(()=>classifyAuditText(args),e=>e instanceof AuditInputBoundaryError&&e.code===code);

test('canonical export remains exact and cannot use an import binding',()=>{
 const a={folder:'chrome-unit',file:'saved.json',origin:'product_export',text:canonical,replayedCanonical:canonical};
 const r=classifyAuditText(a);assert.equal(r.byteEqual,true);assert.equal(r.originalSourceEqual,null);assert.equal(r.originalTerminalLfSeparately,false);
 rejected({...a,binding:bind(canonical)},'NON_IMPORT_MUST_NOT_CONSUME_BINDING');
 rejected({...a,sourceText:canonical},'NON_IMPORT_MUST_NOT_CONSUME_BINDING');
});
test('product, candidate, physical and reload roles never accept terminal LF',()=>{
 for(const origin of ['product_export','candidate','stored_original','physical','reload'])rejected({folder:'chrome-unit',file:'saved.json',origin,text:canonical+'\n',replayedCanonical:canonical},'STRICT_EXPORT_BYTE_MISMATCH');
});
test('canonical import is source-bound with byte length computed as UTF8',()=>{
 const args=input(),r=classifyAuditText(args);assert.equal(r.byteEqual,true);assert.equal(r.originalSourceEqual,true);assert.equal(r.originalTerminalLfCount,0);assert.equal(r.bytes,Buffer.byteLength(canonical));assert.notEqual(r.bytes,canonical.length);
 rejected({...args,binding:{...args.binding,bytes:canonical.length}},'IMPORT_SOURCE_BYTES_MISMATCH');
});
test('one genuine source terminal LF is kept as a separate non-equal byte outcome',()=>{
 const r=classifyAuditText(input(canonical+'\n'));assert.equal(r.byteEqual,false);assert.equal(r.comparison,'source-bound-single-terminal-lf');assert.equal(r.originalSourceEqual,true);assert.equal(r.originalTerminalLfSeparately,true);assert.equal(r.originalTerminalLfCount,1);assert.equal(r.bytes,r.canonicalBytes+1);assert.notEqual(r.sha256,r.canonicalSha256);
});
test('an unknown binding or missing original source is rejected',()=>{
 rejected({...input(),binding:undefined},'IMPORT_SOURCE_BINDING_REQUIRED');
 rejected({...input(),sourceText:undefined},'IMPORT_SOURCE_TEXT_REQUIRED');
});
test('folder, file and origin identities cannot be relabelled',()=>{
 const a=input(canonical+'\n');
 for(const [field,value] of [['folder','chrome-other'],['file','another.json'],['origin','product_export']])rejected({...a,binding:{...a.binding,[field]:value}},'IMPORT_SOURCE_BINDING_IDENTITY_MISMATCH');
 rejected({...a,origin:'product_export'},'NON_IMPORT_MUST_NOT_CONSUME_BINDING');
});
test('the actual original hash and bytes are required independently of the row',()=>{
 const a=input(canonical+'\n');
 rejected({...a,binding:{...a.binding,sha256:'0'.repeat(64)}},'IMPORT_SOURCE_BYTES_MISMATCH');
 rejected({...a,binding:{...a.binding,bytes:a.binding.bytes+1}},'IMPORT_SOURCE_BYTES_MISMATCH');
});
test('a changed browser buffer cannot borrow the intact source binding',()=>{
 rejected({...input(canonical+'\n'),text:canonical.replace('1','2')+'\n'},'IMPORT_BUFFER_NOT_ORIGINAL_SOURCE');
});
test('CRLF and double LF are rejected even with matching source hashes',()=>{
 rejected(input(canonical+'\r\n'),'IMPORT_SOURCE_CRLF_REJECTED');
 rejected(input(canonical+'\n\n'),'IMPORT_SOURCE_TERMINAL_LF_METADATA_MISMATCH');
});
test('manifest terminal LF must describe the source exactly',()=>{
 const a=input(canonical+'\n');rejected({...a,binding:{...a.binding,terminalLf:0}},'IMPORT_SOURCE_TERMINAL_LF_METADATA_MISMATCH');
 const b=input();rejected({...b,binding:{...b.binding,terminalLf:1}},'IMPORT_SOURCE_TERMINAL_LF_METADATA_MISMATCH');
});
test('leading space, trailing space, reordered keys and changed values are not normalized',()=>{
 for(const text of [' '+canonical,canonical+' ',canonical.replace('"message":"原文","value":1','"value":1,"message":"原文"'),canonical.replace(':1',':2')])rejected(input(text),'IMPORT_BUFFER_CANONICAL_MISMATCH');
});
test('malformed metadata and absent source paths fail closed',()=>{
 const a=input();
 for(const patch of [{terminalLf:2},{bytes:NaN},{sha256:'not-a-hash'}])rejected({...a,binding:{...a.binding,...patch}},'IMPORT_SOURCE_BINDING_METADATA_REQUIRED');
 for(const sourceFile of ['', '/outside.json','../outside.json'])rejected({...a,binding:{...a.binding,sourceFile}},'IMPORT_SOURCE_FILE_REQUIRED');
 rejected({...a,text:null},'AUDIT_TEXT_STRING_FIELDS_REQUIRED');
});

const task=fileURLToPath(new URL('./',import.meta.url)),project=path.resolve(task,'../../..');
const actualBindings=[
 ['chrome-deepseek-r8','eco-normal-c16-r70-text-before-import.json','goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-beforeContract.json',1],
 ['chrome-equity-r11','normal-c16-signed-equity-r94-text-before-import.json','goal-1/evidence/t16-c16-final-a1/replay/deepseek/t13-normal-technical_employee-signed.json',1],
 ['chrome-deepseek-r10','eco-real-original-backup74-restore-text-before-import.json','goal-1/evidence/t17-acceptance-14/chrome-deepseek-r8/eco-original-physical-backup-r74-before-review.json',0],
 ['chrome-deepseek-r11','eco-real-original-backup75-restore-text-before-import.json','goal-1/evidence/t17-acceptance-14/chrome-deepseek-r10/eco-original-physical-backup-r75-before-support.json',0],
 ['chrome-life-npc-r11','normal-c16-npc-offered-r12-text-before-import.json','goal-1/evidence/t16-c16-final-a1/life/t15-npc-own-calendar-offered.json',0]
];
for(const [folder,file,sourceFile,terminalLf] of actualBindings)test('actual source-bound input buffer: '+folder+'/'+file,()=>{
 const rows=fs.readFileSync(path.join(task,folder,'exports.jsonl'),'utf8').trimEnd().split('\n').map(JSON.parse),row=rows.find(x=>x.file===file);assert(row);assert.equal(row.origin,'import_buffer');
 const text=fs.readFileSync(path.join(task,folder,file),'utf8'),sourceText=fs.readFileSync(path.join(project,sourceFile),'utf8');assert.equal(text,sourceText);assert.equal(sha(text),row.sha256);assert.equal(Buffer.byteLength(text),row.bytes);
 const binding={folder,file,origin:'import_buffer',sourceFile,bytes:Buffer.byteLength(sourceText),sha256:sha(sourceText),terminalLf};
 const codec=createCampaignCodec(),run=codec.import(sourceText),replayedCanonical=codec.export(run),outcome=classifyAuditText({folder,file,origin:row.origin,text,replayedCanonical,sourceText,binding});
 assert.equal(outcome.originalSourceEqual,true);assert.equal(outcome.byteEqual,terminalLf===0);assert.equal(outcome.originalTerminalLfSeparately,terminalLf===1);assert.equal(outcome.originalTerminalLfCount,terminalLf);
 rejected({folder,file,origin:'product_export',text:text+'\n',replayedCanonical},'STRICT_EXPORT_BYTE_MISMATCH');
 // This is a codec/boundary check only; no CreateRun or command replay is executed here.
});
