# 课程45项关键边界源码调查 R3

**源码推导、不是执行结果。** 本文件只记录只读独立调查；没有运行测试、回放或浏览器，没有修改生产代码。原45项×两背景的90分支全部保留，未据本调查增加任何实际通过数。用户禁止的页面兼容开发与测试未执行。

主要依据：`src/core/course.ts:115`起的inspect、`:259`起的apply、`:375`起的退款、`:410`起的sync及`:468`起的世界/期限处理；`src/application/course-commands.ts:8`起的命令schema；`src/testing/normal-course-scenario.ts:7`起的正常前史；`src/core/story-state.ts:30`起的授权、`:48`的hasAgentBusinessResult；`src/core/story-agency.ts:25`起的部署/扩权/停止守卫。行号为本次调查源码位置，具体条件以当前源码为准。

## 正常里程碑定义

下列里程碑均需从每个背景的固定seed0真实创建历史获得，保留完整原命令前缀，不能从晚期档删字段制造。

- O：公司已真实开办、大纲完成并Activate，原首单已付。
- V待付／V已付：新增manual/licensed视频商单已接受但未结算／已真实回款且feePosted、无该商单欠款。
- D／S／A／C／E：课程已定义／样课实际完成／受众实际完成／班期安排完成／实际报名完成且尚未排教学。
- T0／T1：第0／第1段实际交付完成，下一段尚未安排。
- F：两段完成，原支持实际完成并公开出现学习反馈。
- Z：退款窗口后实际fee_close、无遗留欠款而关闭。
- G：2024-10-01后真实部署完成，同主体approval初始授权。
- R：同主体实际辅助支持完成且已有真实有金额阶段交付。
- U：实际历史anchor发生且已有原学生的未关闭班期被记入affectedCohortIds。

## 原45项完整实施表

