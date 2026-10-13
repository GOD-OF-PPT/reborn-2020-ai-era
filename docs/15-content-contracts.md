# 15｜机会、事件与经营数据契约

v0.2工作契约。此文给出拟实施的数据结构与例子，不代表JSON Schema、校验器或游戏引擎已经实现。实现归P005、P013、P020。

## 实体与唯一ID

OpportunityDefinition是机会类型；BusinessInstance是玩家实际经营的一个项目；EventDefinition是剧情模板；EventInstance是某日期的一次发生；Command和Transaction有各自幂等ID。不同课期不能共用收款实例ID，同一事件不能被读档重复领取。

OpportunityDefinition字段：id、route、title、description、earliestDate、capabilityRequirements、accessRequirements、initialCost、maintenanceCost、capacityModel、revenueModel、riskExposures、exitActions、historicalSources、classification。

BusinessInstance字段：id、definitionId、ownerAccountId、phase、marketStage、createdAt、assignedCapacity、cashReservations、receivables、payables、customerLiabilities、productionAssets、customers、providerDependencies、contracts、riskState、causeIds。

五条route标识固定为a_share、ai_video、ai_course、api_relay、deepseek_opportunity；不要把ai_course误写成其他业务。软件项目可增加application类型，但不替代上述五项。

## 事件字段

id、classification、sourceIds、effectiveWindow、priority、exclusiveGroup、preconditions、hiddenFactsPolicy、visibleEvidence、choices、defaultOutcome、followUps、causeDomain。

每个choice包含id、label、requirements、costs、immediateEffects、scheduledEffects、replacementActionIds、failureReasonCodes。资金与行动成本在执行时原子校验；预览只读；无法执行时不给扣款。过期/无人处理有明确定义的默认后果，不把世界卡在弹窗。

条件/效果用白名单结构，首批条件为all、any、not、hasFlag、dateGte、balanceGte、capacityGte、relationAtLeast；效果为transfer、reserveFunds、recognizeRevenue、recordLiability、setFlag、scheduleEvent、changeCapacity、recordCause。条件不执行任意脚本。

对每种效果注明账户、币种、金额单位、时间、实例与幂等键；若一个效果组失败，整个事务回滚。效果只能修改允许的状态域；历史实际日期不可由普通业务效果重写。

## 模型发布引发课程更新的示例

```json
{
  "id": "EVT-COURSE-R1-UPDATE",
  "classification": "fictional",
  "sourceIds": ["H009"],
  "effectiveWindow": {"from": "2025-01-20", "to": "2025-03-31"},
  "causeDomain": "course-and-adoption",
  "preconditions": {"all": [{"hasFlag": "world.deepseek_r1_released"}, {"hasFlag": "player.has_active_course"}]},
  "hiddenFactsPolicy": "fixed_at_instance_creation",
  "visibleEvidence": ["你使用的工具与部分课程演示已不一致"],
  "choices": [
    {"id": "update", "label": "更新课程并安排答疑", "costs": {"actionPoints": 1, "moneyFen": 200000}, "immediateEffects": [{"setFlag": "course.update_started"}]},
    {"id": "pause_enrollment", "label": "暂停新招生，先履行已有课程", "costs": {"actionPoints": 0, "moneyFen": 0}, "immediateEffects": [{"setFlag": "course.new_enrollment_paused"}]}
  ],
  "defaultOutcome": "keep_existing_contracts_and_record_update_due"
}
```

这只是结构示例：H009支持模型发布事实，不支持课程损失或收益；这些是虚构经营效果。update后还需排定完成与费用所属账户；暂停招生不代表旧课免费交付。生产事件在P020补齐所有账户、后续、失败与到期校验后才能导入，不能直接复制片段当成已完成事件。

## 专用数据口径

视频：播放、有效咨询、订单、交付、到账分列；素材是否有权使用与是否标识分列。课程：学生数、单价、课期交付率、退款、平台费和支持成本；退款前后费用口径明确。中转：计费用量用整数，输入/输出或不同服务单位分开；价格有生效日期，客户预付和供应预付各有余额。

A股：数据来源模式、真实/虚构主体、交易市场/板块、价格日期、公司行动、可成交量、订单检查点；权益：关系类型、主体、融资轮次是否架空、增资/老股、股权和治理/退出。

## 数据与验收来源

金额基准以经济规则为唯一算例，历史事实以来源文档为底稿，验收ID以Q01—Q24为准，任务以planning/backlog.json为准。一个字段口径变化同时更新这些引用。新增内容不自动改变已保存游戏：内容版本升级必须有迁移或拒绝策略。

要求校验：唯一ID、引用存在、时间合法、来源与分类匹配、默认路径存在、隐藏事实固定、成本非负、可能结果可达、不会产生免费重复收益。以上都是待实现规则，不宣称本次已通过功能测试。
