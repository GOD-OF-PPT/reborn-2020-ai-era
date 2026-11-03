import fs from 'node:fs';import {json,ident,tree,verifySeal,hash,git}from'../../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
const root='goal-1/evidence/t17-acceptance-40/normal-capital-control-r461',prior='goal-1/evidence/t17-acceptance-40/normal-capital-resume-r440',old=json('goal-1/evidence/t17-acceptance-40/baseline.json'),current=json(prior+'/baseline.json'),label=process.argv[2],same=(a,b)=>['bytes','sha256','mode'].every(k=>a[k]===b[k]);
if(!/^[-a-z0-9]+$/.test(label??'')||fs.existsSync(root+'/stopped.json'))throw Error('ACTIVE_EXPLICIT_LABEL_REQUIRED');
for(const row of [...old.p3,...old.oldSeals,old.originalInput,old.unverifiedRecordModel])if(!same(ident(row.path),row))throw Error('OLD_ARTIFACT_CHANGED:'+row.path);
for(const row of old.markerSymlinks){const s=fs.lstatSync(row.path);if(!s.isSymbolicLink()||fs.readlinkSync(row.path)!==row.target||(s.mode&0o777)!==row.mode)throw Error('OLD_LINK_CHANGED')}
for(const [name,expected]of[['t17-acceptance-19',old.root19],['t17-acceptance-35',old.root35]])if(JSON.stringify(tree('goal-1/evidence/'+name))!==JSON.stringify(expected))throw Error('OLD_TREE_CHANGED:'+name);
for(const row of old.masters){const bytes=fs.readFileSync(row.path),before=fs.readFileSync(row.privatePreimage.path),insert=row.p3Insertion;if(!same(ident(row.privatePreimage.path),row.privatePreimage)||!bytes.subarray(0,before.length).equals(before)||hash(bytes.subarray(insert.offset,insert.offset+insert.bytes))!==insert.sha256)throw Error('ORIGINAL_MASTER_CHANGED')}
for(const row of current.masters){const before=fs.readFileSync(row.currentPreimage.path),bytes=fs.readFileSync(row.path);if(hash(before)!==row.currentPreimage.sha256||before.length!==row.currentPreimage.bytes||!bytes.subarray(0,before.length).equals(before))throw Error('CURRENT_MASTER_PREFIX_CHANGED')}
if(current.seals.length!==55)throw Error('EXACT55_REQUIRED');const seals=current.seals.map(row=>verifySeal(row.root));if(fs.existsSync(prior+'/old-execution-seal.json'))seals.push(verifySeal(json(prior+'/old-execution-seal.json').seal.root));
seals.push(verifySeal('goal-1/evidence/t17-acceptance-40/people-choice-r441'));seals.push(verifySeal('goal-1/evidence/t17-acceptance-40/business-entry-r447'));
seals.push(verifySeal('goal-1/evidence/t17-acceptance-40/equity-history-r449'));
seals.push(verifySeal('goal-1/evidence/t17-acceptance-40/follow-rights-r451'));
seals.push(verifySeal('goal-1/evidence/t17-acceptance-40/follow-stage-r456'));
seals.push(verifySeal('goal-1/evidence/t17-acceptance-40/large-run-profile-r458'));seals.push(verifySeal('goal-1/evidence/t17-acceptance-40/normal-capital-recover-r460'));
seals.push(verifySeal('goal-1/evidence/t17-acceptance-40/normal-capital-resume-r440/execution-r1'));
seals.push(verifySeal('goal-1/evidence/t17-acceptance-40/normal-capital-control-r461/checkpoint611'));
seals.push(verifySeal('goal-1/evidence/t17-acceptance-40/normal-capital-control-r461/advance-probe-01'));seals.push(verifySeal('goal-1/evidence/t17-acceptance-40/normal-capital-control-r461/advance-probe-02'));
seals.push(verifySeal('goal-1/evidence/t17-acceptance-40/normal-capital-control-r461/fact-index-r462/late-probe-01'));
seals.push(verifySeal('goal-1/evidence/t17-acceptance-40/normal-capital-control-r461/fact-index-r462'));
const report={at:new Date().toISOString(),head:git(['rev-parse','HEAD']).toString().trim(),p3:old.p3.length,oldMarkers:old.oldSeals.length,links:old.markerSymlinks.length,fullSeals:seals,old19And35Exact:true,originalInputExact:true,unverifiedModelExact:true,originalAndCurrentMasterPrefixesExact:true,compatibility:0,wholeU6Complete:false};fs.writeFileSync(root+'/preservation-'+label+'.json',JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log({p3:report.p3,markers:report.oldMarkers,seals:seals.length,masters:true,input:true});
