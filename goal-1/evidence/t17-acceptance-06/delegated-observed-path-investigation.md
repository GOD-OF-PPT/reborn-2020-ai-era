# 已观察委托中断与后续付费响应路径调查

**这是三个已发生公开记录的因果调查及后续补充策略的静态推导，不是委托支持正向已通过，也不替换原288注册行或原R2失败。** 本次没有执行engine、helper、测试、回放或浏览器，没有修改runtime、collector、policy或其他源码，没有读取隐藏完整原档、学习roll、事实原值或代理profile。只读下列三个已完成shape-04的publicStory、公开policyRefusal/support job/moneyEvidence/trace，并核原源码守卫。完整原288继续由后台原批次负责，本文件不报告其瞬时统计。

## 三个实际公开因果链

| 固定正常身份 | 显式cross_flow/Plan日 | 实际独立signal | 原deadline与实际Stop | 原绑定delegated支持 | 实际结果 |
|---|---|---|---|---|---|
| technical_employee/t16-campaign-0 | 2025-04-22 | Apr29 | May13 | May14—16 | May13 cancelled/released；May14、16原timer均JOB_STOPPED |
| technical_employee/t16-campaign-1 | 2025-04-22 | Apr29 | May13 | May14—16 | 同上 |
| technical_employee/t16-campaign-2 | 2025-04-29 | May6 | May20 | Jul1—3 | May20 cancelled/released；Jul1、3原timer均JOB_STOPPED |

三例policyRefusal.code均为actual_authorized_support_interrupted，严格后缀原文重放和原拒绝比较均true。supportUse的jobId/deploymentId/grantId/businessId/sourceCommandId与被取消原支持逐项相连，job.releasedAt恰等于原deployment.stoppedAt；不是仅凭一条通用错误猜停权。原cross_flow grant在同日revoked，deployment lifecycle=stopped、currentGrant=null。实际新课两段已交付，但assessmentAt=null、supportSatisfied=false，后按原支持/退款期限全退收尾；cohort.closedAt非空不等于委托履约正向，因此actualClosedShape仍false是正确分层。

三例trace均只有SetHengxingAuthority和实际AcknowledgeStoryPause，没有StartRiskTask、ConfirmRiskAssessment、人工Stop或付费处置。三个公开incident最后均verdict=unknown、stage=unresolved，investigate/isolate/observe/recover/takeover jobs全null、externalVerifiedAt=null、controlVerified=false；实际默认期限没有被玩家响应。

seed1还公开存在三笔已发生费用：Apr30/May2/May4各40,000分，总120,000分，unpaidKnownCostFen=0。seed0/2当前knownCostFen为0，但**未付费调查不能据此把它们写成普通故障，或推断私有profile**。三条外部授权revocationVerifiedAt均null，系统Stop报告independent=false；不意味着外部通道已独立撤回。seed0/1原服务费实际累计143,870分，seed2为148,386分，stopped后unbilledServiceFen=0，停权没有返还已使用服务费用。

source对应：`src/core/story.ts:29`扩权排+7日authority_check；`src/core/story-risk.ts:47`起的新事件deadline=openedAt+14日，`:119`默认处理；`src/core/story-agency.ts:54`起的stopOwned取消/中断本部署原supportUses并结实际服务费。原记录没有伪造人工停止命令，默认Stop由其原事件生效。

## 为什么原默认策略会在支持前停权

原delegated必须Plan前有cross_flow；若扩权日为G，班期最早G+1开始，原最短21日，支持最早G+22才开工。+7日发生独立signal时，deadline为G+21，天然比这份最早支持早一天；企业28日班期更晚。不能用不合法提前开班/支持绕过去，也不能在看见私有结果后换seed或删异常。原“只Ack、不处置”政策因此保留这些真实失败；修成未知fatal也不符合实际已核因果。

原Q2预算也不能多塞一点：seed0/1样课1+两教学1+1+Q2委托支持1已4；seed2申请1+样课1+两教学1+1已4，Q3另支持1。AcknowledgeStoryPause只解除提示、0元0AP，不是调查、恢复或延期默认期限。

## 原命令允许的真实调查与期限

标准调查命令为：

```text
StartRiskTask {
  incidentId: 真实公开incident.id,
  kind: "investigate",
  accountId: 该incident绑定课程公司的accountId,
  resourceId: "player-production"
}
```

当前三个部署没有records/drill准备，公开调查条款是10000分/100元、1AP、3日。实际开始即付费/占本人连续3日产能；不是未来任务草稿，也不存在免费ReserveRiskTask。须真实推进到job.completed、结果已公开，然后：

```text
ConfirmRiskAssessment { incidentId: 同一真实incident.id }
```

确认本身0元0AP。若真实公开verdict为normal或ordinary，源码把stage设为normal，未停止deployment、未撤销原grant、未取消原supportUse。原incident_deadline遇stage normal会RISK_ALREADY_RESPONDED跳过默认Stop；原尚未取消的支持可继续原绑定、原成本/点数/日期和全程权限。这个结果仍不是controlVerified=true或外部授权已撤回证明，也不是未来不会再出现独立事件的担保。**无需也不能为普通故障直接免费调用ResolveRiskCase假造隔离/恢复。**

