with (p / 'matrix-r2-console.txt').open('x') as log:
    process = subprocess.Popen(command, stdout=log, stderr=subprocess.STDOUT)
    try:
        try:
            with (p / 'matrix-r2-running.json').open('x') as out:
                json.dump({'command': command, 'started': started, 'pid': process.pid,
                           'state': 'launched; check actual process/session for liveness',
                           'resourceBounds': bounds}, out, indent=2)
        except OSError as error:
            metadata_errors.append({'file': 'matrix-r2-running.json', 'error': str(error)})
        print(json.dumps({'startedMatrix': 'matrix-r2', 'pid': process.pid,
                          'registeredExpected': 72, 'resourceBounds': bounds,
                          'metadataErrors': metadata_errors}), flush=True)
    finally:
        # A failed post-launch metadata write must never abandon a live collector.
        code = process.wait()
try:
    with (p / 'matrix-r2-complete.json').open('x') as out:
        json.dump({'command': command, 'started': started, 'finished': time.time(),
                   'pid': process.pid, 'exitCode': code, 'state': 'terminal',
                   'resourceBounds': bounds, 'metadataErrors': metadata_errors}, out, indent=2)
except OSError as error:
    metadata_errors.append({'file': 'matrix-r2-complete.json', 'error': str(error)})
driver_code = code if not metadata_errors else 1
print(json.dumps({'matrix': 'matrix-r2', 'exitCode': driver_code, 'collectorExitCode': code,
                  'metadataErrors': metadata_errors, 'elapsedSeconds': time.time() - started}), flush=True)
sys.exit(driver_code)
