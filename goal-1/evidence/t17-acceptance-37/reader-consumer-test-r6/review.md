# 一处mock签名类型错误补正

Root R3类型检查实际exit2/40604ms且599源/extra初末同，唯一新Book.test332错误已保原文。问题在新增旧Advance request变量用了泛型宽ReturnType而丢失原函数调用签名。

仅用Vitest已导出的Mock<GamePanelProps['request']>声明与vi.fn<GamePanelProps['request']>()创建，外加type Mock导入；没有any/as断言、没有改原RequestCommand或生产consumer。三处精确逆变后整文件逐字等R5，21case、全部业务断言与setup/默认时限等其它字节不变。

[杠精审查] 静态补正通过：类型现在表达原请求函数，而不是构造函数并集；不靠放宽源码或删用例消错。没有新跑tsc/tests/build/Browser/Git，Root后续实际运行才证明修后结果。测试文件重新冻结，原红保留。
