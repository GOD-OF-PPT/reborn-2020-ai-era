import sys,json,hashlib,os,stat,importlib.util
from pathlib import Path
root=Path.cwd();mode=sys.argv[1]
spec=importlib.util.spec_from_file_location('original_check_docs',root/'scripts/check_docs.py')
checker=importlib.util.module_from_spec(spec);spec.loader.exec_module(checker)
if mode=='docs':
    paths=list(checker.project_files(root));provider='Original scripts/check_docs.py project_files(root), whole repository exclusions unchanged'
    manifest=json.loads((root/'assets/concepts/manifest.json').read_text())
    paths += [root/a['path'] for a in manifest['assets']]
elif mode=='plan':
    paths=[root/p for p in ['planning/backlog.json','planning/playable-spec.json','docs/14-acceptance-matrix.md','docs/15-content-contracts.md']];provider='Exact original check_plan.py main reads'
elif mode=='competitive':
    data=json.loads((root/'planning/competitive-design.json').read_text());paths=[root/p for p in ['planning/competitive-design.json',data['baseTaskFile'],'docs/19-research-implementation-plan.md',*data['documents']]];provider='Original check_competitive_design.py default provider, no base-index override; documents include existence dependencies'
else:raise ValueError('KNOWN_SCOPE_REQUIRED')
paths += [root/('scripts/'+{'docs':'check_docs.py','plan':'check_plan.py','competitive':'check_competitive_design.py'}[mode])]
rows=[]
for p in sorted(set(paths)):
    row={'path':p.relative_to(root).as_posix()}
    try:
        st=p.lstat();row['mode']=stat.S_IMODE(st.st_mode);row['type']='symlink' if p.is_symlink() else 'file' if p.is_file() else 'other'
        if p.is_symlink():row['linkTarget']=os.readlink(p)
        h=hashlib.sha256();size=0
        with p.open('rb') as f:
            for part in iter(lambda:f.read(1024*1024),b''):size+=len(part);h.update(part)
        row.update(bytes=size,sha256=h.hexdigest())
    except OSError as e:row['readError']={'kind':type(e).__name__,'errno':e.errno}
    rows.append(row)
encoded=json.dumps(rows,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()
print(json.dumps({'provider':provider,'scope':mode,'count':len(rows),'rowsDigestSha256':hashlib.sha256(encoded).hexdigest(),'rows':rows},ensure_ascii=False,separators=(',',':')))
