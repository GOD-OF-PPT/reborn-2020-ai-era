# U6 必要基础修复：完整历史的有界存档封装

当前HEAD76f368a2，仍唯一U6，不启动U7/M01。界面287独立短文案已在实施，289/924源仅UI覆盖。288按原normal53续跑，原内核接受AdvanceTime(2021-02-06)形成77，但原codec在10MiB明文封装检查失败，最后规范档仍76/8767990B/SHA6cbaf14d5580ae7d79a05a719eedfd30060edb16409b86c1ccc03352df0863b0。未保存proposal12983482B是取证对象，不是已提交正常档。不能以调钱/seed/上限、删历史或fixture替代。

## Diagnose 与依据
已读diagnose，原完整续跑是实际失败反馈。先用捕获proposal建立最小确定循环并重复：原validateRun通过、原export报SAVE_TOO_LARGE；核20客户三期×28日计量数量/唯一性、无features投影混入和各顶层字节量。假设按顺序：1合法历史与固定明文预算矛盾；2重复业务记录；3序列化投影。内核已proposed排除资金/权限原拒绝。只用冻结283源作原失败参照，不修改原输入或封存。

技术08/调用22要求完整状态/日志、校验和、10MiB导入和原子heads/backups/receipts/logs、候选不先发布/原retry/只读及旧档保留。实际消费者为RunCodec、IndexedDbRunStore.create/commit/importSave/readRow/exportStored及Session预检；不能只修codec.export而留seal/物理备份或Session拒绝。

## 方案与边界
区分逻辑已验证信封和物理可导入信封。保所有既有可导入v1小档原字节/原语义校验和；原10MiB文本/物理输入预算不变。正常历史大于旧字节或旧300000节点预算时，用新增严格v2外层封装无损zlib/base64，内部仍原v1规范信封、schema13/rules-t16/原内容hash与RNG；元数据/内部校验和/逻辑文本hash必须相互匹配，不能递归套包或迁移旧1—12状态。

用已核官方文档的pako3.0.3精确锁定（命名同步接口/16KiB onData）；原输入10MiB先检查，再严格base64/zlib、长度/完整hash/元数据/内部严格schema与全引用/账务/随机/命令/因果组合验证。解包限256MiB、逻辑JSON限5000000节点，深度32/每容器100000与非法原型/访问器/符号/稀疏数组/非有限数原检查不减；原命令/普通JSON默认300000不变。这是保存数据层的独立有界预算，不是页面兼容或放大测试时限。原未压缩外部v1仍按旧10MiB/300000检查。

预算依据：真实两期1120计量已有8.7MB，正常96点最多约48期（还须准备/维护）且每期20×28条计量；完整6年连续经营需保留数十倍历史。256MiB/5M仍有限，超限明确拒绝而非无限解包；不得用本数值宣称极端无限操作、性能/平衡或全部六年通过。解包逐16KiB核实际输出，不信声明长度、不预分配声明最大数组；UTF8 fatal解码、zlib完整性/尾部、编码规范和多层包拒绝均须测。旧1—12/错误content/rules仍拒绝并保原档。

新增prepare(run)一次返回已验证逻辑envelope、物理storage、canonical text；seal仍给逻辑v1供Session预检及调用者读state，export用物理text。IndexedDB用prepare存物理，readRow解码后返回record.run但保原物理row供原样backup；交易/nonce/generation/命令去重/原receipt/log原子性不改。exportStored仍原样canonical物理数据，不能解包重封来消灭旧字节或不能再导入。Session继续提交前预检，不减少实际规则/版本/revision/事务验证，不缓存可变状态跳过校验。

Core JSON工具仅增加显式保存预算的共享检查入口，原assertJsonInput调用与300000默认行为保持。状态schema/游戏规则/经济参数/日期/AP/资格/权限/RNG不改，P326任何路径不改。新增依赖仅为必要保存修复，本290是对287“仅UI/无依赖”的有据必要增量，非默许改游戏规则或开启M01。

## 验证与回滚
先在正确seam留原回归红：捕获的真实proposal经原codec失败；新codec对同state输出v2，独立Node zlib解开等于原规范v1数据，再导回逐字段/规范语义hash/原命令/账务/RNG同。原失败命令从原76重新按原registry执行，不把取证JSON直接冒正常存档。另针对小v1字节、损坏/metadata/zip bomb/长度/UTF8/嵌套/旧版本、同clock/原子abort/候选/原retry/dup/stale/physical backup/原raw export做有意义检查。大型实际续跑用明确CLI反馈记录时长，不改原Vitest5s/10s/2worker/isolation；原UI旧超时按原身份保，不冒全批绿。

真实Chrome在当前自然窗口用隔离正常76经原UI/PRE/检查/确认导入，实际按原日历进入大档并保存、原文/金额/日期/AP、第二会话只读/物理旧新、重进/备份核。不能直接写IDB/localStorage或用fixture当normal，主129/旧用户origin不写。所有兼容开发测试0，不做尺寸/缩放/跨浏览器/原生离页或几何；原PNG/真人/P3正式62与22/T17余/normal board未达/M01须恢复/T18最后/goal ACTIVE保。

若失败只回滚本新增封装与owned接线，保旧physical v1/所有已保存事实和v2备份，旧程序不支持v2须明确拒绝并导出原档，不能覆盖/删掉。选择性本地提交、producer terminal→STOP→seal/post，不stage混合master/AGENTS/P3；原input61B/旧sealed/未接线模型/三master前缀+2304B插入保。无push/deploy/新委派/外部消息/全局memory更新。

[杠精审查] 方案通过：跨codec/Store/Session完整链修，独立物理与逻辑预算，既不删历史也不调经济；保旧小档字节和全部严格验证。不能只让13MB样本过而断backup/import，不能将压缩等同于游戏性能/平衡或董事资格已验。
