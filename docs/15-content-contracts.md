# 15｜内容与状态契约 v0.3

开发用接口规格，尚无游戏内容执行器。本文替代v0.2中缺少账户、到期路径和完成条件的示意片段。planning下的样例仅供规格校验，不得当作已验证的生产事件。

## 1. 稳定标识与实体

| 实体 | 主键与必要关系 | 主要状态 |
|---|---|---|
| GameRun | runId、版本组、revision | 日期、季度、模式、随机域、保存状态 |
| OpportunityDefinition | definitionId、route、classification | 可用窗口、能力/资格、动作模板、退出模板 |
| BusinessInstance | businessId、definitionId、ownerAccountId | lifecycle、市场阶段、合同、容量、义务、风险暴露 |
| ProductionJob | jobId、businessId、commandId | startAt、completeAt、已占容量、完成条件、失败/中断路径 |
| Contract | contractId、businessId、counterpartyId | 里程碑、交付、收款、退款、未履约和争议 |
| CashReservation | reservationId、accountId、originId | 金额、互斥类别、到期、释放/转换记录 |
| MarketOrder | orderId、accountId、assetId | 提交与撮合点、数量、价、费用、剩余冻结 |
| EquityAgreement | agreementId、subjectId、roundId | 增资/老股、股比、治理、锁定、架空标签 |
| EventInstance | instanceId、definitionId、bindingIds | 生效/到期、已选分支、隐藏事实、因果父ID |
| CommandReceipt | runId + commandId | payloadHash、revision前后、结果、事务ID |

route固定为a_share、ai_video、ai_course、api_relay、deepseek_opportunity。application仅作可选扩展，不能替代五类。definition与instance不能混用；不同课期、作品、客户充值和供应账单都有各自ID。

金额用MoneyFen，百分比用BasisPoints；日期使用ISO日历日和检查点序号，不用浏览器当地时间。字段缺失与数值0有不同意义；未核实融资意愿不能默认true。

## 2. 生命周期与独立维度

业务生命周期：discovered → preparing → operating ↔ paused → winding_down → closed。风险/crisisState、市场阶段marketStage、能力资格accessState独立保存；热点衰退不自动停业，停业不自动解除风险和负债。

preparing转operating要求准备任务完成、资格满足、初始产能与资金可用。paused只禁止新合同/新招生，旧合同继续到期。closed必须证明所有义务结清、转移或按清算规则记录，不允许清空数组当退出。

每次转换保存触发命令、条件、成本和causeIds。售出业务改变所有权与义务承担者，不删除过去的承诺。已关闭业务可以新建另一实例，不能复用旧订单和回执领取奖励。

## 3. 事件模板规范

生产事件必填：id、classification、sourceIds、effectiveWindow、scope、trigger、priority、exclusiveGroup、hiddenFactsPolicy、choices、defaultChoiceId、followUpPolicy。classified为historical的事实需要来源；fictional/counterfactual须明确标记，引用事实不等于事实支持虚构收益。

scope限定绑定的业务/合同/人物，不让同一个课程事件修改玩家所有课程。默认选择必须无需新行动或现金即可执行；只能停止新增、记录义务或推进停工等有限结果，不能免费完成有成本的交付。到期处理同样写入回执。

条件采用有类型白名单：all、any、not、flagEquals、dateInWindow、availableFundsGte、capacityGte、businessKindIs、hasEntitlement、contractStateIs。引用通过已绑定ID解析，禁止任意属性路径、表达式代码或外部请求。

效果通过业务服务：postLedgerTransaction、moveReservation、startJob、pauseNewContracts、recordObligation、scheduleEvent、recordEvidence、recordCause。不得使用可任意改余额的setFlag；不得把成本和同额transfer效果重复扣两次。

## 4. 完整选择样板：课程更新

以下JSON是开发方可据此制作的模板契约，不是本次已能执行的生产数据。所有效果细节均由对应命令处理器校验。

```json
{
  "id": "CRS-UPDATE-01",
  "classification": "fictional",
  "sourceIds": [],
  "effectiveWindow": {"from": "2025-02-01", "to": "2025-03-31"},
  "scope": {"binding": "businessId", "businessKind": "ai_course"},
  "trigger": {"flagEquals": {"key": "course_revision_needed", "value": true}},
  "priority": 40,
  "exclusiveGroup": "course-refresh",
  "hiddenFactsPolicy": "fixed_at_instance_creation",
  "choices": [
    {"id": "refresh", "label": "更新课程并安排交付", "command": {"kind": "StartCourseRefresh", "actionPoints": 1, "costFen": 200000, "payer": "bound_business_owner", "capacityUnits": 1, "durationDays": 7, "onInterruption": "keep_completed_work_and_remaining_obligations"}},
    {"id": "pause", "label": "暂停新招生，保留已有交付", "command": {"kind": "PauseNewEnrollment", "actionPoints": 0, "costFen": 0}}
  ],
  "defaultChoiceId": "pause",
  "followUpPolicy": "job_completion_or_interruption_receipt"
}
```

StartCourseRefresh校验绑定业务、本人行动、目标日期容量和所属账户可用资金，原子扣1点/200000分并创建7天任务。任务创建时固定目标课程版本，开始不等于更新完成。第7天验证任务仍有效且完成要求满足后更新绑定课程版本，记录因果；中断保留已付费用、已做工作与尚未交付部分。完成不再扣同一笔费用。

PauseNewEnrollment只禁止新招生；已有课程、退款、答疑和更新义务继续存在。无人处理到期时执行同一默认命令，不设置免费完成标记。作用范围以businessId限定，不暂停其他路线。

## 5. 专用数据与后续回响

视频记录作品/批次、客户验收、修订额度、素材权利、有效受众cohort、平台结算和回款。课程记录课程版本、班期、学员唯一ID、交付里程碑、支持容量、退款与新产品资格。视频到课程的转化记录originCohortId与conversionId，重复执行不重复收费。

中转记录供应授权与适用状态、故障域、计费量单位、客户余额、供应预付、已确认用量与版本价格。用量修正使用原账单ID和新更正ID；原纪录不可覆盖。价格调整只影响指定生效时点后的服务，不回写已消费账单。

股票记录simulation/historical、规则包、交易日期、上市状态、可成交数量、公司行动与价格口径。权益记录股比和治理分离，counterfactual标签沿合同、持仓和结局传递；采购或技术适配不能生成股权。

因果记录为{id, date, domain, parentIds, sourceEventId, visibleSummary, visibility}。玩家只能查看已经获知的证据和结果，通关复盘不必公开所有未选分支的隐藏真相。

## 6. 导入、版本和内容完成定义

P005校验结构、白名单、类型和引用；P020运行默认路径、成本失败、正常完成、中断、退出与回放。静态校验通过不证明全图可达。生产条目至少提供一个正常和一个受挫存档及命令序列，不能以文案存在就标记完成。

规则口径以经济文档为准；体验以16号规格为准；验收ID与任务从planning/backlog.json读取。新增内容升级contentVersion/contentHash，并定义已有存档的兼容策略；不得静默重抽玩家已经调查的事实。
