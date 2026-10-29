# 真实长历史保存失败的复盘

原正常seed固定2020样本53续至76后，原AdvanceTime(2021-02-06)正常proposed，但codec/Session的10MiB明文信封边界使77无法提交。捕获state12983482B，原validateRun通过；298776节点、三期20客户×28日1680唯一计量，无重复记录或features混入。原最小反馈两次同SAVE_TOO_LARGE，原正确Session seam再次红；第一次harness误读importNew的void返回而未到提交，原输出保留。

修复将完整已验证逻辑v1与可导入物理v1/v2分开；小档仍原字节，完整历史大于旧预算时有界压缩。原外部10MiB、普通JSON300k、严格版本/内容/全部交叉引用和DB原子发布保。解包独立256MiB/5M节点预算，逐16KiB、完整消费、长度/hash/UTF8/metadata/嵌套拒绝与完整业务验证，预算明确有限。新增pako3.0.3只来自已核官方registry、精确lock/integrity；旧运行包替换0，无经济/日期/AP/规则/RNG/状态schema13改变。

同原76/同failed77经真实Controller/Session/store修后saved；原proposal逐规范state相等，物理新/原backup76/重读同。独立Node zlib解开等于原完整逻辑信封。另一真实head.put成功再abort、旧物理、memorylease只读、原candidate retry/新物理、原backup与重复命令在fakeIDB验证，明确非Native故障。Chrome则从原76依原Clock/PublicWait逐日29个实际命令至105；90首次用v2，104实际物理备份和105写者/真实WebLock读者/冷读均完整规范原文通过Create105逐步重放，628121ms，不能当性能通过或正常董事资格。

预防是跨codec预检/Store物理写入/读取/备份/导出/原候选的同链回归；不只测试export，也不删历史或改钱/seed来避开边界。恶意输入由独立原生zlib生成，原小档保全亦使用5实际历史。新产品代码没有临时DEBUG或故障注入开关，无调测试时限/worker/isolation。原超时、旧版本断言及环境启动错误保；已有fixture不冒真实玩家或新正常资格。

回滚必须保所有已保存v1/v2原物理档；旧构建对v2明确拒绝保留，不能改写或自动降级。整个U6、T17、PNG/真人/P3正式62与22/M01暂停/T18最后/goal ACTIVE保；兼容开发测试0。