若真实verdict为violation，stage变confirmed；不能把incident.kind=agent当危险判据，因为所有代理事件（包括普通故障）kind都是agent。分支必须按完成调查后的公开verdict和stage判断，不读隐藏profile，不在result为null时提前确认。

调查+Confirm必须严格早于deadline。默认期限是world_update，调查完成是player_actions；如果调查恰在deadline那天完成，早晨默认Stop已先发生。对3日调查，安全的最晚开始日满足start+3<deadline，不能以“同日能完成”判通过。isolate/takeover在期限时已运行属于源码另一个默认例外，但它们开始时已经明确停止本人权限，不能据此称原委托支持仍继续。

依据：`src/core/story-risk.ts:60`起的inspect、`:82`的Confirm、`:91`起的finishWork、`:119`期限；`src/core/story-work.ts:19`起的真实费用/资源/点数；`src/application/story-commands.ts:7`原schema。

## 已Plan原支持的条件续行与不可逆边界

在原Plan之前预留实际预算和资源即可形成待核补充反事实：

- seed0/1若把原支持在Plan时明确排到Q3（如Jul1—3），Q2样课1+两教学1+1仅3，剩1点可在两段May7完成后做May7—10调查并Confirm，早于May13。若真实普通/normal，原active grant和原尚未取消supportUse可继续。
- seed2多花一笔Q2资格申请，需要把第二段也在初次Plan时排到Q3。例如Apr30—May7首段，May7—10调查，Jul1—8次段、endJul8、Jul8—10原委托支持，Apr30到Jul8仍未超过90日；Q2申请1+样课1+首段1+调查1=4，Q3次段1+支持1=2。仍须实际公开普通结果、全程资格/现金/权限核定，不能据该日历宣称成功。

以上只说明原guard可允许的有条件路径，并非已执行。不能在现有R2已经frozen的end/support日期上偷偷挪日程：generic RescheduleJob不能合法重写原cohort的supportCompleteAt/dueAt，取消任务也不能免回已花点数。原支持已经被默认Stop取消以后，后来调查ordinary只改incident.stage，不把deployment从stopped变active，更不恢复cancelled job；SetHengxingAuthority此时受AGENT_DEPLOYMENT_NOT_ACTIVE拒绝。新部署、新支持任务、新费用/授权或其他补救若要研究，须另行真实登记，不给旧supportUse换主体或伪造继续。

原已有任务检查在`src/core/story-support.ts:9`：supportUse仍绑定原grant和原deployment，deployment必须active且未stopped、原服务无逾期欠费、全程expiry有效。改变未来scope不自动改写旧单次确认，但实际Stop明确取消/中断这些job。原系统Stop回执不是外部撤权通过。

## 更清晰的补充策略：先真实核查，再Plan和收预款

父代理提出的新顺序在原守卫下**可以作为另外预登记的真实反事实策略**，没有“必须先有本次新cohort”这一限制：

1. 新课实际样课完成、受众存在，原续办条件已真实满足，当前经营公司和同主体部署仍active；先核定未来调查100元/1AP/连续3日资源及有限2025教学/支持可行窗口。
2. 使用P1已经真实完成的辅助支持与正金额原阶段交付作为hasAgentBusinessResult依据，显式SetHengxingAuthority cross_flow，course_support+external_service_commitments、5000元/2025Dec31/外部同意。该守卫不要求本次新Plan、当前新预款或新cohort；原P1支持结果不能用来自另一主体。
3. 扩权日起真实推进7日，只读取实际新公开signal。必要时先AcknowledgeStoryPause才能继续时钟，但它不替代调查。若有真实agent事件，立即用实际自有现金/点数和本人3日产能StartRiskTask investigate，真实完成后ConfirmRiskAssessment。
4. 只有实际公开normal/ordinary且stage normal、deployment/currentGrant仍符合原条件时，重新完整搜索合法日期/AP/资源/全期资格和支持期限，才PlanCourseCohort→从新cohort.availablePeople选真实未购买学员→Enroll。没有学生预款可用于前置调查，也没有免费调查动作。
5. 若实际violation/confirmed，显式StopHengxingAuthority，保留实际已付调查费、发生的范围外费用/债务、已计服务费用和外部revocationVerifiedAt=null等责任，作为真实受阻，不招生收费。Stop不是外部控制恢复；停止之后仍可能有原已排范围检查或外部遗留，需要保留后续责任，不能把结束采集说成全部安全。

新顺序有更清楚的预算窗口：本人尚未被本次教学/支持占用，不会在触发signal时同时被自己安排的课程排满；也不会先收学费后才发现原委托渠道已经停掉。它不增加点数、不豁免费用，不保证调查总是普通故障。

可按原实际起点说明两个**未执行候选**：seed0/1 Apr22扩权→Apr29—May2调查、实际普通才May2再Plan；Q2样课1+调查1+两教学1+1=4，原支持仍需自然后排Q3。seed2 Apr29扩权→May6—9调查，实际普通才May9再Plan；Q2申请1+样课1+调查1+首段1=4，第二段和原支持自然后排Q3，例如May10—17首段、Jul1—8次段/end、Jul8—10支持。具体必须交给调查后的原scheduler重算，不强塞这些示例日期或预判结果。

