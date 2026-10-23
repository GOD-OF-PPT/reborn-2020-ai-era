# 实际诊断

- [x] 1 原失败反馈环与实际runtime闭包/原像。
  [杠精审查] 通过：原全R2 936=929pass+7原5s超时及原7精确复验5pass+2原5s超时均引用原终态，不改时限/断言；153项实际值依赖/包入口/锁/原raw前后零漂移（137本地/632边），Opening/Choice不在closure。
- [x] 2 H1/H2/H3真实controller/Session/IDB/锁边界与CPUprofile。
  [杠精审查] 通过：原technical完整6命令+home/continue，原legacy整2.857MB输入，原helper和全部回调断言由AST逐字抽出（仅计时/已有export捕获绑定）；profile与无profile隔离控制均同业务字节。边界为嵌套inclusive不相加，CPU/wall>1含GC等线程。
- [x] 3 因果候选/同源控制/限制交回，不擅修P3。
  [杠精审查] 通过：H1主耗被计时和profile支持；H2纯UI主耗被两轮数据否证；H3仅保环境/Profiler/冷暖差异，不能唯一归因。诊断长timer非原5s接受，不报原两项通过，不触原P3 WIP。

所有[DEBUG-c2diag]计时和prototype wrappers仅在此明确debug目录的隔离进程，finally恢复bindings、进程均终态0；没有src/原test/共享config/Git/浏览器/兼容写入。下一步是否授权原P3有据局部性能修缮由Root决定；未跑全936或删改原失败。
