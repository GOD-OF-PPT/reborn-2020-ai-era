# 隔离诊断结果，未应用到产品

同原304/同seed/同diagnostic-only-jun6-no-save日期Jun6，4份941行冻结副本；baseline不变，仅signature、仅identifier、组合的patch和SHA在variants.json中。每份全kernel proposed后原Codec.validateRun验证、完整canonical GameRun逐字等baseline，预算/日期/原Run304恢复均核；热校验后改signature金额/语法、同signature的成本metric及receipt重复ID，所有原拒绝与恢复行为同。identifier冷热各类型/长度/grammar结果同，0 Store/0真实进度/Native命令，仓库src未改。

|原型|单次kernel毫秒|相对本次baseline|
|---|---:|---|
|baseline|62231|—|
|仅signature纯解析缓存|56692|约少8.9%|
|仅identifier正例缓存|64878|约多4.3%|
|组合|38976|约少37.4%|

这是同一进程依次一次实验，机器/JIT/GC/先后顺序存在影响；原采样那次33087ms不能与本次62s直接混成统计结论。未称正式性能通过/Native提速/完整25日或已解决交互阻塞。单独identifier未改善，不应独立宣称可发布优化。组合的完整字节和原守卫对照通过，但仍近39秒/日，不能替代响应性目标；正式实现需要C-B3完整review、适用边界/内存/多场景和长期实际检查，不能跳任何校验或动P3冻结代码。

原signature原型只WeakMap按收据对象与当前signature相等复用JSON解析，所有实际state遍历和金额/引用断言仍执行；无公开可变解析值。identifier缓存纯字符串grammar正例，最多100000，满则清；不缓存资格或授权。原型只.delivery、正式仓库代码及运行中347/941均未动，P3/全部旧封存保持。本叶完成诊断，B3 Native仍原请求，C-B3产品修缮未开始。