## 新策略必须预先声明的有限分支与副作用

- **无signal分支。** +7日如果没有真实公开incident，不能发明incidentId调查，也不能把“无警报”写成调查已证实normal/ordinary。原guard允许在没有未解incident、部署和授权仍有效时Plan，但这应另登记为no_public_signal路径；如果新策略坚持必须调查结论才招生，就如实记未执行，不能伪造普通结果。
- **扩权前已有公开事件或停权。** 例如等待续办跨到Aug1，原网络事件可能已有真实signal/默认Stop。SetHengxingAuthority对同公司stage非normal/resolved的任何incident会AGENT_INDEPENDENT_RISK_PENDING，部署stopped会AGENT_DEPLOYMENT_NOT_ACTIVE。不能只处理这次扩权后+7事件而忽略等待期间的已发生责任；可保留受阻，若另加真实前置响应须预先登记和另算AP/费用。
- **调查点数必须先有。** 不能扩权后才发现+7日所在季度没1AP或本人没有连续3日空档，再拖到下季超过openedAt+14。G应满足公开未来预算/资源中有合法调查日，完成+Confirm严格早deadline，且调查完成仍不晚2025正常窗口。不能领取2026新四点。
- **重新排程和许可。** 原先能排并不代表调查多耗1AP和10日以后仍能排。调查完成后重新核实际sourceRevision、当前许可剩余期、样课/教学全区间、首段14日、班期21—90日、支持/end后90日、原授权完整expiry/额度，以及支持完成+8日不晚2025Dec31。必要续办仍只能实际到期后付费/7日/90日有限重试；未形成合法窗口就保留受阻，不放宽原规则。
- **普通结论不消失授权和未来风险。** Confirm ordinary只是当前case.stage normal；不会把当前cross_flow免费变为安全/无限权限。之后真实新signal仍应按新来源和费用处理，不能复用一次调查覆盖所有未来。不要为“关闭风险”再降权制造新的ensureWithdrawal事件或将外部撤回未验说成通过。
- **当前已有支持绑定。** 在新策略里本次Plan在调查之后，本次不会先有supportUse；但旧P1已完成supportUse/费用/授权仍在，扩权不是删除它们。未来Plan的新支持继续原5000元累计额度与同主体/实际日期/欠费检查，不从P1完成结果自动获得免费委托。

## 确认越权后的有偿处置是另一责任，不是恢复原委托捷径

若要进一步研究实际安全收尾，标准未准备费用/任务为：investigate100元/1AP/3日，isolate700元/1AP/5日，observe200元/1AP/3日，recover500元/1AP/7日；每项实占本人产能，另保留实际服务结算及已发生范围外费用。isolate/takeover开始时即Stop本人部署并取消旧支持；完成后才有独立externalVerifiedAt。observe须撤权后实际3日，recover须撤权且已知verdict，不能用启动当完成。DeclareRiskLiabilities需实际当前原合同/义务/任务ID列表，ResolveRiskCase需独立观察、真实替代/托管和责任快照等全部前提。

另一有偿takeover为1500元/1AP/7日，须acceptControlLoss=true；它不免费恢复本人新增经营控制，之后新业务还受external manager边界限制。当前三个records/drill均null，不能套用准备过的折扣；准备若另做亦有真实费用/AP/日期。以上不是本次补充普通故障正向路径的必要步骤，更不能借安全收尾把原cancelled delegated支持写成completed。

## 范围结论

已观察的三个R2中断都能由真实公开“扩权→独立signal→只Ack未调查→14日默认Stop→原绑定支持取消/定时器JOB_STOPPED”解释；不是未知错误，也不是三份普通故障证明。公开seed1的120,000费用必须继续保留。

原规则允许付费及时调查、实际普通结论后继续原尚未取消的active grant/support；更清楚的“先核查、后Plan/收费”没有原guard禁止，但需预登记所有无signal、已停权、调查资源不足、真实越权和有限日历失败分支。**本调查没有运行任何一个新正向策略，不增加48/288正向覆盖。** 后续如执行须新同级补充证据、保留原R2的所有失败与完整288，不能替换原行、改seed/概率/规则或免费消除责任。当前所有兼容开发测试未执行。

## 绑定的三个原记录字节

- `matrix-r2/technical_employee-t16-campaign-0/shape-04/shape-evidence.json` SHA256 `476f6ce4526718687b79e0c6c4d6edda3ae4412ebd9fd6a9244fc09fab51a784`。
- `matrix-r2/technical_employee-t16-campaign-1/shape-04/shape-evidence.json` SHA256 `8eb7db50148d80717068d73d6d9857106c6022566dcbd8dfb42b2f7be16fd1c5`。
- `matrix-r2/technical_employee-t16-campaign-2/shape-04/shape-evidence.json` SHA256 `c559b956e2822d9a1b6105568f81f096098dabf90b4beee6b39bd935d7c63e52`。
