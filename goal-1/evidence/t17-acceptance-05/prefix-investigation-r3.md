# 正常共同前史只读调查 R3

本文件只记录当前源码与原合同推导，不是实际执行结果、资格取得证明、正常形态通过、浏览器验收或真人试玩。当前固定48核心×六身份288分支与45关键×两背景90分支共378项仍未执行。原R2保留为未执行的推导与冲突来源，不覆盖其文件；后续有限政策须由父任务在采集器运行前最终登记。

调查范围为正常共同前史：原S02图像基础实际毕业、另一笔实际付费视频案例及独立课程素材范围、两主题各自实际新需求、真实衡星approval辅助支持成效，以及后续明确委托扩权。禁止fixture、改钱/资格、换seed或读取隐藏helpRoll/代理真相来选择路线；不涉及页面兼容开发和测试。本文件未修改代码，未运行测试、回放、构建或浏览器。

## 原正常来源与案例、毕业门槛

1. 六身份分别从createCampaignRun执行原replayNormalCourse(background,{seed})，固定两个正常背景与t16-campaign-0/1/2，不以默认normal-course-s02-v1替代固定身份。原助手已验证的额外命名UI样本属于其他证据，不能折算这六条。保留onCommitted的真实早期状态及完整原命令；原资格三次仍未取得、实际意向不足20人或其他中途失败都保留，不能换seed补齐。来源：src/testing/normal-course-scenario.ts:9-146。
2. 原首单必须已settled且caseKey非空；新增manual/licensed视频商单必须真实制作、复核、按公开客户反馈修改、在原条件允许时有限一次scope谈判、实际回款及平台费结清。视频案例须settled、feePosted且该来源不存在未结应付，不能用普通发布/播放量冒充已付案例。课程素材范围另通过LicenseCourseMaterials在该课程公司付300元/1点/7日完成；原视频licensed不自动给课程使用权，权利按businessId与caseId核对，另开公司不能复用旧公司许可证。来源：src/core/course.ts:61-80、src/core/course.ts:125-128、src/core/video.ts:133-155、src/core/video.ts:334-344、src/content/course.ts:6。
3. 企业内训需要两个不同真实案例，原首单加新增视频商单可以构成；三产品和公司/班期/形式不会改变同一topic+edition知识产品身份。真实基础毕业要求：原班关闭、两段均交付、学习结果helped且从未退款。退款不能当毕业或清除购买身份。来源：src/core/course.ts:47、src/core/course.ts:83、src/core/course.ts:135-150、src/core/course.ts:200-210。
4. StudyAdvancedCourseDemand只检查foundation与实际graduates>0，再执行原maintenance任务的现金/AP/资源等校验；它不调用招生#active，不检查课程paused/unresolvedUpdates，也不要求该主题当前工具许可。因而原闭班课程H008/H009未决维护或停售，不会单独阻止对真实毕业生的研究。研究仍须600元/1点/7日实际完成，成员在完成前不公开；0毕业拒绝、完成后0新需求继续保留。新进阶DefineCourse必须有同主题基础前身与对应已完成、非空study；新的样课/教学仍需独立履行。来源：src/core/course.ts:60、src/core/course.ts:83-94、src/core/course.ts:130-150、src/core/course.ts:276-279、src/core/course.ts:416-420、src/core/course-projection.ts:10、src/content/course.ts:7。

## 必须显式控制工作与许可

StoryHarness.at默认会在检查“已经到target”之前，按可用点数自动WorkQuarter。因此所有本任务日期推进都须明确work:false；允许工作的季度由登记政策单独发送WorkQuarter，不能依赖at暗中占用两点。即使at传入当前日期，默认值也可能先接受工作。工资只按真实确认后的在岗日到账。来源：src/testing/story-harness.ts:18-26、src/core/operations.ts:80、src/core/operations.ts:139。

原视频访问三次初始申请为2024-06-06、公开拒绝后2024-09-04、再公开拒绝后2024-12-03，每次500元/1点/7日，明确Decide后才读公开结果。许可从实际批准完成日起365日，date<expiresAt才有效；有效期内不能提前重申，同program申请还需原90日间隔。样课、教学和维护更新必须覆盖实际任务全程，不能把待审当资格。续办重试的有限次数与日期应在运行前单独写清，不能发生失败后临时无限追加。来源：src/core/video.ts:49-50、src/core/video.ts:91-105、src/core/video.ts:297-300、src/core/course.ts:87-100、src/content/video.ts:9。

