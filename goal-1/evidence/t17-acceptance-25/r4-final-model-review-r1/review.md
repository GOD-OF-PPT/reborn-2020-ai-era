# R4最终模型/安全只读复核

结论：发现1处确定等待合同缺口，已即时交Root并由game_mainline_design接最小R5共享cap/null修缮；其余本轮指定模型/资金/状态/同稿范围未见另一项确定阻断。当前不能把R4整体写成无问题，也不预报R5修后或Chrome通过。本代理没有写任何production/原test/P3，没有执行新测试、profile、浏览器或兼容。

## 发现 R4-W1：近景原记录页可绕过已公开最晚开工日

CourseTeachingChoice.tsx:175用普通nextDate经playableAdvanceDate产生safeDate，:183在record页直接给ClockAdvance；只有OpeningMoment.tsx:64的courseStageWaitDate对course-stage-needed封顶latestStart且到期返回null。当前真实saved92已被原OpeningMoment.course-wait.test.ts:47/53核为nextDate Jan31、第一段最晚开工Jan30。

确定路径是stage-needed→打开第1段选择页→点“返回这份原记录”→record主Clock仍给Jan31；到Jan30也可继续给Jan31。主幕正确封顶Jan30，近景却能以同句“不新增安排，让原日子继续”直接越过该已公开最后开工日，使原10天教学无法按期。原AdvanceTime规则允许承担失败，问题是同一可选安全等待入口的接缝不一致，不是钱/AP或规则计算错误。此为活源静态与既有真实view证据相合，未新跑/未冒称Chrome已重现。

最小修法已被Root接受：主幕和近景record复用同一stage-needed cap/null；保持已有planned/running wait、非stage-needed等待、原时钟屏障与完整有限退出，不改规则/日期或强行自动安排。Root已派book owner新增真实92 handler回归并fresh R5；本复核不修改其owned源，也不预报绿。

## 其余已核边界

- 目标：run/account/biz/course/audience/cohort及可选job身份逐级重匹配，未知/错账户/跨班/重复job无默认首班补全；cohort.jobId只准该班原stage attempt/support/recovery，历史sample/job保持原记录，返回同班须显选。refresh仍原course target，不塞进cohort.jobId；inspect传实际recordId到同对象原册。
- 状态：安排/开工/实际completed分开，不以日历达到日期造完成；唯一原active refresh优先给planned/running/wait，完成applied后回原下一步。旧closed/settling班与历史job不被新更新夺走。StartStage/Recovery/Plan等仍原CommandButton预览/确认，Plan已预留支持，不另生成免费支持命令。
- 真款：Fund是个人资本转入；Enroll显示原preview预款/保护且收入0；阶段完成只按实际stage.amountFen释放保护/确认收入，不再收钱、不推余额差利润。退款由原学生/knowledge product/阶段累计核应退；纯结果以refund.operationIds匹配原TX和未清obligation，费入账不等实付，closed只看实际closedAt及原无剩余应付。
- 财务与纸签：received按本cohort原正向TX；registered/paid/due与fee posted/paid/due分列，active protection来自原contract及退款应付reservations，未使用students.refundedUnearned把未付保护消零。先前F05真实原命令的paid5000+owed/protection5000、部分付3000仍保2000、窗口后未closed、原工资后付余才closed证据仍是独立财务fixture/partial官方projector，不冒充正常Chrome。
- saved/候选/只读：C2结果要求同run、revision+1、原receipt.kind/revision、saved、无candidate/readOnly；App只在真实saved后映射新公开对象/回响，失败candidate保旧view，retry沿原payload，不重造命令或学习结果。当前确认反复调用原preview，候选/只读/冲突/忙碌/stale revision阻止提交，查看或取消不写游戏。
- 同稿：App三类memory各useMemo按runId建实例；教学key含run/account/biz/course/audience/cohort/slot，准备key独立含case许可槽；读写copy所有数组，函数setter读最新Map，日期/页码/revision不更换槽或静默补今天。target/subject/slot不匹配明确重选，原册与场景使用同run实例，preview/cancel不换primary。
- 关注/旧职责：pref只存完整身份、严格字段与季度，无金额/preview/结果；坏原文保留，存储异常只提示偏好未记下。新受众→班期只沿同课原来源；同班/Refresh/Enroll/Refund保原pin，AdvanceTime不改quarter。原旧班/更新/欠款/资金缺口/强制事件仍在remaining/完整原册与原规则中，不因普通1主2支预算删除。
- 未知结果：UI使用公开实际audience/availablePeople和已出现assessment/outcome；未完成推广不编学生，未形成assessment不判断哪个人需要帮助，未显示helpRoll或未来H004/权限批准对白。辅助/委托仍显选已有同business部署，期限/额度/外部授权由原preview最终核；没有隐式扩权、融资或新招生。

## 既有执行证据与准确适用源

本次只读unit-cs3-original-retries-r2正式原Vitest记录：原两项5秒/原断言实际2/2过、39跳过，exit0、488源无漂移；不是diagnostic harness替代。该记录早于R4字词/交互三文件变化（course-cohort-progress、CourseTeachingChoice、OpeningMoment），不可声称全当前源逐字相同。

R4 UI累计start命令为原vitest/config、maxWorkers1、排除暂停book-layout、src/ui；真实58文件/380项全过、exit0、488源无漂移，隔离未禁；type-r4真实exit0/源无漂移。本复核23份输入逐项SHA与这两份R4源记录一致，复核首末亦同，见evidence-binding.json。它们是支持检查，不是Chrome/人类趣味性/全S3或goal证据；原936/早期超时和所有旧红仍保留。

本review固定R4（source-before/source-after和source-readback），发现的record等待修缮由Root走新R5身份、定向回归/构建/当前Chrome及原文审核。未覆盖新R5源、实际鼠标路径、最终多阶段场景/收尾/受挫实图或全游戏，不能从静态/380绿把它们补成通过。
