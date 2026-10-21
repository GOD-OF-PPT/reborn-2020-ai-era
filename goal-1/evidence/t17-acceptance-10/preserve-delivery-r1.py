from pathlib import Path
import hashlib
import json
import urllib.request
import time

task = Path(__file__).absolute().parent
project = task.parents[2]
sha = lambda raw: hashlib.sha256(raw).hexdigest()
prior = json.loads((project / 'goal-1/evidence/t17-acceptance-03/final-current-and-protected-http.json').read_text())
later = json.loads((project / 'goal-1/evidence/t17-acceptance-09/delivery-preservation-r1.json').read_text())
current = json.loads((task / 'production-build-r1.json').read_text())
deliveries = [{'port': d['port'], 'build': d['build'], 'expected': {r['file']: {'bytes': r['bytes'], 'sha256': r['sha256']} for r in d['files']}} for d in prior['deliveries']]
deliveries += [{'port': d['port'], 'build': d['build'], 'expected': d['expected']} for d in later['entries']]
deliveries.append({'port': 5312, 'build': current['buildDirectory'], 'expected': current['files']})
rows, errors = [], []
started = time.time()
for item in deliveries:
    build = project / item['build']
    files = {p.relative_to(build).as_posix() for p in build.rglob('*') if p.is_file() or p.is_symlink()}
    if files != set(item['expected']):
        errors.append('RESOURCE_SET_CHANGED:' + str(item['port']))
    result = {**item, 'resources': [], 'home': None}
    for name, expected in item['expected'].items():
        path = build / name
        if path.is_symlink():
            raise RuntimeError('REGULAR_DELIVERY_FILE_REQUIRED')
        raw = path.read_bytes()
        disk = {'bytes': len(raw), 'sha256': sha(raw)}
        try:
            request = urllib.request.Request(f'http://127.0.0.1:{item["port"]}/{name}', headers={'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache'})
            with urllib.request.urlopen(request, timeout=5) as response:
                body, status = response.read(), response.status
            http = {'bytes': len(body), 'sha256': sha(body), 'status': status}
            passed = disk == expected and http['status'] == 200 and body == raw and path.read_bytes() == raw
            result['resources'].append({'file': name, 'disk': disk, 'http': http, 'passed': passed})
            if not passed:
                errors.append(str(item['port']) + '/' + name)
        except Exception as error:
            result['resources'].append({'file': name, 'disk': disk, 'passed': False, 'error': str(error)})
            errors.append(str(item['port']) + '/' + name)
    try:
        with urllib.request.urlopen(f'http://127.0.0.1:{item["port"]}/', timeout=5) as response:
            body, status = response.read(), response.status
        result['home'] = {'status': status, 'bytes': len(body), 'sha256': sha(body), 'passed': status == 200 and body == (build / 'index.html').read_bytes()}
        if not result['home']['passed']:
            errors.append('HOME_CHANGED:' + str(item['port']))
    except Exception as error:
        result['home'] = {'passed': False, 'error': str(error)}
        errors.append('HOME_UNAVAILABLE:' + str(item['port']))
    result['passed'] = all(r['passed'] for r in result['resources']) and result['home']['passed']
    rows.append(result)
report = {'scope': 'Read-only original resource disk/SHA and HTTP preservation, not Chrome/rendering/compatibility/playtest',
          'deliveries': rows, 'builds': len(rows), 'resourceGets': sum(len(d['resources']) for d in rows), 'homeGets': len(rows),
          'passed': not errors, 'errors': errors, 'elapsedSeconds': time.time() - started}
with (task / 'delivery-preservation-r1.json').open('x') as stream:
    json.dump(report, stream, indent=2)
print(json.dumps({k: v for k, v in report.items() if k != 'deliveries'}), flush=True)
raise SystemExit(int(bool(errors)))
