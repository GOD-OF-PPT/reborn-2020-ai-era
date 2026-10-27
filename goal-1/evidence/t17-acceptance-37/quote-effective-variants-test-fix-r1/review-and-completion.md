# 8个独立反例已预注册拆分；未运行

原单it内8variant改为顶层常量+it.each，各自继续默认5s，没有新增it timeout或修改config。原beforeAll20s仅原两raw导入setup逐字保；其余4it/全部辅助driver通过prefix/suffix字节比较完全同。原5case现4+8=12，是展开原有独立反例，不冒新增产品覆盖。

8个fixture/update/state定义和原反例全部expect行逐字相同，清单见assertion-and-variant-mapping.json。原循环后exportSaved原字节断言保到每一反例末，隔离更精确；各case各自props/request且hook路径按唯一label隔离，不提交命令或写Controller，无需为本只读反例增加重导原档或codec setup。Controller真实未在本轮运行。

[杠精审查] 静态保原通过：未延长时限、未删变体/断言、未用20s包整组、未把timeout先认产品bug或性能通过。只有这一份新test写源；Reader/records、配置、旧result及登记保护输入末核无漂移。真实187=169pass18fail原红保，quote原4pass/单5758ms超时是Root实际终态观察，尚无本次修后新绿。Root统一检查，其他17红由对应Owner负责。

三文件/前像/原result快照/检索截断偏差披露完整保；所有新证据JS guard+wx。工程/type/Browser/codec脚本/Git全部not_run，compat0。U4B#8和全目标未关闭。
