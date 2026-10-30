# B3长等待的隔离诊断原型，非产品实施

实际Native原请求仍按每日提交向Jun30推进，reader已实际看324/Jun25且另一标签写锁/禁用成立，不取消/重发/换版。原1日kernel33087ms实测热点为供应历史28.83%、整账13.14%、identifier11.05%。本原型属B3已出现的问题诊断，C-B3产品修缮仍在B3后；仓库src、运行中347、当前全部规则/测试/预算/P3一字不改。

排名与可证伪预测：H1原收据signature在每次完整校验时反复JSON.parse；以WeakMap(收据对象,{原signature,解析值})仅缓存纯解析，原字符串变更立即重解析，所有现行遍历/金额/引用检查保持，若成立原1日kernel耗时减少且完整提案全字节同。H2标识grammar纯谓词反复；精确字符串的正例集合缓存最多100000，满时清空，原typeof/长度/grammar拒绝不变，若成立其余不变的1日会减少格式检查成本。H3其余整账数值扫描仍占大头；若两纯转换原型收益小，说明不能将纯解析当完整响应性修复，后续必须继续分析，不能跳全账校验。

依次独立baseline、仅signature、仅identifier、组合的冻结副本；变动只在明确.delivery目录，完整manifest941逐字核，仓库产品不改。每份原304、同诊断commandId/dateJun6/originalseed原kernel真实运行，完整canonical GameRun及原Codec.normalize核同；无Store/0真实进度。代码变动以patch及SHA可审查，不能把该未验证原型放进主游戏或说性能通过。

实际失效对照：warm assertLedger后改signature金额/语法、原成本metric和receipt.id，现行原拒绝和修复恢复结果必须一致；缓存不信可变ledger、不略过任一校验。identifier各类型/长度/grammar冷/热结果同。纯缓存不得泄露可变解析值到外部，WeakMap旧键随对象GC，标识Set硬上限。若不等则记录原红并放弃该原型，不动运行中的Native或旧封存。

只为C-B3提供量化假设和风险，正式实现/完整回归/真实25日/Native复核仍待后续授权序列。兼容0，无图/声/依赖/委派/外部消息/push/deploy/globalmemory。
