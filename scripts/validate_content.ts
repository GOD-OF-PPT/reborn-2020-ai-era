import { campaignRuntime, createCampaignRun, createCampaignCodec } from '../src/application/campaign.ts'
import { BOOTSTRAP_CONTENT } from '../src/content/bootstrap.ts'

const codec = createCampaignCodec()
for (const profile of BOOTSTRAP_CONTENT.profiles) {
  const run = createCampaignRun({ runId: `validate-${profile.id}`, actorId: 'player', commandId: 'validate-create', backgroundId: profile.id, seed: 'content-validation-seed' })
  if (codec.import(codec.export(run)).world?.packHash !== campaignRuntime.hash) throw new Error('content binding roundtrip failed')
}
const pack = campaignRuntime.pack
console.log(JSON.stringify({ result: 'PASS', evidenceType: 'runtime_content_schema_and_initial_bindings', version: pack.version, contentHash: campaignRuntime.hash, anchors: pack.anchors.length, sources: pack.sources.length, capabilities: pack.capabilities.length, events: pack.events.length, initialProfiles: BOOTSTRAP_CONTENT.profiles.length, notCovered: ['all_business_paths', 'browser_ui', 'balance', 'playtest'] }, null, 2))
