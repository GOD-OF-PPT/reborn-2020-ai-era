# 原612→613日期步的局部诊断结果

原71876/15729仍运行，本轮不停止或修改原进程、不改游戏源/原策略/存档/命令ID/系统权限。最新有效原保存以物理head/journal为准，当前观察仍612。

先做/usr/bin/sample 1秒/10ms OS采样：主线程90样本在JS计算，含Set查找/JSON解析、大量JIT无符号；该片段不支持I/O阻塞或GC主导，但不能定位业务函数或证明日期已保存。默认sample被用户Python脚本遮蔽/缺模块，转用系统工具，无权限修改。

为定位JS栈，固定612原文9959254B/SHAb69e6b54c003da7647cb4087f504ae461db4aa2dd4a8d124be815892fab3c294，在独立clone读入原416kernel/registry+459codec；公开原待撮合买单/下一matching日Aug10核定原normal-capital-v2:613/AdvanceTime(date2024-08-10)，原previewallowed0费0AP。只evaluate、不提交或导出候选，不把任何clone结果接回主运行，不新种子/注资/重抽。

probe01自检因Worker只有unref inspector请求而top-level await未完成，exit13；错误工具启动链又提前启动实际副本，已在其导入阶段仅终止自有clone22662、原15729未发送信号。原错误/脚本/日志全部保留，不称任何游戏规则失败。probe02增加Worker事件循环保持、主线程ready/exit timeout，并在actual launcher加入强制selftest结果gate。修后selftest按预期保存CPU profile并仅自有cloneSIGTERM；实际clone23021也保存profile后只终止自身。所有inspector均是clone内Session.connectToMainThread，无open端口、无Debugger暂停、无Runtime.evaluate，没有对原运行注入代码。

原请求在clone开始evaluate后20秒采样，名义1秒，实际Profiler dispatch窗口约3644.818ms/561样本；不可说精确1秒或完整步耗时。约80.05% self samples在relay-validation.ts:47的facts.find回调，约9.48%在:16 timer.some。原同一行对照表明每条s.meters均run.facts.find，形成事实列表反复扫描；此为局部窗口热点，不代表整个AdvanceTime的分布，原窗口恰在evaluateCommand的runtime.validate路径。剩余OS/旧save-codec profile不能与本窗口相加。

后续可独立验证的最小方向：仅在meter校验循环前建立本次校验局部factsById索引，保第一个匹配及原错误/所有校验、不跨调用缓存；timer索引另列，不一并改。先真实访问增长回归红、缺失/重复/修改后再校验等语义差分，再以固定原611/612全wire、相称完整消费者和原最终613新保存结果验证。当前尚未实施任何产品修复，严禁热改运行源或删账/跳日期/放宽限额求快；完整正常2025、80万董事签署治理/U6仍未完成。兼容开发测试0。
