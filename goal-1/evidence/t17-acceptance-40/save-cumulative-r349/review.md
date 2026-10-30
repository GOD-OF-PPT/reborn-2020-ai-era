# C-B3累计审查（限定完成，完整目标继续）

本表读当前347→351实际源与344合同、345/348原结果。这里的局部通过不是整体体验/真人/性能或全U6完成。最终执行结果另见validation，原红不覆盖。

| 检查面 | 实际调用链与原证据 | 当前裁决 |
|---|---|---|
| 原v1/可容v2字节 | RunCodec.#sealed/prepare→packSave，保原条件和level3，完整wire核10MiB；345 legacy-bytes五v1及真实77/304 | 351五v1、真实77/304 v2、305/329 v3及实际330完整原文已核同 |
| v3后备选择 | 只原完整v2超物理预算后fallback；新RJS1词典不删字段、不改状态schema13/规则/RNG | 读源符合合同，351完整89文件594/594通过，保原攻击输入和格式边界 |
| 外层预算/兼容 | 普通300k节点/10MiB先核，严格header+版本兼容先解包；未知字段/嵌套物理/旧schema拒绝 | 原codec/save-dictionary攻击输入覆盖，未发现绕过原校验的新入口 |
| 解包资源 | base64规范复编码、单zlib全消费、16KiB输出累计上限、packed/logical分别≤256MiB | 读源与原独立坏流/尾流/扩张测试对应；不是JS堆峰值或正式安全认证 |
| typed token | 规范varuint/UTF8+ignoreBOM/字面量/唯一词典/有序安全key/引用界限/完整消费 | 固定fixture与独立Buffer producer覆盖；首次出现由writer确定，合同没有要求decoder词典字母排序 |
| 逻辑边界 | token在构造字符串前累计长度、32深度/100k成员/5M节点；之后完整checksum/hash/metadata/schema/domain/reference | 正确性不由压缩率或能decode替代，全部相关模型回归已通过（89文件594） |
| 原子发布 | Session先seal才candidate，Store先prepare再readwrite；head+backup+receipts/log同事务，oncomplete才发布record | 源保持；348真实大档fakeIDB put后abort/retry与Node305各原文证明，非Native故障注入 |
| 只读/冲突 | Session lease/blockReason、controller exclusive/busy、candidate原retry不evaluate；旧失败物理保 | 本次未改权限/事务，当前原consumer累计回归已通过，真实Native层沿348准确身份保 |
| 完整Native | 原304单次成功导入，2UI等待→25真实命令到329；writer/readonly/cold同/backup328，原后缀全等 | 348按原身份保；351实际329→330一条、backup329/readonly/cold完整同且原347后缀等值；非完整Create重跑 |
| 当前修缮 | assertSupplierHistory对当前receipt.signature反复JSON.parse，4条/20次校验=80次 | 350真实3红5绿；351私有对象+当前签名解析复用后35相关case通过，原成本/余额/重复/非法/属性读取仍逐次核 |
| 解析复用资源/生命周期 | WeakMap不强留receipt；32768次插入/16Mi字符累计/单条8192字符，替换与已GC键仍保守计数；超预算换整张私有表 | 真实原304为20235条/7469302B签名，容纳一份活跃历史；条目/字符两种清空与大单条绕过回归通过，不将这些数字说成整个JS堆上限 |
| 解析值隔离 | 私有helper只给supplier history局部读取；operation不对外暴露、不写回原record；不缓存valid/permission | 当前源只有一个调用点，未改其它JSON.parse/codec格式。成功parse后null/primitive仍沿原后续错误路径 |
| 长等待 | PublicWait只读公开nextDate并每日submit，原24日实际24次Store/codec处理；全账也持续有成本；browser-game直接构造GameController/RunSession，实际evaluate/codec仍在主线程，当前源没有WebWorker | 仍未解决。不能把解析工作量减少或历史单次时间差冒响应合格；必须接后续公开事件意义接口/原硬屏障、费用和worker候选/lease完整方案 |
| 用户画面/剩余目标 | A长日重启、短情境/直接动词/必要金额/AP/日期，完整条款按需读；closed生态终态与normal board仍有原缺口 | 本轮不冒新增UI美术或人类认可；U6及全部原后续保持；兼容开发测试0 |

[杠精审查] 原正确性和体验分开；本轮已做真实修缮而非只改描述。当前942源完整模型累计、真实大档同原命令/旧档、必要Chrome与主原文保护均已齐；提交/post尚须实际完成。现有closeout-lib/freeze/check-source/engineering流程已覆盖本仓库反复冻源、受控测试和选择提交，不另建重复全局skill/agent/automation；无需新委派或全局memory写入。

最终实际补充：350原3红5绿保；351当前源942/2owned，89完整模型文件一次594/594（含7账务35定向，不重复累加），type45898ms/build1411ms。原304完整回读、同诊断Jun6完整canonical SHA/长度同，kernel19139ms与历史62231ms仅单次非受控；原Jun30 batch kernel448363ms，新完整wire与348真实saved305逐字同。新codec五原v1、真实77/304 v2、真实305/329 v3和实际330均规范字节同。作者多份完整run同进程maxRSS2527760KiB，不是Chrome堆/正式内存验收。实际351 Native329→330、原347同一命令结果、backup329/readonly/cold原文同已齐；主129更新前后全部1317268B原文同。source/type/build/实际边界及全部未修问题见validation.md，不能把本组数据正确作为UI理解/趣味/性能或全U6完成。
