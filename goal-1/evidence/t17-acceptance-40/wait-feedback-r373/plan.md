# B5：有意义的等待与有界保存检查点

前轮191593d1为progress，B4已限定完成，父354完整241文件STOP/seal11d62b65..，不得追加。本轮唯一原U6内部B5，不开始U7。完整goal input/plan/tasks已读取；A长日重启、短文案和一屏互动保持，所有页面兼容开发测试0。B5后继续当前Today纸签/随身册相叠、长服务回响与全U6余项，不把技术工作当完整美术完成。

## 已查明的问题与选定路径

executePublicWait现在每个公开nextDate执行原AdvanceTime并立即Session.seal/Store.prepare/物理保存、发布全view，relay日常计量使25天产生25次完整处理。public-feedback已经只按公开当前变化判断真正反馈；nextDate自身没有意义分类。直接从隐藏timeline挑未来反馈、把meter等事件一概当无事，或直接把payload.date改到target，会漏可回应事件/改变命令ID、revision与完整重放，均不采用。

选定保留全部原逻辑时间命令与反馈顺序，仅在Worker内部建立有界检查点：原preview/evaluate/validate逐步执行，每步从已产生的公开投影核反馈，没有读隐藏队列、未来试算或挑结果回滚。没有意义变化的步骤最多8个再形成一次保存检查点；有意义反馈、原责任/资金屏障、季度、目标日、停止请求和拒绝都立刻结束当前检查点。每步让出Worker接停止；只实际oncomplete后发布新钱/日期/AP、回响和步骤。未提交中间态不冒充saved或公开给renderer。这个8是内部资源/提交上界，不改变游戏行动/日期/费用，也不称正式性能门槛。

只保base、当前与紧邻前一份状态，以及有界命令/回执元数据，不持有N份大档。原Core/规则/schema/RNG/钱/AP/权限/所有逐笔账与原始命令ID公式不变，旧历史不删。普通IndexedDb默认采用新检查点；不具该能力的显式作者Store沿原逐命令路径，不能把fallback证据当优化通过。

## 最小接口与存储合同

公开意义接口从当前公开字段比较真实原步骤，必须区分未提交工作投影与物理已保存结果；提取独立的纯意义比较，再由原saved包装保旧消费者验证。UI仅得到实际保存后的PublicWaitResult，失败只保旧已存场景与候选，不泄露未存新回响。Store新增显式有界commitCheckpoint能力，保原commit和旧格式；不用放松原单步+1合同来接收任意跳rev。

检查点包含同run/actor的原base、最后原proposal、紧邻前态和1—8份原AdvanceTime envelope。核整段连续revision/receipt身份、不可变旧receipt/causes前史、同版本、原最终/备份全部Codec领域校验。只最后与上一逻辑态编码，单原子事务写head、backup、每份原receipt与cause log，generation按原逻辑步数前进并核安全整数/CAS。只在transaction complete返回；head.put成功后abort仍全回原base。duplicate核原整段并读回实际head，不能覆盖更晚记录；错源/缺行/重用ID/旧generation拒绝。

Session保持原writer lease与互斥，检查点候选仍可沿原exportCandidate导出原完整GameRun，retry保存同候选不重执行。新增私有检查点上下文，不把中间GameRun传前台。若失败跨多revision，retry成功后的真实等待结果由后台在原提交后提供，不让前台用猜测重构步骤；旧单步恢复继续原路径。更晚head/换run/session不能用旧结果画回响。

默认无明确对象终点时，当前公开quarterTarget是本次等待的上限，按原公开反馈逐步停下；标为“等下一次反馈/最迟范围”，不能把上限日期说成保证反馈日。已有明确对象/手选日期、课程期限、第一单提交和下一季通道仍保原独立决定和原费用确认。所有正常费用/AP/资格/只读/候选/冲突说明与完整原账可达。

## 验证与执行顺序

1. 先登记接口/字段与状态迁移，保父40完整seals/P326/132marker/2symlink/旧19与35/input61B/未接线model/master原前缀+2304B插入；冻结372/961，仅明确owned覆盖、不复制P3 overlay。先正确红测：实际1—8原命令、完整GameRun/原receipt/log/backup等值、编码/物理提交次数上界、原存储/状态在完成前不变。
2. 实施纯公开意义比较、Worker内部有界检查点、Session/IndexedDb原子candidate/retry与generation；错身份/损坏前史/部分duplicate/abort/conflict/reader/close/stop分别核，不删原校验或提高10MiB/256MiB/5M预算。
3. 接Controller/默认等待上限/原捕获确认/多步retry回响；在前三里程碑后做一次全面review-debug，核所有真正消费者、旧单步与新检查点、原所有边界和完整模型/相关UI，原限时/2worker/隔离不改。原红保来源，不改旧封存消红。
4. 独立Chrome固定新源，优先延续QA原真实333单一规范存档，原同对象等待/取消/Stop/真实结果/失败保护分层，完整规范后缀与原372相同实际ID/phase独立等值；不是完整Create/正式真人/性能。主5415原129前后全文保，0主业务/导入/设置/季书签；足够通过才更新主源、保旧资产/DB。自有QA精确关/DB保，主server和deliverable可玩。
5. 本任务准确owned本地提交、逐blob/模式/路径/index核、提交后任务记录和post、terminal→STOP→fullseal。无push/deploy/新委派/外部消息/global memory写。

## 风险、回滚与全目标

批量的物理提交不能伪造每日已保存；任何未提交结果不得进入人物/收入/新日期。旧rawSession与自定义Store要明确能力边界，控制停止不能排在完整等待后。重试晚到、更晚head、跨session、只读与原候选原子恢复都必须真的验证。若任何整个GameRun/backup/receipt/log/RNG结果与原相同逻辑序列不等，先修，不能用只看余额或删事件代替。全部正式存档旧格式保，回滚只恢复本轮owned源码/构建，不删或重置用户DB。

原正常资本仅348真正saved305单一输入另登记，不把Native333拼为同条董事经历。全U6短文案/系统美术/17动作5共享/closed生态终态/normal2025board/最终全审，U7/U8/CUX12完整U4-B/U5/U6、U9后组合、T17余/PNG0of3/真人理解趣味美术0/P3正式62/22 not_run/M01须明确恢复/T18最后/goal ACTIVE不缩。

[杠精审查] 计划不把少存几次等同于少执行原事件，不用隐藏预测或弱校验换快；所有中间逻辑命令与完整历史仍须等值。实际写保存语义与新最小公开意义接口有对应验证，原UI和美术余项保。不启动兼容/几何专项。

实现收紧：普通Session.submit和Store.commit仍保持原路径；语义等待的1步检查点也执行新的真实base校验、原head/backup/receipt/log单事务（只编码final、backup保原物理row），不借单步delegate绕过新范围合同。Store.commitCheckpoint自身也核显式cap；覆盖commit策略的子类默认不启用，防hook被绕过。
