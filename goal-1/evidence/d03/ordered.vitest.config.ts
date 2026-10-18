import {defineConfig,mergeConfig} from 'vitest/config'
import original from '../../../vitest.config.ts'
import D03OrderedSequencer from './ordered-sequencer.mjs'

// Same original environment/assertions/deadlines and one isolated fork per file.
// Only file order and diagnostic reporting differ; no setup is moved outside hooks.
export default mergeConfig(original,defineConfig({test:{pool:'forks',isolate:true,reporters:['verbose'],sequence:{sequencer:D03OrderedSequencer}}}))
