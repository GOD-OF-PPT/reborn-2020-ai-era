import ts from 'typescript'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {resolve,relative,dirname} from 'node:path'
import {createHash} from 'node:crypto'

const root=process.cwd(),out='goal-1/evidence/t17-acceptance-02'
if(existsSync(out+'/sealed-evidence.json'))throw Error('EVIDENCE_SEALED_USE_NEW_ROOT')
const text=(f:string)=>readFileSync(resolve(root,f),'utf8'),sha=(f:string)=>createHash('sha256').update(readFileSync(resolve(root,f))).digest('hex')
const index=JSON.parse(text(out+'/current-source-index.json')),old=JSON.parse(text('goal-1/evidence/t16-c16-final-a1/source-final.json'))
const current=JSON.parse(text('goal-1/evidence/t17-acceptance-01/step3-final-summary.json'))
type Node={file:string;runtimeImports:string[];external:string[];dataReads:string[];unresolved:string[]}
const graph=new Map<string,Node>()
for(const row of index.sourceFiles){
 if(sha(row.file)!==row.sha256)throw Error('CURRENT_INDEX_SOURCE_DRIFT:'+row.file)
 const source=ts.createSourceFile(row.file,text(row.file),ts.ScriptTarget.Latest,true,row.file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS)
 const node:Node={file:row.file,runtimeImports:[],external:[],dataReads:[],unresolved:[]}
 const edge=(specifier:string)=>{if(!specifier.startsWith('.')){node.external.push(specifier);return}const file=relative(root,resolve(root,dirname(row.file),specifier));if(existsSync(resolve(root,file)))node.runtimeImports.push(file);else node.unresolved.push(file)}
 for(const s of source.statements){
  if(ts.isImportDeclaration(s)&&ts.isStringLiteral(s.moduleSpecifier)){
   const c=s.importClause,b=c?.namedBindings
   if(c?.isTypeOnly||!c?.name&&b&&ts.isNamedImports(b)&&b.elements.length>0&&b.elements.every(e=>e.isTypeOnly))continue
   edge(s.moduleSpecifier.text)
  }
  if(ts.isExportDeclaration(s)&&!s.isTypeOnly&&s.moduleSpecifier&&ts.isStringLiteral(s.moduleSpecifier))edge(s.moduleSpecifier.text)
 }
 function visit(n:ts.Node){
  if(ts.isCallExpression(n)&&n.expression.kind===ts.SyntaxKind.ImportKeyword){const a=n.arguments[0];if(a&&ts.isStringLiteral(a))edge(a.text);else node.unresolved.push('computed dynamic import')}
  if(ts.isCallExpression(n)&&/\breadFile(Sync)?$/.test(n.expression.getText(source)))node.dataReads.push(n.getText(source).slice(0,240))
  ts.forEachChild(n,visit)
 }
 visit(source);graph.set(row.file,node)
}
const globalFiles=['package.json','package-lock.json','vitest.config.ts','tsconfig.json','tsconfig.app.json','tsconfig.node.json']
const environmentMatches=process.version===old.identity.node&&globalFiles.every(f=>old.sources[f]===sha(f))
const currentRuns=['step3-current-affected-tests-r7','step3-current-book-app-regression-r7'].map(name=>{
 const result=JSON.parse(text('goal-1/evidence/t17-acceptance-01/'+name+'-result.json'))
 if(result.exit!==0)throw Error('CURRENT_UNIT_RUN_NOT_PASSED')
 const requested=result.argv.filter((v:string)=>v.startsWith('src/')&&v.includes('.test.'))
 const files=index.sourceFiles.filter((s:{file:string})=>s.file.includes('.test.')&&requested.some((p:string)=>s.file.includes(p))).map((s:{file:string})=>s.file)
 return {name,files,requested,log:'goal-1/evidence/t17-acceptance-01/'+name+'.txt'}
})
const tests=index.sourceFiles.filter((s:{file:string})=>s.file.includes('.test.')).map((row:{file:string})=>{
 const visited=new Set<string>(),changed:string[]=[],dataReads:string[]=[],unresolved:string[]=[]
 const walk=(file:string)=>{if(visited.has(file))return;visited.add(file);if(!old.sources[file]||old.sources[file]!==sha(file))changed.push(file);const n=graph.get(file);if(!n)return;dataReads.push(...n.dataReads.map(t=>file+': '+t));unresolved.push(...n.unresolved.map(t=>file+': '+t));n.runtimeImports.forEach(walk)}
 walk(row.file)
 const run=currentRuns.find(r=>r.files.includes(row.file)),currentExact=!!run&&[...visited].every(f=>current.finalSourceFiles[f]===sha(f))
 return {file:row.file,dependencyFiles:[...visited].sort(),changedSinceC16:changed.sort(),filesystemReadsNeedingManualBinding:dataReads,unresolved,legacyUnitSourceReusable:environmentMatches&&changed.length===0&&dataReads.length===0&&unresolved.length===0,currentUnitSourceMatched:currentExact,currentRun:run?.log??null,boundary:'Source eligibility only; inspect each assertion before assigning requirement coverage. Historical matches remain historical executions, not new tests.'}
})
const report={scope:'Conservative runtime import closure and environment binding for existing executed unit reports; no behavior executed',indexSha256:sha(out+'/current-source-index.json'),toolSha256:sha(out+'/evidence-source-scope.mts'),oldSourceArtifact:'goal-1/evidence/t16-c16-final-a1/source-final.json',oldSourceSha256:sha('goal-1/evidence/t16-c16-final-a1/source-final.json'),currentSourceArtifact:'goal-1/evidence/t17-acceptance-01/step3-final-summary.json',environmentMatches,currentRuns,tests}
writeFileSync(out+'/unit-evidence-source-scope.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({testFiles:tests.length,legacySourceReusable:tests.filter((t:{legacyUnitSourceReusable:boolean})=>t.legacyUnitSourceReusable).length,currentFileRunsBound:tests.filter((t:{currentUnitSourceMatched:boolean})=>t.currentUnitSourceMatched).length,behaviorTestsRun:0,environmentMatches}))
