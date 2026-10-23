# 原5秒支持检查诊断

原失败反馈环已两轮可复现（全R2与原7精确复验）；不再重跑全仓。H1优先：controller/真实Session/IndexedDB/codec重复严格import/export/validate/project导致CPU主耗，预测该边界与profile self/cumulative最大。H2：新UI player/season/course派生主耗，预测真实callsite纯函数耗时占显著比例；不通过删UI或伪造view改变业务。H3：宿主竞争放大墙钟，预测同源隔离重复CPU/wall及host观察变化；不把它推为唯一原因。

冻结从两个原测试的值导入/重导出/动态静态路径遍历实际依赖及原raw、配置锁/已安装package入口；保可解释图边，明确type-only/动态非字面限制。throwaway harness只放本debug证据，原6命令+reopen/整legacy原文导入+完整原断言，真实controller/Session/IDBFactory/MemoryWriterAccess，保持run/seed/资金。diagnostic自身长时限只收测量，不算原5s通过。记录真实边界count/CPU/wall和inspector CPUprofile；同源顺序隔离控制，不并发压力。

只提出具体因果和最小候选，碰原P3 WIP先报根不擅修。原tests/production不修改、不新增共享工具/架构、不操作浏览器/Git/兼容。每次取证写前guard；完成记录依赖首末hash与原失败证据引用，若宿主信息不足写限制。
