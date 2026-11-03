# 当前同一613命令的较晚窗口诊断

原早窗口20秒在runtime.validate事实查找；本次候选463固定同612/原normal-capital-v2:613/Aug10命令，在开始evaluate后120秒采名义1秒。实际Profiler派发窗口5394.239ms/286样本，80.98% self samples在core/money.ts:18 sumMoney，96.61% inclusive在assertLedger，路径为meter_day→supplierCost→post→applyEconomy→assertEconomy/assertLedger。这是实际meter供应用量处理的局部窗口，不能与早窗口相加或冒整步分布、正式性能、已保存结果。

副本无open端口/Debugger/Runtime.evaluate；自检先过，实际样本写盘后仅自有cloneSIGTERM，原71876和完整差分13127未被修改/停止。原始样本/命令/启动终止/自检均保。本次不引入money或第二产品优化，先等fact候选原613全wire。之后如仍需优化，必须先定位sumMoney具体调用形状并保BigInt精确累加/合法金额界限/原错误顺序，不能用不受控Number求和、放预算或删校验求快。原源money.ts不变，正式钱/AP/日期/权限合同保持。