| 原ID | 所需真实里程碑、最短后缀与预期 |
|---|---|
| case-missing | O+V待付，用实际未付视频合同作为唯一cases执行DefineCourse，预期COURSE_PAID_CASE_REQUIRED。不要传cases:[]后声称业务守卫通过；空数组先被schema以INVALID_PAYLOAD拒绝。 |
| enterprise-case-count | O，DefineCourse enterprise_training仅引用原已付首单，预期COURSE_DEEP_CASES_REQUIRED。无需删除已有第二案例，明确只选一个即可。 |
| material-rights-missing | O+V已付，以该licensed视频定义课程，然后BuildCourseSample，预期COURSE_MATERIAL_RIGHTS_REQUIRED。原视频素材许可不等于课程许可。 |
| material-rights-interrupted | 上项D；LicenseCourseMaterials实际开工→InterruptJob→BuildCourseSample，仍COURSE_MATERIAL_RIGHTS_REQUIRED。区分计划取消与开工后中断；后者费用/AP已用。 |
| qualification-missing | O，在2024-06-06前用原已付首单定义video_workflows后BuildCourseSample，预期COURSE_TOOL_QUALIFICATION_REQUIRED，不依赖某seed图像资格是否早获批。定义本身不验工具，样课验完整日期区间。 |
| audience-paid | S，CreateCourseAudience paid真实6000元/1AP/7日→推进完成；公开members与eligibleMembers才可用，不能在Create时当获客完成。保留实际预算/资金拒绝。 |
| audience-referral | S，CreateCourseAudience video_referral引用同segment、已实际发生的真实video cohort；即时完成、0AP/0营销费，仍按价格/实际需求筛选。 |
| price-min | S，CreateCourseAudience使用该目录product的minPriceFen，应允许进入其原获客路径；实际转化人数不保证。 |
| price-max | 同上，使用maxPriceFen，实际人数可能少/零，不能改人群补满。 |
| price-below | S，price=minPriceFen-1，schema合法，预期COURSE_PRICE_OUT_OF_RANGE。 |
| price-above | S，price=maxPriceFen+1，预期COURSE_PRICE_OUT_OF_RANGE。 |
| self-capacity-over | A，PlanCourseCohort self_small单真实资源、seat=selfCapacity+1，预期COURSE_SUPPORT_CAPACITY_EXCEEDED。 |
| product-capacity-over | A，guided_group单资源、seat=product.capacity+1，预期COURSE_SUPPORT_CAPACITY_EXCEEDED。intro的201仍在schema≤240内；不要用>240载荷只测schema。 |
| three-resources-capacity | A前真实HireWorker editor-lin、HireWorker assistant-zhou，付招聘/实际工资；在未来可用季度PlanCourseCohort guided_group用本人+两名真实worker。应生成三项原支持任务，占3AP及三份支持成本；practical可计划120容量，但实际招生只能取公开可购买人数，不能声称120已售。三资源self需6AP，会被原4AP拒绝；员工不增加全局点数。 |
| deadline-stage0 | E，未有活跃阶段attempt；以完成日比原dueAt晚一天的合法未来start排index0，预期COURSE_STAGE_DEADLINE_MISSED；不改14日期限。 |
| deadline-stage1 | T0、index1未排；完成晚于原endAt一天，预期COURSE_STAGE_DEADLINE_MISSED。第0段没完成会先撞COURSE_PREVIOUS_STAGE_REQUIRED，不能混记。 |
| interrupt-sample | D，BuildCourseSample实际开工→InterruptJob→推进原完成点，不能成为ready/version1。可在真实预算/许可允许时重新Build；旧attempt/已用费用保留。 |
| interrupt-stage | E或T0，实际StartCourseStage开工→InterruptJob；推进原完成点不确认该阶段收入。正向补救须在原due内重新排，否则次日stage_due退未交付部分并teachingCancelled。 |
| interrupt-support | C/E，原support开始后InterruptJob→推进原完成点，不能算支持已兑现；到support_due进入remedy，原窗口内另补支持或退款，默认路径继续保留。 |
| refund-before | E、尚未教学，RefundCourseLearners选真实已付学生；全额来源于原未交付预款，减少原保护/负债，无教学收入反冲。conversion改returned但身份保留。 |
| refund-half | T0，真实学生退款；未交付半份按原payment batch退，已交付半份按原stage operation反冲。奇数分价为首段ceil(price/2)、次段余数，不按总额先除。 |
| refund-after | T1且窗口未关，真实学生退款；两段已交付收入均按原阶段引用退回。缺现金保留原债务/暂停，不能清账凑成功。 |
| refund-window-closed | Z或真实date>refundUntil，RefundCourseLearners预期COURSE_REFUND_WINDOW_CLOSED。不能只在不存在/未付学生上测试。 |
| same-person-format | 真实购买过foundation者；用另一product形式定义同topic/foundation，实际新样课/新audience/新班期完成后，显式Enroll该人，预期AUDIENCE_ALREADY_CONVERTED。该人须仍满足新报价需求，否则先得到COURSE_LEARNER_NOT_ELIGIBLE。按两形式各自基准价可保持相同需求比例，但仍核实际competition。 |
| same-person-new-business | Z后先WindDown/Close原公司并清理实际任务/员工/费用，再真实Open新公司、大纲、Activate、新样课/audience/班期；显式Enroll原同topic/edition购买者，预期AUDIENCE_ALREADY_CONVERTED。未关闭旧公司就Open会先COURSE_STUDIO_EXISTS，不算本项。 |
| same-person-after-refund | E且date<start；真实退款一人后对同一班再次Enroll此人，预期AUDIENCE_ALREADY_CONVERTED，无需另造课程。退款不删除conversion。 |
| advanced-without-study | D后，用已存在foundation的predecessorId、studyId:null定义同topic advanced，预期COURSE_NEW_DEMAND_REQUIRED。不要传null predecessor触发较早的类型守卫代替。 |
| update-free-original | U，实际StartCourseRefresh→7日完成；新增version、对应update resolution=refreshed，原学生人数、conversion、合同已认收入不因维护增加，也不再收费。刷新开始时只冻结当时已发生anchors。 |
| update-default | U，不更新→推进dueAt+1，update.defaulted=true、course.paused=true，不能恢复招生。原班继续原义务，fee_close时未兑现update使受影响原班剩余付费学生全退，按真实现金可能留债。 |
| update-interrupted | U，刷新实际开工→InterruptJob→原7日点，不能新增版本/消除update；保留已耗钱/AP，后续默认/退款仍有效。 |
| stop-sales-old | E/T0/T1后StopCourseSales，新Audience/Plan/Enroll被COURSE_NEW_ENROLLMENT_PAUSED拒绝；原教学/支持/update/refund及fees仍存在。 |
| retire-old | 有真实原学生后RetireCourse；retired不能Resume，新招生拒绝；原教学及有既有version的refresh仍可处理，不能据retired销掉旧义务。 |
| wind-down-old | E/T0/T1后WindDownBusiness，实际中断该公司任务、解雇并结算实际工资/维护；CloseBusiness在旧班未关时预期COURSE_UNSETTLED_OBLIGATIONS。沿原到期退款/费用/债务路径完成后才能Close。 |
| zero-ap-refund | 真实有付费学生且仍在窗口的里程碑，用真实安排/消耗使当前actionBudget.available===0后退款，退款本身0AP。原S02及时获资格分支在样课+两段+H004更新后可自然达到4点；迟获资格分支需另核实际点数，不能手改actions，不能把0AP称0现金。 |
| assisted-without-grant | A，以assisted计划但deploymentId:null，预期AGENT_DEPLOYMENT_REQUIRED；若使用真实仍preparing部署，则预期AGENT_NOT_READY_FOR_BUSINESS，两种原因分列。不要删grant制造正常档。 |
| delegated-without-expansion | G且仅真实approval，PlanCourseCohort delegated_group引用正确deployment，预期AGENT_EXPANSION_NOT_AUTHORIZED。提前SetHengxingAuthority cross_flow另预期AGENT_REAL_SUPPORT_RESULT_REQUIRED，不能把部署完成当经营成效。 |
| stop-grant-old | G已安排未来/进行中的原agent支持；StopHengxingAuthority实际取消/中断这些job、结清已发生服务费；原班和学生责任不清空。之后新辅助计划因deployment stopped被AGENT_NOT_READY_FOR_BUSINESS拒绝。系统stop report独立性仍false，不作外部委托已撤回证明。 |
| accelerated-promise | A，PlanCourseCohort promise:accelerated_results并真实招收/交付/支持。原需求bps加1500（封顶10000），学习帮助阈值从9000降到7000；实际公开结果保留，不保证每个固定样本恰有更多投诉，不能预读helpRoll选人。 |
| recovery-self | F真实投诉后尝试14日self_small；remedy只有原supportComplete+7，预期COURSE_RECOVERY_DEADLINE_MISSED。四种补支持之一不等于四种都须正向成功，不可预先安排补支持冒充投诉后补救。 |
| recovery-guided | 选intro/practical F，在supportComplete当天立即安排7日guided，实际3000元/1AP，完成恰在remedyDue；若等support_due次日剩6天已不可行。enterprise guided14日同样应deadline拒绝。实际投诉人数不得超过已完成recovery容量。 |
| recovery-assisted | F且G仍有效，同主体/额度未耗尽，4日/1500元/1AP补支持，完成后实际needs_recovery→helped/recovered。若Q1四点已用完，保留INSUFFICIENT_ACTION_POINTS，不能偷偷补点。 |
| recovery-delegated | F+R，另行真实SetHengxingAuthority cross_flow，scopes=course_support,external_service_commitments，externalDelegation=true、合法金额/期限，2日/1000元/1AP补支持。独立风险待决、授权欠费/到期或现金预算缺口分别保留原拒绝，不能借另一公司relay成效授予本公司的课程权限。 |
| default-remedy | F有真实needs_recovery，不补支持、不手动退；推进remedyDue+1，默认全退未解决学生，随后原fee_close按实际剩余收入计5%。本金不足保留原欠款与CASH_SHORTFALL，不冒称closed。 |
| two-batches-enrollment | C且真实eligible足够，两个不同原命令Enroll互不重叠学生，例如10+10；两paymentBatch、两原预款operation，共享班期保护总额正确。再跨两批退款可核两个reference，不合并成一批或规范化ID。 |
| pause-resume | S/A/E无未决update且公司operating，PauseNewEnrollment→新招生预期COURSE_NEW_ENROLLMENT_PAUSED→ResumeCourseEnrollment后恢复原合法招生；暂停期间原教学/支持继续。若update未决，Resume本身应COURSE_UPDATE_REQUIRED，不跳过维护。 |

