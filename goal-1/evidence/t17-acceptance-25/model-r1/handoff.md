# C2模型交回

生产6文件与新增1测试已冻结，exact SHA/副本见source-final.json、final-source/；owned.diff保具体增量。source-binding.json四项均true：R7生产无漂移、R7原测试副本同、R8根结果输入无漂移、原5模型测试字节不变。

## 固定API

CourseSceneTarget只新增audience {businessId,courseId,audienceId} / cohort {businessId,courseId,cohortId,jobId?}；实体优先jobId/cohortId/audienceId，run/account保持OpeningFocus。courseTargetReason统一公开匹配；job严格属于同班原stage attempt/support或recovery slot，含唯一性和definition/biz，不改成最新。courseCohortJob导出于deep module。courseSceneProgress原undefined legacy / null明确入口 / 四参合同保留，新增可选teachingIntent；历史job的terminal状态historical:true且无默认新命令，需显选回同班无jobId目标。

新阶段包含audience planned/running/ready/empty/stopped/blocked；cohort enroll/update-required/stage-needed、stage planned/running/completed/cancelled/interrupted，support、recovery、refund-window、settling、closed及有限失败。原支持由Plan已预留，不创建第二安排命令。

courseFocusFromSaved加CreateAudience/PlanCohort/Enroll/StartStage/Recovery/Refund及原任务中断/改期：真实saved+同run+revision+1+原receipt+非候选/只读；Enroll/Refund保同班原引用。season只沿同课受众→原班谱系，同班原pin保持；Fund/Refresh/Advance不抢pin。季度原创建/任务开始，不因跨季改标签。C2 targets严格UIv1身份存取，坏原文保留、旧C1 v1照原读取不重写。

reel从原受众completedAt/班创建/学生paymentBatchId公开分组/阶段实际deliveredAt及operation/实际support/assessment/refund/fee/closed派生，原任务/班与原账可回；不假设features.course.payments，不用余额差报利润，退款登记和费登记不冒实付。旧班/更新/原债务入口保留。

## 实际验证与范围

R6 vitest-r6.log：6files81过，103.17s，含直接相关旧course/player/season/pref；该轮末season历史sample防旁路守卫有细化，最终源由R7再验。R7 vitest-r7.log：2files18过，47.93s，正常86实际继续与season。R8仅加根courseTeachingSceneResult真实before/after断言，原5case 5过27.53s，不再跑81。type-r5、type-r6均原tsc -b实终态0。保留所有前轮红日志。

normal86同控制器从Jan16已付样课：明确Fund15000，paid原价999/Jan17—24，5名实际公开意向报名；班Jan26—Apr20，guided Apr20—27；第1段Jan26—Feb5，第2段Apr2—12，H004实际发生后Mar14—21原更新，原公开反馈需要时Apr27—May4补支持，May5原窗口closed。未读隐藏roll/不保证报名或反馈；这是从已验原档的单测继续，不称本轮Chrome/Create全史。第二独立同86分支实际两班/原planned任务取消重排/单人¥999未交付全退款，验证错班、重复job、旧attempt、原pin、坏pref不写run。

新增根result断言：资本不是收入、营销无报名、Plan未收款、报名全保护收入0、planned未交付、实际阶段原金额、实际assessment、实际closed；候选/只读/sameRev/跨run不给成功；正常未交付退款应退¥999=原TX实付¥999，未造仍欠。非0应付并未被此分支实证，仍交根独立helper/原财务边界。

原C1/legacy默认及三形式/主题/四支持原规则保留，未改core/schema/P3。没有浏览器、兼容、全仓/旧P3矩阵、Git、声图或整体验收。
