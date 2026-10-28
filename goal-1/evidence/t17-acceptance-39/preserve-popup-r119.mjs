import fs from 'node:fs';
import {tree,ident} from '../t17-acceptance-25/closeout-preparation-r1/closeout-lib.candidate.mjs';
import {createHash} from 'node:crypto';
import {assertBrowserEvidenceWritable as guard} from '../../../scripts/browser_evidence_guard.mjs';
const root='goal-1/evidence/t17-acceptance-39',b=JSON.parse(fs.readFileSync(root+'/baseline.json'));
const equal=(a,b)=>['bytes','sha256','mode'].every(k=>a[k]===b[k]);
const exact=x=>{if(!equal(ident(x.path),x))throw Error('PRESERVED_FILE_CHANGED:'+x.path)};
exact(b.originalInput);b.p3.forEach(exact);b.oldSeals.forEach(exact);
for(const x of b.markerSymlinks){const s=fs.lstatSync(x.path);if(!s.isSymbolicLink()||fs.readlinkSync(x.path)!==x.target||(s.mode&0o777)!==x.mode)throw Error('PRESERVED_MARKER_SYMLINK_CHANGED:'+x.path)}
for(const x of b.masters){const bytes=fs.readFileSync(x.path),prefix=bytes.subarray(0,x.bytes),part=x.p3Insertion;const sha=v=>createHash('sha256').update(v).digest('hex');if(sha(prefix)!==x.sha256||sha(bytes.subarray(part.offset,part.offset+part.bytes))!==part.sha256)throw Error('MASTER_ORIGINAL_PREFIX_CHANGED:'+x.path)}
for(const [path,key]of [['goal-1/evidence/t17-acceptance-19','root19'],['goal-1/evidence/t17-acceptance-35','root35']]){if(JSON.stringify(tree(path))!==JSON.stringify(b[key]))throw Error('OLD_UNOWNED_TREE_CHANGED:'+path)}
const rows=[];
for(const x of b.lastSealed){
 exact(x.marker);const sealed=JSON.parse(fs.readFileSync(x.marker.path)),current=tree(x.root),payload=current.files.filter(f=>f.path!==x.marker.path);
 if(JSON.stringify(payload.map(({path,bytes,sha256,mode})=>({path,bytes,sha256,mode})))!==JSON.stringify(sealed.files.map(({path,bytes,sha256,mode})=>({path,bytes,sha256,mode})))||JSON.stringify(current.directories)!==JSON.stringify(sealed.directories)||JSON.stringify(current.directoryModes)!==JSON.stringify(sealed.directoryModes))throw Error('SEALED_PAYLOAD_TREE_CHANGED:'+x.root);
 rows.push({root:x.root,files:payload.length,directories:current.directories.length,marker:ident(x.marker.path),allExact:true});
}
const sources=JSON.parse(fs.readFileSync(root+'/build-r24.source-after.json')).files;sources.forEach(exact);
guard(root);fs.writeFileSync(root+'/preservation-popup-r119.json',JSON.stringify({at:new Date().toISOString(),p3Exact:b.p3.length,originalInputExact:true,masterOriginalPrefixesAnd2304InsertionsExact:true,oldMarkersExact:b.oldSeals.length,oldMarkerSymlinksExact:b.markerSymlinks.length,oldUnownedRoot19And35FullTreesExact:true,latestSixFullPayloads:rows,currentSourceCount:sources.length,currentSourceExact:true,allExact:true,indexChanged:false,compatibility:0},null,2)+'\n',{flag:'wx'});
console.log(JSON.stringify({p3:26,oldMarkers:b.oldSeals.length,latestSeals:rows.length,allExact:true,sourceCount:sources.length}));
