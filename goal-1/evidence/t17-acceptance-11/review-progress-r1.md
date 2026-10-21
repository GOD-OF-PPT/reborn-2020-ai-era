# 5c-U1公开阶段投影｜独立实施与限定复核

范围：仅 src/ui/relay-scene-progress.ts 与 src/ui/relay-scene-progress.test.ts；本报告以 wx 新建。root11 的 input/plan/tasks 已先于实施读取。基线为 main / 7f7f0dfcb5d6f86e46ac11585f94c32817f16caa；未修改规则、金额、日期算法、随机、schema、权限、存储或任何原册。NarrativeScene/RelaySceneChoice/确认页接线由主控负责，不用本次纯投影测试代替其验证。

## 公开接口与原命令边界

- relaySceneProgress(relay: RelayProjection, date: string, preferredPeriodId?: string | null)：只从已保存公开投影生成一主念头的阶段、文案、真实任务日期、全部周期 ID/当前索引以及可选原命令或审计 scope。读取、切换周期和选择日期均不执行命令。
- relayAuditableMeters(relay: NonNullable<RelayProjection>, periodId: string)：返回本周期 supplierId 非 null，且没有关联 planned/running/completed 审计任务的原 meters；通过公开 audits.meterId/jobId 与 auditJobs.jobId 反查，已中断/取消的审计可重做。返回新数组、不修改原记录，也不以 meterCount-auditedMeters 推测资格。
- 直接命令仅 ReadRelaySupplyDecision {applicationId}、CorrectRelayPeriod {periodId}、CollectRelayDue {customerId}，均保留 confirm:true。audit.businessId 只是付款主体/对话范围元数据；原 StartRelayAudit 载荷仍严格为 {periodId, resources:[id], startAt}，资源、AP、资金、权限和提交资格以原 preview/confirm/保存为准。

## 关键阶段及责任

未读供应回信优先于公开许可/初始适配的派生提示，未读不宣告批准。实际准备、申请、适配、获客的开始/完成保持区别；客群、已保存报价、实际身份、签约、充值和计划服务各自独立，预款不是收入，当前余额不用于倒推本月剩余额度。

已经安排的复核可显示真实等待；尚未委托的可审计量不会抢掉 active service 或 active support 的主场景。服务首日及存在未审计量的支持仍显示实际日序，原册允许明确中途复核，实际服务与支持结束后才直接主推审计。新计量即使出现在旧审计完成后，仍按原行判断候选；一次复核只覆盖当前已委托记录，不包括未来整期。

只有 auditedUnits 已公开、与 reportedUnits 不同且 correctionId 为 null 才主推原更正；历史 knownCorrections 和已经更正的差额不算新义务。旧 closed 周期待更正不会被最新周期遮蔽。preferredPeriodId 可显式选择任一原周期，periodIds 无截断；当前主体无周期时回退其他旧未结周期/最后一周期。

只收实际到期原应收，明确 CollectRelayDue 的客户全部已到期原单范围、不会再次确认收入。暂停交通、暂停新合同、停止本期、停站收尾、周期 closed、企业 closed 各自区分；旧客户保护、供应资产、应收应付仍逐项保留。企业 closed 不再建议新增审计。服务仍行进但支持已中断时明确不会等待自动补做；服务已停止但原支持仍 active 时不称服务已经完成；周期结清也不把中断记录消除。

## 实际验证

2026-10-21T03:48:00.223Z—03:48:02.273Z，仅执行 rtk proxy ./node_modules/.bin/vitest run --config vitest.config.ts src/ui/relay-scene-progress.test.ts，实际 exit 0，1文件/19项通过。原 stdout 191字节，stderr 0字节；命令、时间、exit、源身份和原输出 SHA 保存于新目录 relay-progress-tests-r1/result.json、stdout.txt、stderr.txt。本轮此文件没有红测；没有把预期失败或其他历史输出改写为绿。

测试使用完整公共类型的 display fixture；基础空投影来自正常 Create 后的公开 projectRelay，后续变体只检验展示边界，不作为真实获客、付款、服务、正向经营或全年游玩证据。覆盖无主体、未读回信、准备/获客、服务/支持时钟与当天边界、审计五任务状态、供应资格、旧审计后的新行、未知实计 canary 不泄露、旧 closed 更正、8周期完整可达、旧周期回退、已更正历史、实际应收、停站/关业、暂停/价格、签约充值区分、深冻结投影不变。

源身份：relay-scene-progress.ts 18670字节 / SHA256 65c45314f8c0093a27efa973832b834e6f23f77e6b1bc409be5c601fadef3d82；relay-scene-progress.test.ts 20542字节 / SHA256 eee5d89a45bd3626e64adefea4f81fb8321fc2ccb4f8be9867cfcd88a49fbc36。

[杠精审查] 此纯公开 mapper 的限定边界通过：未使用隐藏 profile、未来 roll、尚未完成的实际用量或虚构收益；未省略旧周期、原高级原册和旧义务。只产生叙事及候选描述，不能变成命令权限。对接、真实 Create 完整前史、当前 Chrome 的真实服务/支持/复核/更正/原子保存重载、集成类型/build 仍由主控继续，不在本报告称完成。

本代理生产规则改动0，页面兼容开发/测试0，浏览器/尺寸/缩放/跨浏览器/布局测试0；未运行其他测试、未提交、未改任务完成标志。全5c六身份矩阵/其余关键责任、T17/goal、旧PNG/真人与需人类明确恢复的M01均保持未完成。REPEAT复用原 Vitest 与证据父目录守卫，无新通用工具、依赖、全局Skill或自动化。
