# 原5秒超时诊断结论

限定结论：主要成本在原严格编解码/引用校验和实际保存链；新player/season/course纯UI不是主要耗时。Session.view虽多次全投影，但本两场景只占约1–6%，不应以可变view缓存作为主修。当前诊断没有修改production或原tests，也不把长诊断timer内执行完成记作原5秒通过。

## 冻结和反馈环

原失败：全R2 936=929过+7原5秒超时；unit-cs3-original-retries-r1真实5过2再超时（技术首单5065ms、legacy5354ms，原487src无漂移）。本目录153项实际runtime依赖/输入/锁/已安装包入口前后SHA相同；runtime-dependency-graph.json保137本地值依赖、632边、原raw及type-only排除说明，未盲计全src。Root同时编辑Opening/Choice不在本闭包，未归因它们。包锁及入口版本固定，CPUprofile另保实际采样包源；不声称预先冻结全部node_modules未采样文件。

## 测量

throwaway harness只放本debug目录，AST提取两个原callback全部断言和normal helper，保原name/run/seed/资金/完整legacy raw/真Controller/RunSession/IDBFactory/MemoryWriterAccess。technical完整6原命令及原两次export+home/continue均执行。仅以同callsite wrapper量时、捕获原本已有export，未省断言或给假view；extracted-originals.json保原body/helper SHA。诊断自身120秒timer用于量时，不改源test默认5秒或宣称它们通过；isolate=true、一个diagnostic worker，非原全仓运行条件。

| 实际场景 | CPU profile墙钟 / process CPU | 无profiler同源控制墙钟 / CPU | 纯UI合计(profile/control) | session.view(profile/control) |
|---|---:|---:|---:|---:|
| technical 6命令+reopen | 3.577 / 4.297秒 | 2.731 / 3.328秒 | 18.93 / 14.07毫秒 | 202.62 / 174.49毫秒，28次 |
| legacy整原档 | 4.171 / 4.486秒 | 2.341 / 2.911秒 | 22.86 / 15.43毫秒 | 55.41 / 47.54毫秒，2次 |

technical profile：newLife581ms；6submit共2331ms；home97ms/continue232ms；两export240ms。26次validateRun合计2518ms，13seal与9readEnvelope均含其中；CPU栈validateRun约66%、#references约27%、queueEvent约20%。legacy：importNew3246ms、7validateRun2969ms、2import1639ms、两export831ms；CPU栈validateRun约66%、#references约26%，canonicalJSON/严格schema/跨记录校验主耗。边界和profile累计均嵌套，不能把这些数相加。profile管理员/采样与测量窗口略有不同，比例为近似。

精确边界/CPU-walls/host/rawhash在profile-r1-*.json、control-r1-*.json和comparison.json；两份.cpuprofile可独立打开，*-aggregate.json合并同源函数并对递归累计去重。原technical最终197560B SHA fe03a5dad59693be888f0074fb45f08eb517eb413e6c98aafc26d34720f98330，legacy2856590B SHA478f312b634050e97dd87900f2e8c6d1e6a238af18426faa75c0fa35b5b1f4f9；两轮分别逐字同。

## 三假设判断

H1获得强支持。技术链的26次严格验证可由原调用链逐项解释：13seal（create1+6次Session预seal与Store seal12），9readEnvelope（初load1/6次commit旧head/回Home list1/continue load1），2export与2次Session.open显式validate。legacy7次为inspectImport1、store.import再1、store.seal1、load/readEnvelope1、Session.open再1及两export。两种输入均主要花在这些保真安全边界。

H2作为主因被否证。technical 7次playerThread仅18.7ms，legacy两playerThread1.45ms+reel21.19ms；无profiler数据同量级。新course派生不解释数秒超时。

H3及冷暖/Profiler/GC可放大，但未被证为唯一原因。两轮loadavg约4.19→3.29，空闲内存约0.10→1.14GB，CPU/wall均约1.08–1.24（process CPU包括GC等线程）。原重试两个file并发，当前诊断单worker顺序；两轮又有Profiler开销及宿主状态差别，并非仅改变竞争一个变量。干净隔离诊断均低于5秒，说明原5秒红不是固定业务断言错，但不能反过来将旧红改绿。

## 最小候选和风险（尚未实施）

1. 优先回原P3 owning分支审codec.#references单次校验内的重复工作。技术热点是重建pending时逐项queueEvent，每项canonicalize/clone、扫描已有pending、再复制排序；可考虑只在已严格解析的本次run内以局部索引/一次排序或等价线性核对，完整保留ID冲突/相同重复、cursor前后、日/phase/priority、原顺序及canonical等值拒绝。legacy则重点同次receipt/cause/transaction索引与已解析签名复用，保所有跨域/账钱/旧档/封存检验。profile只证明热点，不证明某改法等价；原P3 WIP仍受保护；Root在本profile后独立核实codec.ts与timeline.ts当前git diff为空、不在26条P3 WIP清单。本次仍未授权apply，需Root先决定窄方案与原篡改/字节/原两case回归。
2. 低优先可考虑prepare只读runId/revision的最小Session身份接缝，避免为了两个标量全投影。当前六prepare只约34–37ms；连同rangeBlocks少量省投影也不能解释数秒主耗，不应把它宣传为根治。
3. 不建议直接缓存并共享Session.view对象：原契约是detached公开投影，调用者可改自己快照而不应污染下次读取；缓存还必须处理同revision的saving/busy/candidate/readOnly/closed/lease变化、reload/restore/commit新record及外部Store引用。跨可变run或全局skip validate会改变安全合同；未作这种优化。

本次只诊断，原两测试仍待Root按原5秒/原断言真实复验；原936累计未改结论。没有新的用户业务失败、Chrome/兼容/完整goal结论。debug harness和profile保在本明确诊断目录，不安装Skill/自动化或留生产instrumentation。

Root随后决策：先暂停进一步诊断Node负载，对剩余两个原Vitest用原5秒/原断言真正复验；仅当仍红再考虑本目录pending-proposal.md。Root会在已完成的153末hash之后修改非诊断字词，并另记明确桥接；不回写本profile source身份。
