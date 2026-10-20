# 独立审核的内存压力复核与全量重试

audit-r2已因真实ENOSPC保存proof失败后受控停止，driver终态143；28个case事件中26 verified、2因输出创建失败invalid，44未审。26份实际proof重读bytes/SHA均一致；原完整matrix-r2的237文件及marker保持。旧partial audit已封存，不改写或把2失败/44未审算通过。

现场线索：本轮root08总量约62MiB；审核进程停止后可用空间由约122MB回升到约804MB。机器16GiB，停止后swap仍有约4GiB使用。输出增长不足以单独解释卷空间变化；内存交换、全局压力/其他写入均是待验证原因，不据此确定唯一根因。

两份只读复核未见verifier跨case强留完整container/proof：固定6份prefix；rows只保小结果和FileRef；解包同时分配stdout Buffer、UTF8字符串、复验Buffer、解析成员，atRevision/里程碑/proof局限本case；RunCodec只存固定配置，import/export无run/raw强缓存。因此先用更低堆上限促使临时对象更早回收，验证完整流程，不裁数据。

audit-r3仍读取同一封存matrix-r2、执行同一未修改的原verifier。Node managed heap从1536降为1024MiB（先前768MiB未启动草案保留，原因见audit-r3-heap-choice-r2.md），额外开启本机已核存在的--trace-gc；不生成heap snapshot/core等大文件。保留原640MiB启动空间保护、原256MiB容器/12MiB成员限额、六完整Create/150原里程碑、全部72/2006后缀及原字节/账务/权限/日期/四点/年末监看断言；不增加超时或换seed/策略。堆限额不约束所有native/Python内存，也不是已证总RSS或游戏性能结论。

原未启动的R3“两GiB门槛”预案与真实拒绝启动记录保留为草案；该门槛不是用户业务/验收要求。本次根据新增内存证据改为原640MiB保护+更低堆/GC实测，另建源冻结，不覆盖草案或旧失败。实际运行若OOM/ENOSPC或断言失败，原样保留并停止，不能把缺proof当通过；若内存缓解仍不可用，再依实际情况请求外部释放空间，不借反复改限额伪造完整结果。

先保存旧runner原字节，再冻结最终runner/本计划及当前系统快照，唯一fresh audit-r3。当前无活审核；只有在实际前置检查通过后启动，同handle确认存活，观察GC回收后堆、卷空间、swap与真实case进度。阶段性通过不关闭P2或T17，全部72独立结束及综合复核后再提交。COW仍notReady/未采用/原apply0；兼容开发测试0。

[杠精审查] 本方案保留原完整结果与验收；降低运行内存上限不是降低数据/断言/原时间门槛。GC/swap因果仍待实测，失败不洗白，不执行不安全COW或删旧数据。
