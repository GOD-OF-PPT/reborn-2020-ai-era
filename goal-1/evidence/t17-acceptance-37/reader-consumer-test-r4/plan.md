# 同一U4-B：6项测试harness失败定向修复

原新增6文件检查真实exit1/22081ms，599源/extra初末同，58case=52pass/6fail。原stdout/stderr/result及R3完整前像已保留。只改RelayRecordBook.test.tsx：陈旧button调用前记录spy调用基线，调用后断言不增；原beforeAll的真实request数量/payload读取、confirm=true与原Controller保存断言全部保持。

五个反例case的六处addDays(date,-1)违反原core非负day count，改用独立UTC上一日helper产生合法其它ISO日期；所有expect null和业务金额/owner/canonical断言保持。不改core日期规则或vitest clearMocks/restoreMocks/worker/任何门槛，不新跑checks/Browser/Git。

精确逆变后整文件应等R3，保原15case及setup20秒/default5秒。Root后续修产品与新增consumer场景另记，不混成本次6项harness修复。
