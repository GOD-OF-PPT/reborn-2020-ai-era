# P3 组 A：正常前提、受众、价格与真实容量策略 R1

本策略先于 `src/testing/course-critical-prerequisites.ts` 建立。这里只登记源码推导与实施方案，不代表场景已执行或目标通过。权威范围为 root04 原计划、`course-shape-coverage-registration.json` 与 `course-matrix-policy-r2.md`；保留以下 14 个原 ID，正式采集仍须两背景、原 seed0、从本次 Create 实际取得并独立逐字重放的完整早期状态。旧 P1 日期/revision 只用于登记原接缝，不加载旧 raw 当新前史。

所有推进使用统一 `ctx.at(date)`，明确 `work:false`。只用公开 course/video/story 投影选择案例、课程、受众、工人和任务；不读隐藏 profile、helpRoll 或未来结果。拒绝经原 `CommandEnvelope` 实际 evaluate，核具体 reason 和完整 raw 不变；未知拒绝或缺失前提均 fatal，不换 seed、删除案例/资格、重置预算或合并原行。每个 `requiredChecks` 必须产生原文 milestone。

| 原 ID | 本次真实前史接缝 | 原命令、目标及必要前提 |
|---|---|---|
| case-missing | r87，真实许可视频商单已接、尚未付款 | 完整有效 DefineCourse 仅 cases=[]，实际 schema 拒绝 INVALID_PAYLOAD；再引用实际未付视频合同，实际业务拒绝 COURSE_PAID_CASE_REQUIRED。两者均保留，不能把 schema 拒绝冒充已付案例 guard。原已付手工首单不删除。 |
| enterprise-case-count | r67，2022-12-08 实际 ActivateBusiness 后 | 仅一个真实已付手工案例的 enterprise_training/foundation 定义，具体拒绝 COURSE_DEEP_CASES_REQUIRED。大纲与营业状态已实际成立，不能用 r64 的 preparing 状态遮挡目标。 |
| material-rights-missing | r99，视频实际回款后、尚未课程许可 | 同企业用已付首单和真实 licensed 视频定义课程，再 BuildCourseSample，拒绝 COURSE_MATERIAL_RIGHTS_REQUIRED。普通素材许可不等于课程素材权利。 |
| material-rights-interrupted | r106，2024-01-01 实际课程许可已计划 | 推进至该原 job.startAt、确认 running 后才 InterruptJob；必须实际 interrupted，保留已花 30000 分与 1AP。用同一视频案例定义样课，拒绝 COURSE_MATERIAL_RIGHTS_REQUIRED。planned 取消不冒充中断，许可记录存在不冒充权利完成。 |
| qualification-missing | r67，视频工具资格尚未开放的实际日期 | 实际营业、已有大纲及已付首单下定义 video_workflows/foundation；BuildCourseSample 具体拒绝 COURSE_TOOL_QUALIFICATION_REQUIRED。保留实际已有图像资格，不从晚档删除资格；日期与公开 qualificationReasons 如实保留。 |
| audience-paid | r71，2023-01-16 样课实际完成、原首个受众创建前 | 当前 practical_cohort/image/foundation ready 且无未决更新；以原 base price、本人资源、当前日期 CreateCourseAudience paid。核实际营销任务 600000 分、1AP、7 日，开始时 completedAt=null/无提前成员；真实完成后再核成员及 completedAt。预售款、营销费与收入不混计。 |
| audience-referral | r71，同上 | 引用已经公开且同 segment、date<=now 的真实 video cohorts，CreateCourseAudience video_referral。核 sourceCohortIds、实际成员非空/唯一/不超过来源总人数、job=null/当前完成日期和现金/AP 不变；不造新人口。公开投影仅显示来源人数，不能借此声称独立重算身份并集；完整身份并集由正式独立原文/命令重放核定。 |
| price-min | r71，同上 | 真实转介来源，实际接受原产品 minPriceFen（实操班 29900），核冻结价格与实际 audience。 |
| price-max | r71，同上 | 真实转介来源，实际接受原产品 maxPriceFen（实操班 199900），核冻结价格；不要求虚构高价购买者。 |
| price-below | r71，同上 | minPriceFen-1 仍为合法正整数载荷，具体拒绝 COURSE_PRICE_OUT_OF_RANGE，完整 raw 不变。不能用 price=0 的 schema 拒绝替代。 |
| price-above | r71，同上 | maxPriceFen+1 的合法载荷，具体拒绝 COURSE_PRICE_OUT_OF_RANGE，完整 raw 不变。 |
| self-capacity-over | r72，原完成受众后、原 PlanCourseCohort 前 | 原 ready 实操班与非空已完成 audience，其他日期合法，本人单资源 self_small，seatLimit=selfCapacity+1（21），具体拒绝 COURSE_SUPPORT_CAPACITY_EXCEEDED。 |
| product-capacity-over | r72，同上 | 同一合法前提，本人单资源 guided_group，seatLimit=capacity+1（41），具体拒绝 COURSE_SUPPORT_CAPACITY_EXCEEDED。 |
| three-resources-capacity | r85，原图像班实际关闭后 | 保留原全部履约与预算；实际 HireWorker editor-lin/assistant-zhou、各 50000 分招聘费、每次 1AP、实际 300000/250000 分月薪。普通 FundBusiness 只能从本局个人可用现金配平转入，不发钱。实际本人+两位雇员三独立资源，先拒绝 121，再接受 120 席 guided 支持，三个原 job 各 40 容量、300000 分/1AP/7日，总 900000 分/3AP；完整核预留、资源唯一性、真实工资与全局 4AP。120 是支持容量，不是已有 120 人或 120 名毕业生。 |