## 六项来源、排程与结果限制

1. **原fixture不可冒充正常来源。** `src/testing/course-fixture.ts:21`起的createCourseFixture明确origin:fixture，无生活/工资/维护，课程company=false，视频审批100%，课程默认match/help100%；`src/application/course.test.ts`的smallClass及F03/F05继承这些条件，部分测试还把helpedBps=0。它们能作边界参考，不能证明固定正常种子有同样学员、现金、投诉或毕业生。

2. **0现金另有来源责任。** F05零opening snapshot现金具有预先实际付过的资产，不能并入正常zero-ap-refund。`src/application/story-agency.test.ts:29`的normalStoryZeroResources是relay公司实际0可花/0AP/有债，不能据此声称课程公司0现金退款已验证。

3. **H004/H007/H008/H009真实日期分别为2023-03-14/2024-06-06/2024-12-26/2025-01-20。** H008不是2024-05-13；见`src/content/campaign.ts:27`、`:48`、`:55`、`:62`及实际anchors。四anchor影响所有当时既有课，非只对应主题。晚资格的正常S02可能H004后才报名，此时affectedCohortIds为空，不能算原学员维护；需另一个真实仍有学生的历史窗口。旧R2调查不覆盖，补正登记在新根。

4. **视频首次访问不能早于H007。** 2024-06-06申请、7日后才有实际结果；拒绝后90日才可再申，有效期间不能提前续办。许可为实际完成日+365天，区间判定date<expiresAt，见`src/core/video.ts:49`、`:91`、`:300`。原R2迟批设想12/03申请→12/10结果→12/10—12/24样课后不能Plan同日12/24开班（startAt必须>当前date）；仅改12/25又会在12/26 H008产生更新，Q4部署/申请/样课/首段已四点，无法额外刷新，阶段0到期无法补回。这是源码发现，原R2未运行，不能伪造一次实际失败。

