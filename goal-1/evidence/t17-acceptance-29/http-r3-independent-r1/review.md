# R3当前HTTP与版本身份

实际R3 HTTP合同通过：5366 PID26927，完整Python argv/cwd见runtime-identity.json；47个磁盘产物逐一GET全200/逐字节/SHA同，根入口同，原exports runId与33个DEV故障literal marker均0命中。没有切换或停止服务，没有执行游戏命令或访问数据库。

原U1 helper仅在新目录做路径/单构建适配，旧helper未执行/修改。第一次完整HTTP通过后，尾部JSON全对象比对因9个根配置有gitMode而helper行未带该可选字段误报漂移：所有bytes/SHA/posix mode相同，假红和脚本前像保留。第二次改为字段比对，完整HTTP仍通过；尾部又正确发现Root刚授权冻结的SeasonRecollection生产/test两项新标签变化，故总脚本仍exit1。此次不是再误报，也没有隐藏；其它528项与extra同。

http-contract-final-result.json把R3静态产物/当前响应通过，与当前源码已准备R4的两项差异分开。它不把第二次exit1写成全工程0；后续Root要求独立typecheck-r5/build-r4，不切当前Native R3。本检查只证明所列47响应及身份，不证明Native/完整Create、兼容、性能或整体U2完成。