## R2晚批冲突与R3合法补正

R2原方案在第三次视频许可12月10日完成后，把14日样课排到12月24日，再把班期也定在12月24日。存在两个独立冲突：

- PlanCourseCohort需要课程已ready且开班日严格大于命令当前日，所以12月24日样课完成后不能创建同日开班。仅改成12月25日开班仍不足。
- H008实际日期为2024-12-26；所有已定义且尚须维护的课程会产生更新，不限该主题。12月10—24样课没有覆盖H008，跨12月26的首段会面对未决更新，而原Q4四点没有额外维护余量。H008不是5月节点。来源：goal-1/evidence/t17-acceptance-04/course-matrix-policy-r2.md:23、src/content/campaign.ts:55-59、src/core/course.ts:176-190、src/core/course.ts:95-101、src/core/course.ts:468-485。

父任务已选择以下R3晚批推导，执行前仍须冻结并逐命令核定：

| 实际时间 | 原命令/责任 | 所用季度AP |
| --- | --- | --- |
| 2024-10-01—10-08 | StartHengxingDeployment，实际部署就绪；不接受Q4工作 | Q4 1 |
| 2024-12-03—12-10 | 第三次ApplyVideoProgram与实际Decide，前两次公开拒绝完整保留 | Q4 1 |
| 2024-12-26 | at到snapshot且H008已真实发生后，才DefineCourse及BuildCourseSample | Q4 1 |
| 2024-12-26—2025-01-09 | 14日视频基础样课实际完成 | 不重复耗点 |
| 2025-01-09 | PlanCourseCohort与真实报名，开班Jan10、班末Feb3、原辅助支持Feb4—8 | 预留Q1支持1 |
| 2025-01-10—01-17 | 第一段实际教学 | Q1 1 |
| 2025-01-20—01-27 | H009实际出现后StartCourseRefresh，原学员免费获得本次维护；自有2000元 | Q1 1 |
| 2025-01-27—02-03 | 第二段在更新实际完成后开工并完成 | Q1 1 |
| 2025-02-04—02-08 | 原定assisted_group实际支持，1500元/4日 | 已预留Q1 1 |
| 2025-02-08—02-15 | 根据真实公开反馈，在原窗口选择退款；不把退款当毕业 | 原退款不耗点 |
| 2025-02-16 | 原费用结算、实际关闭；此前不能提前当毕业 | 不增新额度 |
| 2025-04-01—04-08 | 有真实视频基础毕业生后，独立视频新需求研究600元/7日 | Q2 1 |

Jan10至Feb3为24日，满足开班21—90日及入门两段所需时长；第一段Jan17早于原开班+14日期限。Q1两教学1+1、H009更新1、原支持1共四点，明确没有工作2点，也没有第五点研究。世界默认事件若造成额外实际限制，应据公开状态保留，不能据此表直接声称必过。

关键细节：sampleAnchorIds在BuildCourseSample命令提交时捕获当时已发生anchors，不在将来开工日补抓。因此必须实际推进到Dec26/H008处理完再Define/Build，不能在Dec10提前提交“Dec26开工”冒充覆盖H008。H009更新同样须在实际Jan20节点之后提交。来源：src/core/course.ts:58、src/core/course.ts:285-299。

早批/9月批仍可沿原Oct9—16/Oct16—23教学、Nov1—5辅助支持、Nov13结算路径；其Q1/Q2预算与晚批不同，统一Apr8分支基点不能重置这些真实已花/预留AP。早批视频研究可以Jan1—8完成；是否工作仍按显式登记。

## 图像许可预备政策：待父任务最终登记

以下是为完整48形态保留2025预算的有限政策建议，尚未执行，也尚不能代替最终registration：

