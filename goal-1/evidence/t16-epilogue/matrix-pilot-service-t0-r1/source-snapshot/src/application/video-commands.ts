import { z } from 'zod';
import { defineCommand } from '../core/commands.ts';
import { idSchema as id, dateSchema as date } from '../core/record-schemas.ts';
import { videoMaterial, videoMode, videoProduct, videoProgram, videoSegment } from '../core/video-schema.ts';
import type { VideoRuntime } from '../core/video.ts';
const assignment = { resources: z.array(id).length(1), startAt: date };
const production = { channelId: id, modeId: videoMode, materialId: videoMaterial, ...assignment };
export function createVideoHandlers(runtime: VideoRuntime) {
    const schemas: Record<string, z.ZodType<Record<string, unknown>>> = { OpenVideoChannel: z.strictObject({ name: z.string().trim().min(1).max(60), segment: videoSegment, businessId: id.optional() }), StartVideoWork: z.strictObject({ ...production, productId: videoProduct }), StartVideoMarketing: z.strictObject({ channelId: id, ...assignment }), ApplyVideoProgram: z.strictObject({ channelId: id, program: videoProgram, ...assignment }), DecideVideoProgram: z.strictObject({ applicationId: id }), ReviewVideoOutput: z.strictObject({ workId: id, disclosure: z.enum(['manual', 'ai_assisted', 'synthetic']) }), ReworkVideo: z.strictObject({ workId: id, ...assignment }), PublishVideo: z.strictObject({ workId: id, monetization: z.enum(['none', 'ads', 'affiliate']), label: z.boolean().default(false) }), UnlistVideo: z.strictObject({ publicationId: id }), AcceptVideoCommission: z.strictObject({ ...production, cohortId: id, clientId: id }), SubmitVideoCommission: z.strictObject({ contractId: id }), NegotiateVideoCommission: z.strictObject({ contractId: id, proposal: z.enum(['price', 'scope']), ...assignment }), ExitVideoCommission: z.strictObject({ contractId: id }), CollectVideoSettlement: z.strictObject({ settlementId: id }), AbandonVideoWork: z.strictObject({ workId: id }) };
    return Object.entries(schemas).map(([kind, schema]) => defineCommand(kind, schema, (view, payload) => runtime.inspect(view, { ...payload, kind }, view.date), (model, payload, context) => ({ model: runtime.apply(model, { ...payload, kind }, context.commandId), summary: `视频决策已保存：${kind}`, domain: 'video' })));
}
