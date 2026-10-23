import {VIDEO_JOBS} from '/Users/gordon/githome/reborn-2020-ai-era/src/content/video.ts';
import {isoDate,addDays} from '/Users/gordon/githome/reborn-2020-ai-era/src/core/calendar.ts';
import {moneyText} from '/Users/gordon/githome/reborn-2020-ai-era/src/ui/game-text.ts';
/** Browsing a tool is not a failed command; describe only its already public prerequisites. */
export function videoModeCaption(reasonCodes) {
    const era = reasonCodes.some(code => code === 'CAPABILITY_NOT_YET_AVAILABLE' || code === 'WORLD_RELEASE_NOT_OCCURRED');
    const access = reasonCodes.some(code => code.startsWith('MISSING_ENTITLEMENT:'));
    const unknown = reasonCodes.some(code => code !== 'CAPABILITY_NOT_YET_AVAILABLE' && code !== 'WORLD_RELEASE_NOT_OCCURRED' && !code.startsWith('MISSING_ENTITLEMENT:'));
    const lines = [];
    if (era)
        lines.push('这项工具在当前年代尚未开放');
    if (access)
        lines.push('使用前需先取得对应访问资格');
    if (unknown)
        lines.push('其他使用条件请查看完整记录');
    return lines.length ? lines.join('；') + '。' : '下一步核对资格、资源与开工日期。';
}
/** An estimate reads the selected original job; it never schedules or completes work. */
export function videoScheduleCaption(draft, action, currentDate) {
    const jobId = action === 'marketing' ? 'video-marketing' : action === 'rework' ? 'video-rework' : action === 'price' || action === 'scope' ? 'video-negotiate' : action === 'commission' || action === 'sample' ? `video-make-${action === 'commission' ? 'commercial' : draft.productId}-${draft.modeId}-${draft.materialId}` : null;
    const job = VIDEO_JOBS.find(item => item.id === jobId);
    if (!job)
        return '请先选择本次制作方式与素材，再核对这次投入和预计完成日。';
    if (!draft.resource || !draft.startAt)
        return '请先选择本次实际资源与开工日，再核对这次投入和预计完成日。';
    let completeAt;
    try {
        isoDate(draft.startAt);
        if (draft.startAt < currentDate)
            return '草稿里的开工日已经过去，请先重新选择日期。';
        completeAt = addDays(draft.startAt, job.durationDays);
    }
    catch {
        return '请先选择有效的开工日期，再核对这次投入与预计完成日。';
    }
    const label = action === 'marketing' ? '本次推广' : action === 'rework' ? '本次校正或返工' : action === 'price' ? '本次额外报价谈判' : action === 'scope' ? '本次缩小范围谈判' : '本次制作';
    const boundary = action === 'marketing' ? '预计不等于实际完成；推广完成后才看询价，询价不是订单或收入。' : action === 'rework' ? '素材校正与客户包含修改轮次分开计算。预计不等于实际完成；做完还须人工核对，验收与到账另记。' : action === 'price' || action === 'scope' ? '预计不等于实际完成；谈判可能失败，交付期限与已有费用继续。' : '预计不等于实际完成；做完仍须人工核对，商单的客户验收、应收与实收分别发生。';
    return `${label}直接成本${moneyText(job.costFen)} · ${job.actionPoints}点 · ${job.durationDays}日，预计${completeAt}完成。${draft.materialId === 'licensed' && (action === 'commission' || action === 'sample') ? '已含本单授权素材费用。' : ''}${boundary}`;
}
