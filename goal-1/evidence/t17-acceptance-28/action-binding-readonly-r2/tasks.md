- [x] 1. Root原C-U1-A-R3逻辑红和当前7源前像已保存；原readonly UI读取断言未改。
- [x] 2. 仅shared-action.ts分开身份/状态：双方当前同一snapshot且allowReadOnly、readOnly true、read_only时允许纯UI；普通command仍拒readonly并返回正确原因。busy/candidate/conflict/陈旧/closed仍被拦。
- [x] 3. shared-action单文件串行9/9实际0，14.00s；CLI --testTimeout=60000/--hookTimeout=60000仅原链等候上限，不算性能通过。测试expect/源码时限、其它6跟踪文件均逐字/模式同；新SHA冻结交Root。

[杠精审查] 限定通过：未把read_only改成saved或发命令，只有明确纯UI豁免可读；原候选/存储/身份门槛保留。没有把旧47pass合并冒称新源全48通过，也不代替Root原生/整U1。