## 三资源的有限排程与现金

r85 的 Q2 原支持/补支持不改，招聘两次使用实际剩余 2 点；若原已花点不足，真实缺口按 fatal 留档，不挪回旧工作或跳过费用。优先固定教学 2023-07-01—2023-07-21（两段各 10 日、Q3 合计 2AP），班期 07-01—07-22（满足 21—90 日），原三资源 guided 支持 10-01—10-08（Q4 3AP、班期后 90 日内）。图像资格必须公开覆盖教学全期，不假设永久有效。正常月份工资/公司维护继续实际发生；不依赖未来学费付工资或支持。

可用原个人自有资金追加 1500000 分到课程企业，先核实际 personal.availableFen；配平转入不计利润。招聘前后核招聘费/AP；推进首个实际月末工资后，逐雇员核原 payroll.operationId、应计金额和原债务已经实际支付，并保留招聘后第一时刻的原工资率。根代理已明确本原行门槛是三真实资源/120 计划容量/三份原支持成本与未来 3AP，加真实已付工资，不要求卖满或另做完整闭班。因此本模块停在合法预留及实际工资已付，明确 futureTeachingAndSupportExecuted=false；未来 planned 不冒充 completed。公开图像许可的实际有效期仍决定任何随后真实教学，不将本计划解释为永久资格。所有财务从原流水和独立 cash-delta/AP helper 复算，不能信 collector 布尔。

## 依据与验证边界

原 schema：`src/application/course-commands.ts`；已付案例、两案例、素材权利、资格、价格、受众及容量 guard：`src/core/course.ts`；公开投影：`src/core/course-projection.ts`；原产品/营销与支持常量：`src/content/course.ts`；真实招聘/工资/日期资源：`src/core/operations.ts`、`src/core/operations-types.ts`、`src/content/operations.ts`；正常接缝：`src/testing/normal-course-scenario.ts`、`src/testing/course-matrix-prefix.ts`。统一尝试/原文检查：`src/testing/course-critical-context.ts`。

当前只写策略和独立 testing 模块，不运行场景、测试、类型检查、构建、浏览器或页面兼容工作。根代理在源冻结后串行严格类型、完整登记和实际执行；源码推导不计 90 行实际通过。无生产规则、参数、依赖、旧封存目录或 Git index/HEAD 修改。

[杠精审查] 执行前策略限定通过：14 原 ID 不减；schema 与业务拒绝区分；许可 planned/cancelled/interrupted/completed 区分；免费转介与付费营销区分；真实三资源、工资、现金、日期及原 4AP 不降级；运行验证仍未执行。
