import {existsSync,readFileSync,renameSync,symlinkSync,unlinkSync,rmdirSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {RelayShapeEvidenceWriter,archiveMembers,unpackArchive,putMember,equal,check,sha} from '../../../scripts/relay-shape-evidence.ts'

const writer=new RelayShapeEvidenceWriter('matrix','tool-fixture-results.json'),results=[]
const rejects=(name,expected,action)=>{let actual=null;try{action()}catch(error){actual=String(error)}check(actual?.includes(expected),'FIXTURE_EXPECTED_REFUSAL_MISSING:'+name);results.push({name,expectedRefusal:expected,actual,passed:true})}
writer.requireSpace()
const members=new Map()
for(let i=0;i<513;i++)putMember(members,'member-'+String(i).padStart(3,'0')+'.json',JSON.stringify({i,text:'完整模拟字节\n回读'})+'\n')
const archives=archiveMembers(writer,'fixture.xz',members),decoded=new Map()
check(archives.length===2&&archives[0].members.length===512&&archives[1].members.length===1,'ACTUAL_MEMBER_COUNT_SPLIT_REQUIRED')
for(const archive of archives)for(const [name,raw]of unpackArchive(writer.name+'/'+archive.file,archive)){check(!decoded.has(name),'FIXTURE_DUPLICATE_MEMBER');decoded.set(name,raw)}
equal([...decoded],[...members],'ALL_513_ORIGINAL_MEMBERS_MUST_BE_EXACT')
results.push({name:'513-member-count-split-and-full-readback',passed:true,parts:2,members:513,allOriginalBytesEqual:true})
rejects('changed-stored-archive-descriptor','AUDIT_RELAY_SHAPE_ARCHIVE_BYTES_CHANGED',()=>unpackArchive(writer.name+'/'+archives[0].file,{...archives[0],storedSha256:'0'.repeat(64)}))
rejects('nonflat-member','UNIQUE_FLAT_RELAY_SHAPE_MEMBER_REQUIRED',()=>putMember(new Map(),'../escape.json','x'))
rejects('oversized-member-before-packing','RELAY_SHAPE_MEMBER_LIMIT',()=>archiveMembers(writer,'oversized.xz',new Map([['oversized.json','x'.repeat(12*1024*1024+1)]])))
check(!existsSync(writer.path('oversized-part-001.xz')),'OVERSIZED_MEMBER_MUST_NOT_CREATE_ARCHIVE')
writer.text('append.txt','original\n');writer.text('sentinel.txt','sentinel\n')
const append=writer.path('append.txt'),saved=writer.path('saved-original.txt'),sentinel=writer.path('sentinel.txt')
renameSync(append,saved)
try{symlinkSync('sentinel.txt',append);rejects('append-leaf-symlink','OUTPUT_LINK_OR_NONREGULAR',()=>writer.append('append.txt',{mustNotAppear:true}))}
finally{if(existsSync(append))unlinkSync(append);renameSync(saved,append)}
check(readFileSync(append,'utf8')==='original\n'&&readFileSync(sentinel,'utf8')==='sentinel\n','OWNED_FIXTURE_BYTES_CHANGED')
writer.mkdir('sealed-fixture');writer.text('sealed-fixture/sealed-evidence.json','{"ownedFixture":true}\n')
const fixtureMarker=writer.output+'/sealed-fixture/sealed-evidence.json'
try{rejects('sealed-ancestor-before-write','EVIDENCE_PARENT_SEALED_USE_NEW_SIBLING',()=>writer.text('sealed-fixture/blocked.txt','must not write'))}
finally{unlinkSync(fixtureMarker);rmdirSync(writer.output+'/sealed-fixture')}
check(results.length===6&&results.every(r=>r.passed),'ALL_SIX_TOOL_FIXTURES_REQUIRED')
writer.json('tool-fixture-results.json',{scope:'Owned filesystem and archive fixtures only; no game/Create/pilot/core execution or compatibility. Temporary links/fixture seal removed after refusal; original writer/sentinel restored.',
 passed:true,results,driverSha256:sha(readFileSync(fileURLToPath(import.meta.url))),notExercised:['256MiB container byte-split with a large actual payload','actual ENOSPC/EIO or system crash'],compatibilityDevelopmentTests:0,gameExecutions:0})
console.log(JSON.stringify({passed:true,fixtures:results.length,members:513,parts:2,gameExecutions:0}))
