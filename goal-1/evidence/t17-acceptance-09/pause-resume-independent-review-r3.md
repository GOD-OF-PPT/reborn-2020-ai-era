# pause-resume R3 独立只读复核

限定结论：未发现新增确定漏洞。仅复核本次顺序补正，不重做旧分组、19工具或实际GameRun；没有操作当前矩阵、浏览器、视口、兼容或服务，没有写入源码/冻结源/旧sealed目录。本文件新建于root09，不能代替仍由根代理负责的完整90及独立全量审核。

## 原目标与实际记录

当前 `src/testing/course-critical-risk.ts` SHA256 为 `ffccd84f74a67b6628df889d8d523fec88b29b599c0a450e826706d27f61714c`，与 `pause-resume-regression-r3/report.json` 的 currentRiskSourceSha256 相同。复核了 `policy-risk-pause-r3.md`、该报告与 case-record；17个登记source/milestone/final原文的bytes/SHA均只读匹配。报告的7接受/2拒绝/15观察/终态80、Jan16及已有独立重放结果相互一致；本复核没有自行执行重放或创建新局。

原六项 requiredChecks 均保留，另加两项明确证明最终恢复保持教学计划、教学班仍不招生。定向记录来自原R2已实际挣得的revision73，不是本次新Create，更不是新R3全90通过。原R2错误 COURSE_ENROLLMENT_CLOSED 保留，政策准确说明旧顺序错误，不改生产规则。

## 两次恢复与原款/预算

首次暂停在第一10人已实际付款之后；拒绝载荷为另一组10名原公开合格、尚未收费的人。第一次恢复保持同班open、仍仅原10人、完整经济状态不变；随后另一次真实命令才向第二10人收款。两批各10人、999000分，合计20人/1998000分原预款与保护，确认收入为0。第一条暂停拒绝与随后同一第二批载荷成功，排除了靠非合格人口、满额或重复身份制造暂停拒绝。

再次暂停时20人和原支持仍在，随后在课程paused=true时规划同班原首段。任务真实字段为 Jan18开始、Jan28完成、本人单资源、1AP/0现金、planned；当前仍Jan16、deliveredAt=null、两段收入0，未把规划当交付。第二次恢复保持status=teaching，学生身份、两笔原款、stages/stageJobs/supportJobs及完整经济状态均逐项相同，没有重新规划、取消或重开教学。

原guided支持仍为原同一job，Apr1—8、本人、容量40、300000分/1AP、planned/reserved；没有替代成免费支持。最终Q1为样课spent1+首段reserved1，Q2为原支持reserved1。原预款保护1998000加原支持预留300000等于held2298000分；两次Pause/Resume没有增加收费、现金成本或AP。

## 原守卫先序

`src/core/course.ts:60` 的active检查先检查课程暂停；第一次实际报名拒绝 COURSE_NEW_ENROLLMENT_PAUSED，整档不变。恢复时生产命令仅改课程paused，不改本班状态；StartCourseStage在规划时将本班置teaching（原apply），原报名守卫仍要求status=open（course.ts:201）。

最终Resume后课程已不paused，当前Jan16仍早于Jan18，原班却为teaching，所以最终实际 COURSE_ENROLLMENT_CLOSED 来源确实是原班期状态。该守卫先于person资格/重复转化/容量检查；尽管最后载荷选择一名已报名者，也不会以 AUDIENCE_ALREADY_CONVERTED 冒充关闭理由。若错误恢复本班open，该具体reason断言就会失败。两拒绝均有额外 complete-raw-unchanged 观察，保持原命令实际拒绝语义。

本次只证明顺序补正和既有定向证据的限定一致性，未发现需要改冻结源的具体事项；完整R3/原90及所有父任务仍以根代理后续实际终态为准。