5. **R3晚许可候选尚非执行结果。** Dec26实际世界已发生后才Define/Build→Jan9，Jan9 Plan→Jan10—17首段，H009 Jan20—27更新，Jan27—Feb3次段/end，Feb4—8辅助支持，Feb16结算，Apr1—8新需求研究，未发现额外日期守卫冲突。Q1四点=首段1+更新1+次段1+原支持1，必须无Work、Study或额外recovery；Feb8真实投诉只能0AP退款。须保留真实helped且未退款毕业生，否则Apr1 study应COURSE_GRADUATES_REQUIRED。源资格、现金、AP、授权/累计额度和独立风险仍由实际执行核定；不是R2已执行失败/新R3已通过证明。若该候选后来调整，另行保存政策，不覆盖本次推导。

6. **跨流程成效源码门槛应准确表述。** `src/core/story-state.ts:48`的hasAgentBusinessResult要求同deployment实际支持job completed，且比人工确实省费或省时；课程还要原cohort至少一个stage实际交付且amountFen>0。不要求整个公司累计盈利，不等于所有学生已毕业或外部委托已安全撤回。新的cross_flow仍必须单独明确授权，本主体/范围/期限/现金上限、真实独立风险及服务费守卫保留。

## 执行判定边界

正常前史无法提供的真实投诉、毕业生、足够可购买人数、授权成功、现金或可行AP，均应保留明确缺口，不能用fixture、换seed或改参数补齐。分支若被更早守卫拒绝，不能把它计作目标reason已验证；实际未知拒绝需调查，不统称policy_refused。任何正向允许也不等于完整经营闭环、Chrome结果或真人试玩。

本次只读调查未运行任何测试、回放、浏览器或兼容检查；仅经父代理随后明确授权写入本文件。45项原名单全部保留，T17/5b/P1—P4及378实际覆盖不因此改状态。
