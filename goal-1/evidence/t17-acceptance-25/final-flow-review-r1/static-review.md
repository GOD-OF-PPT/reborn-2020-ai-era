# C2完整玩家流程静态复核 R1

结论：发现1处需要修复的确定接续问题，已即时交Root；其余指定接线未发现新的确定缺陷。当前是源码审查，不是Chrome/人类体验验收。

## 必要修正

已安排课程更新后，cohort（audience同类）仍以unresolvedUpdates返回“安排原更新”/refresh编辑意图，没有呈现本课原active refresh的planned/running与反馈日。原规则拒重复任务，因此不是重复扣钱，却会使主CTA与已提交事实不符、重进后仍要求重做。依据course-cohort-progress.ts:65/:75、course-player-thread.ts:110–114、CourseTeachingChoice.tsx:150/:158。详finding-1-refresh-wait.md及3份原源码读本；应先识别本课唯一公开active refresh并等原job，再在没有active时提供选择，保同班pin和原屏障。

## 已核清的接线与边界

- ready86主CTA在OpeningMoment:143进入gateway；CourseSceneChoice:139将当前ready课程（含同次已完成sample target）分派TeachingChoice；模型course-ready的teachingIntent为audience，activate:150打开真实获客页。报价/来源/资源/日期均须显选，无自动转资金或借用不匹配受众。
- 实际saved仅同run/新revision/原receipt/公开新增记录映射；App:95–128保完整payload，season pinned同cohort保持旧关注。明确选中的旧stage完成后通过Opening:142或近景record明确返回本班，才去掉jobId，不自动修到最新attempt。
- third teachingSlot从Opening:149、Narrative:184、gateway第三参数贯通App:177–188至Panel；显传新target无recordId清旧ID，只有同screen且target===undefined才继承。Stage旧入口也给同cohort/slot，Panel原recordId验同课程/班期，不静默找全局首班。
- 两类Map由App:68–69按run唯一创建；C2 key不含date/revision/page，capital/refresh为空audience/cohort的同course辅助槽，班期步骤为真实co.audienceId/co.id；C1准备槽分开。过期日期/失效资源保原值并提示，无默认资源/支持/20人。
- 原公开更新与全部旧班/支持保留在模型当前cohort分支、随身/季度责任及原册；未公开的历史变化或个体学习结果没有在近景预报。原款区分预款保护/实际教学确认/已记退款与实退/结算费入账与待付，未知钱款不冒称零。
- 0AP可保稿、回原record用原ClockAdvance、显选停止/退款；现金短缺/到期应付/强制事件仍由Opening独立override和SceneAttention呈现。readonly/candidate/conflict/stale revision有原近景提交与换对象门槛；App retry原payload且open:false，不复活已关闭原册。

原模型正常示例使用的Jan17–24推广、Jan26第一段、实际已公开更新后的原更新等待、Q2第二段与支持/退款窗口可帮助逐段核入口；本次未运行它们，也不把模型日期写成玩家提前知道的未来事件。

## 待实际C端

尚未收到本轮新Chrome图。默认CTA点击、纸页真实分页与按钮到达、旧job返回、正在更新等待、资金不足/0AP的可理解性、实际保存后的反馈与重进需Root当前窗口核。没有切尺寸/缩放/浏览器或执行兼容/矩阵。新图到达后另写画面记录，不回写本R1原问题身份。

初始14源/追加3源及读回差异见static-source-readback.json；Root后续修缮若改变源，按新源另定向复核，不把原R1改称全绿。
