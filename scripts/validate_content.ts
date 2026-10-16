import { campaignRuntime, campaignOperations,campaignMarket,campaignVideo,campaignCourse, createCampaignRun, createCampaignCodec } from '../src/application/campaign.ts'
import { BOOTSTRAP_CONTENT } from '../src/content/bootstrap.ts'

const codec = createCampaignCodec()
for (const profile of BOOTSTRAP_CONTENT.profiles) {
  const run = createCampaignRun({ runId: `validate-${profile.id}`, actorId: 'player', commandId: 'validate-create', backgroundId: profile.id, seed: 'content-validation-seed' })
  if (codec.import(codec.export(run)).world?.packHash !== campaignRuntime.hash) throw new Error('content binding roundtrip failed')
}
if(new Set(campaignMarket.catalog.assets.map(a=>a.exposure)).size!==5||campaignMarket.catalog.checkpoints.length!==216||campaignMarket.catalog.mode!=='simulation')throw new Error('market category/calendar/simulation contract failed')
for(const mode of campaignVideo.catalog.modes)if(!campaignRuntime.pack.capabilities.some(c=>c.id===mode.capability))throw new Error('Invalid video capability')
for(const program of campaignVideo.catalog.programs)if(!campaignOperations.catalog.jobs.some(j=>j.id===program.jobId)||(program.anchorId!==null&&!campaignRuntime.pack.anchors.some(a=>a.id===program.anchorId&&a.availableAt===program.from)))throw new Error('Invalid video program/anchor')
for(const topic of campaignCourse.catalog.topics)if(!campaignRuntime.pack.capabilities.some(c=>c.id===topic.capability))throw new Error('Invalid course topic capability')
for(const id of campaignCourse.catalog.updateAnchorIds)if(!campaignRuntime.pack.anchors.some(a=>a.id===id&&a.enabled))throw new Error('Invalid course update anchor')
const pack = campaignRuntime.pack
console.log(JSON.stringify({ result: 'PASS', evidenceType: 'runtime_content_schema_and_initial_bindings', version: pack.version, contentHash: campaignRuntime.hash, anchors: pack.anchors.length, sources: pack.sources.length, capabilities: pack.capabilities.length, events: pack.events.length, initialProfiles: BOOTSTRAP_CONTENT.profiles.length,operations:{version:campaignOperations.catalog.version,businesses:campaignOperations.catalog.businesses.length,jobs:campaignOperations.catalog.jobs.length,productionOffers:campaignOperations.catalog.offers.length,workers:campaignOperations.catalog.workers.length}, course:{version:campaignCourse.catalog.version,products:campaignCourse.catalog.products.length,topics:campaignCourse.catalog.topics.length,sharedAudience:true},video:{version:campaignVideo.catalog.version,modes:campaignVideo.catalog.modes.length,programs:campaignVideo.catalog.programs.length,qualification:'fictional_game_approval_not_real_access'},market:{version:campaignMarket.catalog.version,stocks:campaignMarket.catalog.assets.length,exposures:5,checkpoints:campaignMarket.catalog.checkpoints.length,rules:campaignMarket.catalog.rules.length,historical:campaignMarket.catalog.historical.status}, notCovered: ['all_business_paths', 'browser_ui', 'balance', 'playtest'] }, null, 2))
