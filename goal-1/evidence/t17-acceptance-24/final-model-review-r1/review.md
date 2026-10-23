# S3-C1 最终模型／UI合同只读复核 R1

2026-10-23T16:46:20.676Z。结论：在本次17份生产输入及相对R3差异内，**未发现新增确定缺陷**。不是整个S3/goal或R4实际生产/Chrome/真人体验通过；本代理没有运行测试、浏览器、Git或兼容检查，也未修改生产源码。source-before/after逐字节、mode、SHA一致。

旧R1两项有据闭合：

- A→B→外部A：CourseSceneChoice受控路径current直接取target；无回调路径binding随source/controlled变化更新，不再复活旧override。已有choice-reselect-r1真实handler红/绿保留（绿2文件3项），本次只复读，不重复执行。
- 许可待稿翻原册：近景许可槽courseId:null；inspect携纯UI courseDraftSlot，Root透传到CoursePanel，courseDraftScopeForTarget重匹配account/business/case及当前course引用，同槽读取并定位案例许可字段；错误先解释重选。该槽不进入courseTarget/偏好/游戏档。普通查看不rememberFocus，明确重选和实际saved仍分开。Root对新实际对象清理旧slot，辅助许可保原course语境；旧legacy许可保册实例路径没有被新target切换破坏。已有book-r1的3项定向身份/槽检查另保，不推广为当前Chrome。

最新差异核查：唯一缺失许可只在明确course、rights-required、非historical、无identity invalid且missingLicense.length===1时选该实际ref并打开license页；没有调用request、onTarget或新增许可实体。案例编号按同course.cases原顺序查找，多个缺项保显选列表；不能把全局cases顺序当本课编号。资源/日期仍来自同business+case草稿，原parser核ref属于当前课、现有许可无planned/running/completed，再交原preview/确认；readonly/candidate/busy/conflict保旧且不提供可执行提交。choice-license-r1现有2项实际handler证明唯一案例2、原payload、inspect slot、另一sample槽不串、真实reader及head.put候选／exact retry后的重复许可门槛；driver不执行DOM/effects，不冒充本轮Chrome或多缺项事件实测。

course-player-thread只改物件称呼，历史attempt仍写“那次样课”；OpeningMoment仍以phase标注计划／进行／实际完成，ready只说样课完成、招生另定。等待沿原job.status/startAt/completeAt；开工前预留不称付款，完成不返AP或计学费。当前ready对旧cohort仍保原学生承诺；历史attempt、wrong主体、失效目标、旧免费全局大纲＋本business准备复用、关闭旧studio再开、有限中断/收尾及全部旧更新/欠款入口未被此次差异替换。新的不可用期等待只读catalog可用日，并沿原AdvanceTime/费用/屏障，不演未来新闻或批准。

R3→当前：6份既有UI生产变更＋新增CoursePreparationDetails.tsx，无删除；完整列表见production-diff-from-r3-r2.json。新增确认模块按captured run/revision/account/business与原案例重匹配，Define/sample按所选refs顺序，独立License只称本次素材案例，不捏course编号。该模块须纳入R4完整源集合，不能拿R3清单当其已有身份。初轮辅助比较把R3未记录的mode误作差异，false artifact原样保留；r2按原bytes/SHA及路径集合校正，不声称缺失的旧mode已有证明。

剩余证据边界：Root继续R4构建/HTTP和当前Chrome许可→实际等待→样课ready、取消/原册/重进及原字节审核；本报告不预报其终态。原P3 WIP、教学/支持/退款下一片、旧PNG/真人/M01暂停/T18/完整goal保持，兼容开发测试0。没有新增测试建议或启动全344复跑。

关键当前身份：CourseSceneChoice bc39257c7e712cbd389b6f71d020b0003626939ee81760ade7406f99d22d26c1；CoursePanel 3874c2cb4810a35e238122cfede959135b32b267dbc26a87d69cf2ceb10ce9eb；course-player-thread 8e573b821738ecc9600ff092cc21da6e5f99bc602ffa71428baf16adb9756620。其余17份完整身份见source-after.json。
