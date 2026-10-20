# P2-S2 R2：完整输入帧修复，业务策略不变

业务执行完全继承policy-r1.md：同六正常身份、原十二delegated形态共72行、同基准价与真实案例/资格、原公开付费独立核查、同四点及真实日期和费用。不能以旧R1六条正向替代全72，也不因传输结果改变seed、支持模式、策略或门槛。

R1已终态exit1：72注册、7尝试、6完成、1归档fatal、65未执行。第七条虽到实际年末，完整原档未成功归档，recovery-members.json因ENOSPC为0字节，不能算正向或完整证据。原matrix-r1已封存；原工具/策略/driver副本在source-r1/manifest.json，原source freeze和全部失败不覆盖。

实际采样定位Python阻塞在stdin read，尚未开始lzma/Git；只终止核定RTK29212后主采集器走原fatal收口。完整有效小容器保持stdin打开时旧helper等待EOF，关闭后全字节通过，见diagnosis-r1/legacy-eof-boundary-repro.json。大输入诊断原先因ENOSPC写成0字节，那组20/4结果全部无效，见invalid-zero-input-probe.json；不得引用为成功。EOF消费者等待已复现，上游间歇未关闭EOF的具体组件根因尚未确定。

传输修复：Node在原完整container字符串上计算UTF8总字节和SHA256，以成对--container-bytes/--container-sha256传入原RTK→Python pack。helper读取恰好该长度、校验整个输入SHA后执行原完整JSON/member/路径/封存/独占写入及解包逐字核对；完整帧无需等EOF。长度必须正整数且不超原256MiB，SHA必须64位十六进制；短帧、错哈希、非法JSON/member拒绝且不产生输出。无flags时保留旧EOF API，XZ格式、完整字段、原12MiB/member和全部guard不变。帧协议处理一个声明的完整body，不把后续非body字节并入container，也不新增raw临时落盘。

先保存旧helper下17测试的实际红结果，再修复并跑17边界/全部Python工具及严格CLI/项目类型。额外在真实Node execFileSync→RTK→helper调用缝隙，以旧R1完成档的非空完整54MiB级container内存往返、全成员逐字/SHA核定；不使用作废0字节输入。归档子进程新增120000ms上限，旧游戏命令/验证限时和断言不改。

新driver必须执行前核新source freeze和先决结果，输出fresh matrix-r2。拟显式--max-old-space-size=1536只限制采集工具managed heap，不能约束总RSS或Python子进程，不是游戏预算/性能结论或裁剪许可。仍一次一场景、全72、完整Create/后缀/原文。真实资源失败原样fatal/partial保留，不改限制/忽略结果/重启活作业。当前磁盘曾连小源文件不能创建，清理仅本项目可重建且未跟踪的node_modules/.vite 4851986bytes后小文件恢复写入；不删除旧证据/档案/用户数据。完整矩阵启动前必须恢复足以保留完整失败原文的真实可写空间，不能把小XZ体积当失败恢复保障。

matrix-r2终态后才新独立audit复核全部输入、完整raw、严格codec、原命令重放及独立账务/四点/日期/风险。十二形态均须至少一实际完整正向才可关闭P2；原90关键/P4及全部后续T17/旧PNG0/3/真人0/M01暂停/T18保留。没有页面兼容性开发或测试、浏览器新验证、push/deploy/真实API或付费。

## 空间恢复后的实际R2边界

恢复轮现场free1108959232bytes，goal工具状态active；外部空间变化来源未知，不推断用户具体清理动作。新源已实际成功写入，Node execFileSync→RTK→helper连续三次54163289字节/28完整成员逐字同，XZ也与原档逐字同；仍无raw staging或游戏命令。原2GB是恢复空间建议，并非业务或既有验收门槛。新driver及每个全新prefix/case开始前要求至少640MiB真实可用空间，为原256MiB完整容器/失败原文及日志保留空间；这是对已发生ENOSPC的工具保护，不能保证其他应用不同时占满磁盘。不足时原fatal/未执行和已发生数据保留，不取消活case或重试覆盖，更不删字段/历史。1536MiB managed heap照已列边界执行。实际命令/日期/规则/策略和完整72不变。
