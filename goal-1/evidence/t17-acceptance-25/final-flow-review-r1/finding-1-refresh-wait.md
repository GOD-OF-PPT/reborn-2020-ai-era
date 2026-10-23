# 确定问题：已安排课程更新仍邀请再次安排

源码追踪，未运行新游戏/测试或声称Chrome复现。

正常路径：原cohort公开出现unresolvedUpdates→显选原StartCourseRefresh→真实保存成功。course-player-thread.ts:110–114保持同cohort/同course原关注正确；原unresolved要到job完成才清。course-cohort-progress.ts:75（audience对应:65）无active refresh识别，继续返回update-required及teachingIntent refresh，未给已planned/running的本课原refresh job日期/wait。OpeningMoment:143按该意图进入编辑，TeachingChoice:150默认选refresh；再提交被原COURSE_REFRESH_UNAVAILABLE拒绝。记录页liveJobs:158也只含co.stage/support，未呈现该原refresh任务。

影响：保存后和重进后主CTA仍要求安排已经存在的更新，不能直接认清更新正在进行/何时反馈。底层防重复仍在，未修改钱/AP/随机。模型正常链的advance至March21直接跳过此段近景状态，不能证明其已验。

必要修正：本课公开unresolved分支先查唯一active refresh（与本课原refreshJobs/operations匹配）；返回真实planned/running、原资源/起止、等开工/完成的wait；无active才显示原refresh选择。保同班pin，不换全局课程、不提前清更新。若有多个/失效原job，说明并原册，不默取第一。临时原账/强制责任override保持。

已即时通知Root/model/UI，当前只读没有改生产。原14源身份见source-before；相关源完整读本及匹配标记见finding-1-snapshot.json。
