import fs from 'node:fs'
import {signedEquity} from '../../../../.delivery/t17-u6-equity-history-r450/src/testing/deepseek-scenarios.ts'
const r=signedEquity({},'liquidity',800000);r.h.send('AdvanceTime',{date:'2025-09-01'});fs.writeFileSync('goal-1/evidence/t17-acceptance-40/follow-rights-r451/liquidity-fixture.json',r.h.codec.export(r.h.run),{flag:'wx'});console.log({origin:r.h.run.origin,revision:r.h.run.revision,date:r.h.run.timeline.cursor.date,preemptive:r.h.run.deepseek!.agreements[0]!.preemptive})
