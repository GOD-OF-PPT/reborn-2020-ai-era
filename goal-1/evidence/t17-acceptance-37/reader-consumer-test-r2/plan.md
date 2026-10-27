# 同一U4-B：两个新测试的类型修复

Root首轮tsc实际exit2/37733ms、599源初末同。只处理本代理两个新test：实际返回business目标的helper收窄为Extract<RelaySceneTarget,{kind:'business'}>，避免在period/meter构造时把宽union中可能的jobId带入；移除未用import relayResponseContext。不改生产PeriodRecord互斥类型，不用as掩合法fixture，不动其它源。

先保存两test R1完整前像及原tsc报告身份，再作三个精确文本修改。逆变后须逐字等于R1前像，保证全部case/assertion/原beforeAll20秒/默认it5秒与其余字节不变。只手工静态复核与文件身份读回，Root统一运行后续type/tests；本代理不跑检查/Browser/Git。回滚以此两完整前像为准，不覆盖别的工作。
