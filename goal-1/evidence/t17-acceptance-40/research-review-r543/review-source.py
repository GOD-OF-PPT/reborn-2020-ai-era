from pathlib import Path
import hashlib,json
r=Path(__file__).parent
old=(r/'App.tsx.before').read_text();new=Path('src/ui/App.tsx').read_text()
normalized=new.replace("import {captureResearchDecision,ResearchDecisionFacts,ResearchDecisionDetails} from './ResearchDecisionFacts.tsx'\n",'').replace(',researchDecision=captureResearchDecision(command,preview,context,contextFeatures)','').replace(':researchDecision?<ResearchDecisionFacts value={researchDecision}/>', '').replace('details:<>{researchDecision?<ResearchDecisionDetails value={researchDecision}/>:null}', 'details:<>')
assert old==normalized,'App changed outside declared display capture insertions'
read=lambda p:json.loads(Path(p).read_text());a=read(r/'snapshot543.json');b=read(r/'snapshot544.json');base=read('goal-1/evidence/t17-acceptance-40/today-market-choice-r541/snapshot542.json');start=read('goal-1/evidence/t17-acceptance-40/focus-echo-r536/snapshot536.json');index=lambda s:{x['path']:x['sha256'] for x in s['files']}
aidx=index(a);bidx=index(b);baseidx=index(base);startidx=index(start)
delta=[x for x in bidx if bidx[x]!=baseidx.get(x)];assert sorted(delta)==sorted(b['owned'])
diff=[x for x in bidx if bidx[x]!=aidx.get(x)];assert diff==['src/ui/research-decision.test.tsx']
cumulative=[x for x in bidx if bidx[x]!=startidx.get(x)];assert all(p.startswith('src/ui/') for p in cumulative)
def assets(s):
 d=Path(s['target'])/'dist-u6-review';return {str(p.relative_to(d)):p.read_bytes() for p in d.rglob('*') if p.is_file()}
assert assets(a)==assets(b)
hash=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest();protected=[]
for root in ['goal-1/evidence/t17-acceptance-40/today-directions-r537','goal-1/evidence/t17-acceptance-40/today-market-choice-r541']:
 path=Path(root);seal=read(path/'sealed-evidence.json')
 for row in seal['files']:assert hash(row['path'])==row['sha256'],row['path']
 assert {str(p) for p in path.rglob('*') if p.is_file()}=={row['path'] for row in seal['files']}|{str(path/'sealed-evidence.json')}
 protected.append({'root':root,'ordinaryFiles':len(seal['files']),'bytesAndInventoryExact':True})
report={'source':544,'base':542,'appOnlyDeclaredCaptureInsertions':True,'originalCommandActionsAndDispatchExact':True,'changed':delta,'from543':diff,'builtFilesByteEqual':len(assets(b)),'cumulativeBase':536,'cumulativeUIDelta':cumulative,'cumulativeCount':len(cumulative),'allNonUIUnchanged':True,'priorSeals':protected,'storageTests':0,'compatibility':0}
(r/'source-review544.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False))
