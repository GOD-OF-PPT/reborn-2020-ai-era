import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import crypto from 'node:crypto';
import ts from 'typescript';
import {assertBrowserEvidenceWritable as guard} from '../../../../scripts/browser_evidence_guard.mjs';
const root='goal-1/evidence/t17-acceptance-39',out=root+'/closeout-r121';
const repo=process.cwd(),target=path.join(repo,'.delivery/t17-cux09-isolated-r121');
const git=(...args)=>cp.execFileSync('git',args,{maxBuffer:128*1024*1024});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const head=git('rev-parse','HEAD').toString().trim(),proposal=JSON.parse(fs.readFileSync(root+'/final-cux09-admission-r114/proposed-feature-paths.json'));
if(head!=='e555436b3ef6aedf58069247c4bdfd43410425c5'||git('diff','--cached','--name-only').toString().trim())throw Error('EXACT_CURRENT_HEAD_EMPTY_INDEX_REQUIRED');
for(const x of proposal.product)if(sha(fs.readFileSync(x.path))!==x.sha256)throw Error('PRODUCT_CHANGED:'+x.path);
if(fs.existsSync(target))throw Error('NEW_ISOLATED_DIRECTORY_REQUIRED');
fs.mkdirSync(target,{recursive:true});
const roots=['src','assets','public','scripts','index.html','package.json','package-lock.json','tsconfig.json','tsconfig.core.json','tsconfig.app.json','tsconfig.node.json','vite.config.ts','vitest.config.ts'];
const archive=git('archive',head,...roots);
cp.execFileSync('tar',['-xf','-','-C',target],{input:archive,maxBuffer:1024*1024});
for(const row of proposal.product){const p=path.join(target,row.path);fs.mkdirSync(path.dirname(p),{recursive:true});fs.copyFileSync(row.path,p)}
fs.symlinkSync(path.join(repo,'node_modules'),path.join(target,'node_modules'),'dir');
const tracked=new Map(git('ls-tree','-rz','HEAD').toString().split('\0').filter(Boolean).map(s=>{const [meta,p]=s.split('\t');return [p,{mode:meta.split(' ')[0],blob:meta.split(' ')[2]}]}));
const imports=[],missing=[],plannedRecords=[];
const materialise=(relative,from)=>{
 const p=path.posix.normalize(path.posix.join(path.posix.dirname(from),relative.split('?')[0]));
 const choices=[p,...['.ts','.tsx','.js','.json','/index.ts','/index.tsx'].map(ext=>p+ext)];
 for(const name of choices){
  const dest=path.join(target,name);
  if(fs.existsSync(dest)&&fs.statSync(dest).isFile())return name;
  const original=tracked.get(name);
  if(original?.mode==='100644'||original?.mode==='100755'){
   fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,git('cat-file','blob',original.blob));return name;
  }
  if(name.startsWith(root+'/')&&fs.existsSync(name)&&fs.lstatSync(name).isFile()){
   const bytes=fs.readFileSync(name);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.writeFileSync(dest,bytes);plannedRecords.push({path:name,sha256:sha(bytes),bytes:bytes.length});return name;
  }
 }
 missing.push({from,relative,candidates:choices});return null;
};
const files=fs.readdirSync(path.join(target,'src'),{recursive:true}).filter(f=>/\.(ts|tsx|css)$/.test(f)).map(f=>'src/'+f);
files.push(...roots.filter(f=>/\.ts$/.test(f)));
const seen=new Set();
for(let i=0;i<files.length;i++){
 const file=files[i];if(seen.has(file))continue;seen.add(file);
 const text=fs.readFileSync(path.join(target,file),'utf8'),literals=[];
 if(file.endsWith('.css')){for(const m of text.matchAll(/(?:@import\s*|url\()\s*["']?([^\s"')]+)["']?/g))if(m[1].startsWith('.'))literals.push(m[1])}
 else {
  const ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
  const walk=node=>{if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))literals.push(node.moduleSpecifier.text);if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword&&node.arguments[0]&&ts.isStringLiteral(node.arguments[0]))literals.push(node.arguments[0].text);ts.forEachChild(node,walk)};walk(ast);
 }
 for(const relative of literals.filter(x=>x.startsWith('.'))){const to=materialise(relative,file);imports.push({from:file,relative,to});if(to&&/\.(ts|tsx|css)$/.test(to)&&!seen.has(to))files.push(to)}
}
const snapshots=proposal.product.map(x=>({path:x.path,sha256:sha(fs.readFileSync(path.join(target,x.path)))}));
const p3=JSON.parse(fs.readFileSync(root+'/baseline.json')).p3;
const p3AtHead=p3.map(x=>({path:x.path,inHead:tracked.has(x.path),snapshotExists:fs.existsSync(path.join(target,x.path)),matchesHead:!fs.existsSync(path.join(target,x.path))||!tracked.has(x.path)?null:sha(fs.readFileSync(path.join(target,x.path)))===sha(git('show',head+':'+x.path))}));
if(p3AtHead.some(x=>x.snapshotExists&&!x.inHead||x.matchesHead===false))throw Error('P3_WIP_IN_ISOLATED_SNAPSHOT');
const report={at:new Date().toISOString(),head,target,source:'HEAD plus exact owned54; raw imports under own root39 explicitly planned record payload',productCount:54,snapshots,relativeImports:imports.length,missing,plannedRecords,p3AtHead,allRelativeImportsResolved:missing.length===0,worktreeOrIndexChanged:false,compatibility:0};
guard(out);fs.writeFileSync(out+'/isolated-source.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({target,owned:54,imports:imports.length,missing:missing.length,plannedRecords:plannedRecords.length,p3WipIncluded:0}));
if(missing.length)process.exitCode=1;
