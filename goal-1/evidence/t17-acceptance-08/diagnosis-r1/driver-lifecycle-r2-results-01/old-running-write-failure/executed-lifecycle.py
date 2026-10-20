with (p / 'matrix-r2-console.txt').open('x') as log:
    process = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT)
    with (p / 'matrix-r2-running.json').open('x') as out:
        json.dump({'command': command, 'started': started, 'pid': process.pid,
                   'state': 'launched; check actual process/session for liveness',
                   'resourceBounds': bounds}, out, indent=2)
    print(json.dumps({'startedMatrix': 'matrix-r2', 'pid': process.pid,
                      'registeredExpected': 72, 'resourceBounds': bounds}), flush=True)
    code = process.wait()
with (p / 'matrix-r2-complete.json').open('x') as out:
    json.dump({'command': command, 'started': started, 'finished': time.time(),
               'pid': process.pid, 'exitCode': code, 'state': 'terminal',
               'resourceBounds': bounds}, out, indent=2)
print(json.dumps({'matrix': 'matrix-r2', 'exitCode': code,
                  'elapsedSeconds': time.time() - started}), flush=True)
sys.exit(code)