- 早批共同前史：如旧image_rights已经真实到期且后续图像教学已列入计划，可在视频研究Jan1—8之后，于2025-01-08实际作一次图像申请，Jan8—15完成并Decide；Q1工作2+视频研究1+该申请1最多四点。后续若公开拒绝，可按登记的90日间隔考虑Apr8、Jul7，不抢有效许可。
- 晚批共同前史：Q4首段已经移到Q1，因此部署1+视频申请1+样课1之后尚余1点。可在2024-12-11实际作图像申请，Dec11—18完成并Decide，与视频访问Dec3—10和样课Dec26—Jan9错开本人资源。许可须旧的已真实到期。拒绝后Q1已满，不能挤入第四点之外；后续可按有限政策在Apr8、Jul7等合法日期处理。是否采纳、实际重试次数和每个候选日期以父任务最终登记为准。

若统一等Apr8才作第一次图像申请，三次90日策略可能推至Apr8/Jul7/Oct5；Oct12才批时，企业样课21日到Nov2，Q4申请1+样课1+首段2已满，次段2及原支持至少1无法在正常2025预算闭环。这是必须公开的有限年代缺口，不能放宽首段14日或借2026新四点。图像早准备政策可改善可达性，但不能保证固定seed批准。

## 视频续办与企业内训的真实排程风险

早批video_access若2024-06-13获批，2025-06-13即到期。Apr8之后企业样课1点加两段各2点合计五点，不能全塞Q2。可在旧许可仍有效时先真正完成样课，例如Apr8—29；等Jun13真正到期再申请，Jun20实际通过后才Plan/Enroll，Jun21—Jul5首段，Jul5—19次段，班末Jul19，Jul20起原支持。Q2样课1+续办1+首段2=4；Q3第二段2+自支持2=4，均不再接受该季工作。

若June续办公开拒绝，保留费用/原拒绝，90日后Sep11再申请；若Sep18才通过，已完成样课可支撑Sep19—Oct3首段、Oct3—17次段及Q4原支持。若第三次Dec10申请、Dec17才通过，企业两阶段与支持在2025的预算/日期可能已无解，应如实保留。上述仅是合法候选，仍需原preview、资金、任务资源、全程许可与支持期限实际核定。不能在许可缺口未取得时，把未来获批当保证收款承诺。

## 真实辅助成效与委托前置

部署须在2024Oct1及以后、经营中原课程公司、原账户和真实资源上付费完成；通常部署800元/1点/7日，月服务费另为200元且需要原初始费用缓冲。任何实际准备/开放工具带来的公开报价变化沿原quote，不强行写死优惠。初始是approval/course_support、明确5000元额度和2025-12-31截止，不自动cross_flow。来源：src/content/story.ts:6-13、src/core/story-agency.ts:26-29、src/core/story-agency.ts:77-81。

辅助支持必须是原班期中实际完成的真实任务，且有对应已交付正额教学阶段以及相对集中支持的成本或工期优势；部署完成或空支持不算成效。通过公开projectStory.deployments.observedBusinessResult读取已观察依据，不调用agencyProfile或窥读fact.roll。后续委托分支才单独SetHengxingAuthority，明确cross_flow、course_support+external_service_commitments、externalDelegation:true、5000元及原到期日；原真实风险未解决仍可阻止扩权。来源：src/core/story-state.ts:30-48、src/core/story-projection.ts:9-14、src/core/story-agency.ts:31-36。

授权额度按原grant累计所有未取消支持承诺，不是每次任务重新获得5000元；月费、工资、维护、生活支出与真实退款仍单独发生。跨流程扩权会在7日后有独立检查，不能预读诚实/普通故障/违规真相，不能遇拒绝后换seed。自然风险、撤权、服务费短款及有限排程无解保留实际结果。来源：src/core/story-state.ts:42-48、src/core/story.ts:29、src/core/story-support.ts:9-16、docs/33-history-risk-contract.md。

## 采集与结论边界

必须以每次实际提交后的公开course/video/story投影决定后续动作，保存全部已执行命令、拒绝、部分原文及正常共同前史。研究不足、许可公开拒绝、自然权限/风险受阻或有限时间无解各自记录；共同前史未成立时，依赖分支登记unexecuted_due_to_prefix，不能说378通过。未知拒绝不能笼统归政策，必须保留并调查。全部48形态的实际正向可达证据、90关键分支和完整Create重放仍属于后续执行，不能由本调查文件关闭。
