import type {EquityTargetResolution} from './equity-scene-target.ts'

export type EquityInvitationState='unread'|'planned'|'running'|'verified'|'unverified-authority'|'unwilling'|'stopped'|'used'|'declined'|'expired'|'closed-planned'|'closed-running'|'unknown'
/** Public meaning and paper state only; never an authority or a future outcome. */
export function equityInvitationState(r:EquityTargetResolution):EquityInvitationState|null{
 if(r.target?.kind!=='invitation')return null
 if(r.status!=='valid'||!r.invitation)return 'unknown'
 const i=r.invitation,j=r.job,working=j&&(j.status==='planned'||j.status==='running')
 if(i.status!=='open')return working?(j.status==='planned'?'closed-planned':'closed-running'):i.status==='used'?'used':i.status==='declined'?'declined':'expired'
 if(working)return j.status==='planned'?'planned':'running'
 if(i.reportAt!==null)return i.authority===true&&i.financingConsent===true?'verified':i.authority===false?'unverified-authority':i.financingConsent===false?'unwilling':'unknown'
 return j&&['cancelled','interrupted'].includes(j.status)?'stopped':'unread'
}
export const equityInvitationText:Record<EquityInvitationState,string>={unread:'介绍尚未核实',planned:'调查已排期 · 尚未开工',running:'调查进行中 · 尚无报告',verified:'本次授权与有条件意愿已核实','unverified-authority':'调查已结束 · 授权未核实',unwilling:'调查已结束 · 未有融资意愿',stopped:'调查已停 · 没有报告',used:'邀请已用于本局协议',declined:'邀请已拒绝 · 原投入保留',expired:'邀请已结束 · 原投入保留','closed-planned':'邀请已结束 · 原调查尚未开工','closed-running':'邀请已结束 · 原调查仍在进行',unknown:'邀请来源尚待核对'}
