import sys,json,hashlib,stat,re,os,importlib.util
from pathlib import Path
from urllib.parse import unquote,urlparse
root=Path.cwd()
mode=sys.argv[1]
selected=['docs/36-mainline-and-art-reconstruction-plan.md','goal-1/evidence/t17-acceptance-32/plan.md','goal-1/evidence/t17-acceptance-32/tasks.md','goal-1/input.md','goal-1/plan.md','goal-1/tasks.md']
spec=importlib.util.spec_from_file_location('original_check_docs',root/'scripts/check_docs.py')
checker=importlib.util.module_from_spec(spec);spec.loader.exec_module(checker)
if mode=='check':
    checker.project_files=lambda unused:[root/p for p in selected]
    print('SCOPED PROVIDER: six explicit Markdown files; whole project_files/native enumeration NOT RUN.')
    print('Original check() assertions remain; text_only retains original missing-PNG notices and task graph checks.')
    errors=checker.check(root,text_only=True)
    for error in errors:print(error,file=sys.stderr)
    raise SystemExit(bool(errors))
if mode!='inventory':raise ValueError('EXPLICIT_MODE_REQUIRED')
kind=sys.argv[2];targets=[]
if kind=='docs':
    paths=selected+['scripts/check_docs.py','assets/concepts/manifest.json','planning/backlog.json']
    paths += [a['path'] for a in json.loads((root/'assets/concepts/manifest.json').read_text())['assets']]
    for name in selected:
        text=re.sub(chr(96)*3+r'.*?'+chr(96)*3,'',(root/name).read_text(),flags=re.S)
        for target in re.findall(r'!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)',text):
            parsed=urlparse(target)
            if parsed.scheme or target.startswith('#'):continue
            p=((root/name).parent/unquote(parsed.path)).resolve()
            targets.append({'document':name,'target':target,'resolved':str(p),'insideRepository':p.is_relative_to(root.resolve()),'exists':p.exists(),'isFile':p.is_file(),'isDirectory':p.is_dir()})
    provider='SCOPED original check_docs.check: exact six MD; original manifest/backlog also checked; link target existence only'
elif kind=='plan':
    paths=['scripts/check_plan.py','planning/backlog.json','planning/playable-spec.json','docs/14-acceptance-matrix.md','docs/15-content-contracts.md'];provider='Original check_plan.py main exact inputs'
elif kind=='competitive':
    data=json.loads((root/'planning/competitive-design.json').read_text());paths=['scripts/check_competitive_design.py','planning/competitive-design.json',data['baseTaskFile'],'docs/19-research-implementation-plan.md',*data['documents']];provider='Original check_competitive_design.py default inputs; no base-index override'
else:raise ValueError('KNOWN_SCOPE_REQUIRED')
rows=[]
for name in sorted(set(paths)):
    p=root/name;r={'path':name}
    try:
        s=p.lstat();r.update(mode=stat.S_IMODE(s.st_mode),type='symlink' if p.is_symlink() else 'file' if p.is_file() else 'other')
        if p.is_symlink():r['linkTarget']=os.readlink(p)
        b=p.read_bytes();r.update(bytes=len(b),sha256=hashlib.sha256(b).hexdigest())
    except OSError as e:r['readError']={'kind':type(e).__name__,'errno':e.errno}
    rows.append(r)
print(json.dumps({'provider':provider,'rows':rows,'linkExistenceDependencies':targets},ensure_ascii=False,separators=(',',':')))
