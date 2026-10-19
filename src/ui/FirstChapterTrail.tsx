import type {GamePanelProps} from './game-types.ts'

/** An optional, factual first-chapter trail, never a reward or an auto-play policy. */
export function FirstChapterTrail({p,onOpen}:{p:GamePanelProps;onOpen:()=>void}){
 const first=p.features.firstOrder,w=p.features.workbench
 if(w.quarter!=='2020-Q1'||!['available','planned','running','awaiting_submission','review','delivered','settled'].includes(String(first.status)))return null
 const worked=w.employment.some(plan=>plan.segments.some(segment=>segment.to===null)),started=first.status!=='available',delivered=['review','delivered','settled'].includes(String(first.status)),paid=first.result.paymentFen>0
 return <button type="button" className="first-chapter-trail" onClick={onOpen} aria-label="翻开第一次尝试的实际进度"><span>第一章 · 把日子握在手里</span><ol>{[['留好工作',worked],['接下小单',started],['完成并交付',delivered],['实际回款',paid]].map(([name,done],index)=><li key={String(name)} data-done={done?'true':'false'}><i aria-hidden="true">{done?'✓':String(index+1).padStart(2,'0')}</i>{name}</li>)}</ol><small>{paid?'这笔回款已经发生。别忘了，余下的生活仍由你决定。':'一次可以跳过的尝试 · 每一步仍由你确认'} <span aria-hidden="true">→</span></small></button>
}
