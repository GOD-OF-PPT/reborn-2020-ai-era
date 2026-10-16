# 22｜命令、随机与存档调用合同（T04）

2026-10-16建立；规则`rules-t04-v1`，封套/状态schema均为1，内容`bootstrap-work-v1`。这是T04已实现模块的调用约定，延续技术08；前台仍是工程预览，T09再接入可玩流程。完整内容与世界门控属于T05，T04没有提前宣布P004及Q/X整体完成。

## 调用与版本

`src/application/bootstrap.ts`的`createInitialRun`由宿主建立新局；参数为runId、actorId、commandId、seed、backgroundId。开局工作数据独立放在`src/content/bootstrap.ts`，不装载planning。两背景开局现金均3000000分，先执行2020-01-01生活费400000分，首个可交互状态2600000分。72次月度义务已排程，工资只保留背景参数，必须等T06就业条件成立后才排程，不能当作未来可花现金。

新局已生成revision=1的CreateRun回执；`IndexedDbRunStore.create`保存新局。同runId和同创建意图重试返回已有结果，不能重发开局款。已有runId不能被另一个创建意图覆盖。seed和私人备注保存在本地完整档中，不能作为公开分享投影。

`CommandRegistry`只注册可信TypeScript处理器，JSON无法注册函数或脚本。当前公共指令仅有AdvanceTime、SetPrivateNote、AcknowledgeCashGap、CancelAction；没有任意加钱或改估值指令。业务命令由后续任务显式增加并升级版本。

命令封套为`{commandId, runId, actorId, expectedRevision, kind, payload}`。普通ID最多128字符；输入只接受受限普通JSON，拒绝原型键、访问器、稀疏数组、函数、undefined、过深/过多节点。载荷用strict schema规范化后，保存SHA256及完整规范字符串，避免只比哈希；expectedRevision不计入意图，同意图重试可以取得原回执。

顺序固定：格式/版本 → runId/当前宿主actor授权 → 规范化载荷 → 既有幂等回执 → 新命令revision → 同一inspect前提与成本 → 副本计算 → 不变量 → 原子提交 → 发布。旧回执先于revision检查；改变载荷为COMMAND_ID_REUSED，新指令旧revision为STALE_REVISION。actor是本地单人存档所有者标识，不是网络身份认证。

`evaluateCommand`只返回rejected/duplicate/proposed，没有I/O。`previewCommand`仅调用inspect；inspect获得当前经济/日期/已揭示证据，不获得seed、随机流、原始隐藏事实或未来队列。`projectRun`也不暴露这些字段、私人备注或载荷签名。UI接入时仍须以文本节点渲染玩家文本，不能把完整档作为HTML。

## 确定性与事实

算法固定为`xoshiro128ss-1.1-sha256-be32-v1`：按算法名/seed/domain的规范JSON取SHA256，前128位按big-endian分成四个uint32；全零种子替换为[0,0,0,1]。xoshiro128** 1.1状态、draws计数随档保存。world、market、opportunity、crisis互相独立；不使用Math.random、现实日期或网络结果裁决规则。

