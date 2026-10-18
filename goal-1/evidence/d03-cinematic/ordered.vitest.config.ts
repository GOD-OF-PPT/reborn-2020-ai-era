import {defineConfig,mergeConfig} from 'vitest/config'
import original from '../../../vitest.config.ts'
import CinematicSequencer from './ordered-sequencer.mjs'

// Only explicit order/reporting differ. No assertion, deadline or isolation changes.
export default mergeConfig(original,defineConfig({test:{pool:'forks',isolate:true,reporters:['verbose'],sequence:{sequencer:CinematicSequencer}}}))
