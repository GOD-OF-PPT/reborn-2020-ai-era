# R4最终艺术/阶段代码独立复核

限定结论：旧两项已有实际源码修正，未发现新增确定的玩家动作/资金/阶段或锁绕过。仍待新R4生产图与实际操作；本报告不把旧R3图或代码空间变少当作当前画面通过。

本次10源SHA/bytes/mode保存在source-before/after.json及source-readback；读取前后全同。Choice45464B/SHAd4592e85fca296c3cf1230373d5f3b12ea425ba4f240f01a282b529c6b1dcbaf；Opening29904B/SHA1c7335d3586dda860b125a3957c5b851e2469373b5e243b04875ef8d091c33dc。相对上一独审的精确差异见changes-from-prior-review.diff。本次不改production，不运行测试/type/build/browser/Git/尺寸/几何/兼容；Root已报告的type/新12项/适用UI检查保持其原运行身份，不算本次执行。

## 旧发现闭合到代码层

1. 名单恢复入口：CourseTeachingChoice.tsx:199“逐位翻全部…”和“明确清除本稿名单”已在本班拟接名单长块之前，且清除仍只是函数setter明确清空personIds。即使167全选或超额旧稿保留，恢复控制的DOM顺序不再被所有移除项排到后面。默认/详细仍同enroll槽，原逐位checkbox/全选不截与固定footer完整保留；未用自动筛掉旧人或少交ID修复。具体顺序读回correction-readback.json均true。

2. 不能执行的工作旁路：OpeningMoment.tsx:177对明确cohort/audience，available<2或readOnly/hasCandidate时已提供“翻看这一班/这次受众的原记录”，caption明确只翻阅、不改安排/日期，接原inspectFocus同目标/owner/record。它在WorkQuarter分支之前，故旧planned93的1AP、readonly95不再先铺不可执行工作与长原因；原工作仍通过原书签/探索/原册可达，满足2AP且可工作的既有分支保留。待安排教学的02原Clock仍更优先，latestStart无回退逻辑未被旁路补正破坏。

这第二项是造成旧R3底部探索/地点互盖内容的一项具体源修正，不是已实拍关闭重叠。room-caption和moment-explore实际阅读/点击仍须根新R4图确认。

## 玩家动词与信息顺序

“按原记录先选/保留再补”只拟名单，“移除/清除”只改稿，“逐位翻”只导航；“核对受保护预款”保原CommandButton preview+confirm，按钮没有改成自动报名、默认选人或自动收款。已有未购身份来自当前availablePeople，旧稿重复/失效/超额保issue、不默筛。补齐函数读最新共享稿，未换target或抢书签。大来源名单不另设240人数上限，班额仍原合同上限；当前人数与拟收/保护按同对象实际preview。

stage-needed主念头仍选择原阶段资源/日期，02才可选原Clock；已安排/进行中主动作是等待原实际日期，能做别事的旁路是合法可执行工作或同对象查看，探索仍可到达。中断/unknown/legacy/季末责任优先，不把新Clock挤进强制决定。没有回退成常驻多列软件工作台或增加第四个永久大按钮。

## 钱、日期与阶段

原allowed preview才给拟receivedPrepaymentFen/protectedIncreaseFen，明确“确认并保存成功后才发生”，教学收入本次0。定义班额/支持预留、预售保护、实际两段交付、学习反馈/补支持、退款登记/实付/应付与feePosted/closed仍分开；没有因名单批次或只查看多给资源。实际阶段纸签只由父提交投影喂入，deliveredAt才完成；旧job历史不画后续新班。

courseStageWaitDate继续受同目标stage/days/原屏障校验，取原nextDate和公开latestStart较早日；到最迟开工日或之后返回null。continueDate在course-stage-needed仍只取这个可选日期，0AP时也不降级safeDate；原费用与Date/AP/权限沿AdvanceTime/Clock确认，不自动跳季或免费补课。只读/候选/旧revision/错误账户的request与CommandButton锁未被显示分支绕开。

推广措辞源码亦已按实际audience分开：标题/choice.label/wait用“这次推广”，班期教学/支持保“本班”。这是上一R2实图文案的代码修正，尚未以本轮新图实核，不冒称已消费。

## 非阻断残留与尚待实际图

重复状态句、低平道具的叠加/接触感、人物右臂局部轮廓黏连、底部的实际留白与拟名单页密度均仍按前次限定保留。新名单便笺与新Clock没有本次实际PNG，不保证同一页、无互盖或鼠标命中；不以移动控件顺序/减少一段工作错误提示代替画面证据。没有新增确定缺陷需要在本次代码审查中再开功能任务；Root下一步构建并沿原正常班期与退款/更新实际循环继续。