参考[C实现](https://prng.di.unimi.it/xoshiro128starstar.c)，本轮独立编译其next函数核对8个值，原始向量及源码保存在goal证据。它是可重复的游戏随机算法，不用于密钥或密码。

`freezeFact`只在实例创建时从指定域取值，相同事实ID/来源重复调用不重抽；`revealFact`只记录固定证据。命令不得删除或重写已存在事实。测试用有代价调查使用独立fixture规则版本，实际花1行动点；它不注册进正常应用。保存失败时，候选中的隐藏结果不能提前进入公共投影。

取消/中断/已执行行动的遗留定时器会记录具名skippedReason并继续推进，不跳过现金义务。导入按历史操作核对跳过理由，后续中断或完成不使此前合法回执失效。

## 原子保存与会话

`IndexedDbRunStore`默认库为`reborn-2020-local-v1`，可注入IDBFactory作为测试接缝。heads、backups、receipts、logs、imports分别保存当前档、最近有效旧档、命令回执、因果批次及恢复幂等记录。载入时核对快照、回执和日志整个组合。

提交在一个readwrite事务中读取当前head和幂等回执，校验revision和物理generation，再写备份、快照、回执、日志。只在transaction.oncomplete后resolve；单条put成功仍可能abort。事务内没有await网络或异步规则计算。abort/请求错误/额度错误返回具名失败，原head/回执/日志/备份不部分推进。

generation与游戏revision独立递增。显式恢复旧档可降低游戏revision，但不能降低物理generation，所以旧写者不能凭相同revision覆盖恢复分支。恢复会在同一事务替换该分支的回执/日志并保存先前head；重复importId返回当前分支，不把后续命令再次回滚。

`WebWriterAccess`在安全上下文使用原生Web Locks的exclusive/ifAvailable锁，键包含库名和runId；其他会话只读。锁缺失/失败时也只读，不乐观声称有写权。释放后只读会话显式reload取得新锁并重读；底层generation/revision检查仍独立存在。T04真实浏览器检查使用同文档两个会话验证原生锁互斥；实际两个标签页的产品提示和交互留待T09。

`RunSession.open`连接store/codec/registry/locks。界面只能显示`session.view`：它始终来自已提交档，同时带saveStatus、busy、hasCandidate等状态。submit的同ID同意图并发请求共用结果；不同指令在保存中被拒绝。

失败候选留在内存，saveStatus=unsaved/conflict，不发布候选现金、证据或成功回执，禁止继续叠加新命令。可`exportCandidate()`保留完整候选，`retry()`提交同一个候选且不重算随机；遇冲突必须处理导出及显式discard后reload，不能静默改基。`exportSaved()`导出已提交档；`restore(text, importId)`明确选择恢复本局。无候选关闭可直接释放锁；有候选关闭须显式处理。`guardUnsavedClose`安装beforeunload提示信号，浏览器是否展示确认框受其自身策略限制。

## 导入、兼容与恢复

封套含saveVersion、schemaVersion、rulesVersion、contentVersion、contentHash、rngAlgorithmVersion、runId、revision、checksum和完整state。SHA256校验和仅检出损坏，不承诺防止玩家重签手改。导入在JSON解析前检查UTF8总量最多10MiB，随后检查严格字段/枚举/整数金额/日期/账户/占款/义务/供应与退款引用/行动/日序/随机/事实/命令/因果等不变量及组合。

高版本、内容不一致和旧T03裸快照均明确拒绝，没有静默迁移；失败不写目标档，旧档可用`exportStored`原样导出。版本升级必须另写迁移并测试或继续明确拒绝。每次有效提交保留最近一个旧档；这不等于永久备份或断电保证。候选仅在当前会话内存，用户主动导出前不保证浏览器崩溃后保留。

本地完整导出含seed与私人备注，仅由用户主动导出；后续分享必须单独实现已揭示信息白名单。IndexedDB可能因用户清理、配额和系统行为丢失；原生abort测试不能证明真实断电、磁盘故障或浏览器逐出策略。

## 核验与边界

运行`npm run check`。在dev服务访问`/tests/t04-storage.html`点击运行可核验隔离合成库；该页和测试处理器不进入生产build入口，保留测试库供审计，结束关闭连接与写锁。Node适配器失败注入和实际浏览器报告分别见[T04验证](../goal-1/evidence/t04-validation.md)。

依赖依据：[Zod strictObject](https://zod.dev/api)、[Noble SHA256](https://github.com/paulmillr/noble-hashes)、[IndexedDB事务](https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction)、[Web Locks](https://developer.mozilla.org/en-US/docs/Web/API/Web_Locks_API)，本轮核验并锁定版本。fake-indexeddb只用于Node开发测试，不把其绿灯当原生浏览器证据。完整经营、历史世界、常规内容、可玩UI、24季度、原PNG和真人试玩尚未由T04完成。
