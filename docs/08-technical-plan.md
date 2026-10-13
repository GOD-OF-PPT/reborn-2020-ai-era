# 08｜技术实施方案 v0.3

状态：开发规格，不是已建工程。仓库仍无package.json、src或可运行游戏。React + TypeScript + Vite为工作选型，版本在P002核验并锁定；Vite官方提供react-ts模板，不能把本页当作已安装依赖。[官方指南](https://vite.dev/guide/)，核验于2026-10-13。

## 1. 结构与职责

单人、电脑优先、本地存档，分层二维场景加网页组件。首版无账号、真实支付、真实券商、线上中转站或运行时模型依赖。

| 拟建模块 | 独占职责 | 不允许做什么 |
|---|---|---|
| src/core/time、actions | 日期队列、行动预留与执行 | UI点击次数不能当游戏时间 |
| src/core/ledger | 账户、科目、资金占用、退款与更正 | 业务适配器不得直接改余额 |
| src/core/opportunities | 生命周期、容量、维护、退出 | 不复制五套顶层状态 |
| src/core/market、equity | 订单/撮合/权益/稀释/锁定 | 不能用市值代现金、股权代治理 |
| src/core/business | 视频、课程、中转的交付/用量适配器 | 不实际生成视频或转发模型请求 |
| src/core/world、crisis | 历史、分域记忆、证据、控制和恢复 | 不把现实公司写成虚构恶意代理 |
| src/content | 已校验配置、事件模板、对白与来源 | 无eval、任意路径写入或网络脚本 |
| src/ui | 只读投影、命令、输入校验提示 | 不裁决收益或修改随机状态 |
| src/persistence | 存档封套、原子提交、迁移、备份 | 不把单条数据库请求成功当整档成功 |

以上路径全部待建立。规则模块不引用React、浏览器时钟或网络；可在无界面环境运行同一组命令回放。

## 2. 命令与事务边界

Command = {commandId, runId, expectedRevision, actorId, kind, payload}；缓存payloadHash。相同ID与相同载荷返回既有回执；相同ID与不同载荷返回COMMAND_ID_REUSED；非重复指令遇旧revision返回STALE_REVISION。

纯规则接口：evaluate(state, command, content)返回Rejected(reasonCodes)或Proposed(nextState, ledgerEntries, scheduledEvents, causeEntries, receipt)。预览通过同一前提与成本函数生成只读投影，不抽随机、不揭示隐藏结果，也不预写nextState。

处理顺序：验证格式与版本 → 查幂等回执 → 比对revision → 前提与资源 → 在副本内计算所有效果 → 校验不变量 → 持久化原子提交 → 通知UI。失败必须是整体失败，不能先扣款再发现事件条件不足。

事件、订单和业务各有definitionId与instanceId。定时效果以instanceId + phase + occurrence作为幂等键；按实际日期稳定执行，同日顺序遵守经济文档。日志记录因果父ID而非仅拼接自然语言。

## 3. 持久化与多标签页

IndexedDB中以同一readwrite事务读取runId的当前revision，再写入快照、命令回执和日志批次；事务提交前不能对外宣布保存成功。单个put成功不是事务complete，失败/abort必须保留旧状态。此行为参考[MDN IDBTransaction](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction)，核验于2026-10-13。

事务内不等待模型或网络。revision竞争时后写者重新读取并显示冲突，不静默覆盖。P004先实现单写会话，多标签只读提示与revision校验作为双重防线；不依赖UI按钮禁用作为并发保护。

存储失败时，保留已验证的待提交快照作为未保存候选，显示“未保存”，暂停后续改变状态的命令；可重试或导出该候选，不能一边显示成功一边继续叠加新操作。关闭页面丢失未保存候选的风险必须提示。

存档封套包含saveVersion、schemaVersion、rulesVersion、contentVersion、contentHash、rngAlgorithmVersion、runId、revision、状态与日志引用。优先兼容同版本；升级须迁移或明确拒绝，不自动用新内容重算旧结局。

导入工作限制10MiB，验证整数界限、日期顺序、引用、枚举、占款和账本不变量；校验和用于损坏检测，不声称抵抗用户手改。损坏、高版本、不兼容内容拒绝后保留原档。浏览器本地数据可能被清理，应提供导出/导入与最近有效备份。[存储说明](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria)。

## 4. 数字、随机和市场

MoneyFen为有界整数，BasisPoints为0—10000整数；计算过程避免乘积溢出，统一四舍五入，负数冲正走显式更正操作而非负成本。所有现金与持仓变化都通过账本服务；占款按ID转换，不能冻结与计划双计。

随机按world、market、opportunity、crisis分域，算法版本在P004锁定。实例隐藏事实创建时固定并保存；新增一段闲聊不能改变股票路径。游戏内日期来自状态，不读取现实今天决定历史。

行情包显式携带simulation/historical、有效区间、交易规则版本、价格与公司行动口径、来源审核状态。未知日期/未知价格返回DATA_UNAVAILABLE；拒绝用前一日价格或现实最新规则静默填补。模拟市场采用虚构代码；真实回放是同一接口的独立数据验收，不阻塞模拟引擎。

## 5. 内容与安全

事件采用[内容契约](15-content-contracts.md)的有类型操作符。缺失账户、后续事件、默认路径或非法日期的生产内容禁止导入。脚本中的演示算例不是生产事件，不能从planning目录自动装载到游戏。

所有玩家文本转义渲染；不把存档当HTML，不执行远程内容。日志不含真实身份、Token或API密钥。运行时即使未来接入文本生成，也仅表达已经确定的事实，不决定收益、胜负、权限或融资资格。

## 6. 构建、测试与交付

P002应提供并实际验证dev、build、typecheck、test:unit脚本，后续再添加test:replay、test:e2e和validate:content；这些命令当前不存在，不在本次声称通过。仓库已有文件不得被脚手架覆盖；先在临时子目录生成工程再有选择地合入。

测试分层：整数与账本单测 → 命令/日期/存档集成 → 固定种子路线回放 → 内容可达性 → 浏览器操作与美术。Q01—Q40均需实现侧证据。快照S01—S05用于隔离验证，不能替代从2020正常游玩到2025的通关测试。

每个PR附规则变化、任务与验收ID、实际命令输出、测试存档、已知缺口和兼容性。严重阻断包括重复收益、未来现金、不可继续、错误史实标签、存档覆盖和任一核心路线不可玩。

实施先后、功能切片与停止条件见[路线图](09-roadmap-and-backlog.md)。公开部署、CI权限、收费、许可证、真实数据采购和美术授权另行决定。本轮不创建这些外部资源。
