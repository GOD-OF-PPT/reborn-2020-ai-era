from pathlib import Path
import hashlib
import json
import os
import stat

root = Path(__file__).absolute().parent
if any(p.is_symlink() or os.path.lexists(p / 'sealed-evidence.json') for p in (root, *root.parents)):
    raise RuntimeError('FRESH_UNSEALED_REGULAR_EVIDENCE_ROOT_REQUIRED')
files, links, directories, inodes = {}, {}, [], {}
for base, names, leaves in os.walk(root, followlinks=False):
    names.sort()
    leaves.sort()
    for name in names[:]:
        path = Path(base) / name
        if path.is_symlink():
            names.remove(name)
            leaves.append(name)
        else:
            directories.append(path.relative_to(root).as_posix())
    for name in sorted(leaves):
        path = Path(base) / name
        key = path.relative_to(root).as_posix()
        value = path.lstat()
        if stat.S_ISLNK(value.st_mode):
            target = os.readlink(path)
            raw = os.fsencode(target)
            links[key] = {'target': target, 'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
        elif stat.S_ISREG(value.st_mode):
            raw = path.read_bytes()
            files[key] = {'bytes': len(raw), 'sha256': hashlib.sha256(raw).hexdigest()}
            inodes.setdefault((value.st_dev, value.st_ino), []).append(key)
        else:
            raise RuntimeError('REGULAR_FILE_OR_LITERAL_LINK_REQUIRED:' + key)
report = {'scope': 'D09 exact local feature commit byte and immutable guard records; record commit follows Git, not whole T17 or goal',
          'files': files, 'symlinks': links, 'selfExcluded': ['sealed-evidence.json'],
          'physicalStructureObservation': {'directories': sorted(directories), 'hardlinkGroups': [v for v in inodes.values() if len(v) > 1],
                                           'gitPersistenceLimit': 'Git stores regular files/literal links, not empty directories or hardlink topology; these are physical observations only.'}}
with (root / 'sealed-evidence.json').open('x') as stream:
    json.dump(report, stream, ensure_ascii=False, indent=2)
raw = (root / 'sealed-evidence.json').read_bytes()
print(json.dumps({'regularFiles': len(files), 'literalLinks': len(links), 'markerBytes': len(raw), 'markerSha256': hashlib.sha256(raw).hexdigest()}))
