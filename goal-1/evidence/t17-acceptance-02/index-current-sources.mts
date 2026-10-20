import ts from 'typescript'
import {readFileSync,writeFileSync,readdirSync,existsSync} from 'node:fs'
import {resolve,relative,dirname} from 'node:path'
import {createHash} from 'node:crypto'

const root=process.cwd(),out=resolve(root,'goal-1/evidence/t17-acceptance-02')
if(existsSync(out+'/sealed-evidence.json'))throw Error('EVIDENCE_SEALED_USE_NEW_ROOT')
const sha=(s:string)=>createHash('sha256').update(s).digest('hex')
function files(dir:string):string[]{return readdirSync(resolve(root,dir),{withFileTypes:true}).flatMap(d=>d.isDirectory()?files(dir+'/'+d.name):/\.tsx?$/.test(d.name)?[dir+'/'+d.name]:[]).sort()}
const sources=files('src'),rows:unknown[]=[],tests:unknown[]=[],symbols:unknown[]=[]
for(const file of sources){
 const text=readFileSync(resolve(root,file),'utf8'),hash=sha(text),source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,file.endsWith('.tsx')?ts.ScriptKind.TSX:ts.ScriptKind.TS)
 const imports=source.statements.filter(ts.isImportDeclaration).map(n=>{
  const spec=(n.moduleSpecifier as ts.StringLiteral).text,path=spec.startsWith('.')?resolve(root,dirname(file),spec):null
  return {specifier:spec,path:path?relative(root,path):null,exists:path?existsSync(path):null}
 })
 rows.push({file,sha256:hash,lines:text.split('\n').length,imports})
 function visit(node:ts.Node){
  const line=source.getLineAndCharacterOfPosition(node.getStart(source)).line+1
  if((ts.isFunctionDeclaration(node)||ts.isClassDeclaration(node)||ts.isInterfaceDeclaration(node)||ts.isTypeAliasDeclaration(node)||ts.isMethodDeclaration(node))&&node.name)symbols.push({file,line,name:node.name.getText(source),kind:ts.SyntaxKind[node.kind],sha256:hash})
  if(file.includes('.test.')&&ts.isCallExpression(node)&&node.arguments.length){
   const title=node.arguments[0]!,call=node.expression.getText(source)
   if((ts.isStringLiteral(title)||ts.isNoSubstitutionTemplateLiteral(title))&&/^(it|test|describe)(\b|\.)/.test(call))tests.push({file,line,title:title.text,call,kind:call.startsWith('describe')?'group':'test-declaration',sha256:hash,executedByThisIndex:false})
  }
  ts.forEachChild(node,visit)
 }
 visit(source)
}
const documentHashes=Object.fromEntries(['docs/14-acceptance-matrix.md','docs/19-research-implementation-plan.md'].map(f=>[f,sha(readFileSync(resolve(root,f),'utf8'))]))
const cases=[]
for(const [file,range]of [['docs/14-acceptance-matrix.md','Q'],['docs/19-research-implementation-plan.md','X']] as const){
 for(const [index,line]of readFileSync(resolve(root,file),'utf8').split('\n').entries()){
  const parts=line.split('|').map(s=>s.trim())
  if(new RegExp('^'+range+'\\d{2}$').test(parts[1]??''))cases.push({caseId:parts[1],authority:file,line:index+1,trigger:parts[2],expected:parts[3],owners:parts[4]})
 }
}
if(cases.length!==54||new Set(cases.map(c=>c.caseId)).size!==54)throw Error('FULL54_AUTHORITY_REQUIRED')
const original=JSON.parse(readFileSync(resolve(root,'goal-1/evidence/t17-acceptance-01/acceptance-requirements.json'),'utf8'))
for(const item of cases){const old=original.cases.find((c:{caseId:string})=>c.caseId===item.caseId);if(!old||['authority','trigger','expected','owners'].some(k=>(item as Record<string,unknown>)[k]!==old[k]))throw Error('AUTHORITY_DRIFT:'+item.caseId)}
const report={scope:'Static current source and declaration index, not a behavior test or acceptance result',sourceFiles:rows,testDeclarations:tests,symbols,authorityHashes:documentHashes,requirements:cases,all54OriginalTextsEqual:true,behaviorChecksPassedByIndex:0}
writeFileSync(out+'/current-source-index.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'})
console.log(JSON.stringify({sourceFiles:sources.length,testFiles:sources.filter(f=>f.includes('.test.')).length,declarations:tests.length,symbols:symbols.length,originalRequirements:cases.length,behaviorPasses:0}))
