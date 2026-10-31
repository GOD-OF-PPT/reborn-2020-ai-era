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

## 391首屏修缮准入（仍同B5）

当前Chrome原333真实Clock核对图a02首屏仅见已有待付324与通用引言，日期范围/推进新增0费用0点在后页；全文存在不能冒首屏可见。原确认已取消，旧333保存状态保；同服务Jul11等待只发一次14:14:48，14:17:59仅发一次Stop请求，当前实际结果未读回，不重复时间/导入、重启、换源或删DB。自有静态388仍固定并与390全部55构建等。

仅修原确认阅读层：去掉已有ClockFacts时的通用引言，把日期范围与推进自身新增费用/行动合为一句放在该组件第一行；各原账户的已有待付仍逐账户列，不混资金、不用净额或预款代替；原预留使用行动、占款转换/释放、逐笔Clock和全部原确认仍保。无改字号/滚动/裁切/断点/viewport、无新图声规则或权限。调整现有ClockFacts测试的文案期望，不增加镜像测试或提高限时；相关完整文件、类型构建与真实当前首屏核验后才能声称修好。新增owned为ClockConfirmationFacts.tsx及其原测试，App仅去Clock通用重复引言，仍同B5不是新task。冻结391；当前原Native等待仍用旧固定源，当前正文修缮不热换其Worker。

## 392真实大档检查点失败修缮（仍B5，改前合同）

原Native185未重发Wait：14:14:48原Jul11等待一次，14:17:59只发Stop请求；原停止是否被收到尚无真画面确认。实际随后出现“未保存·旧提交仍完整 / JSON_LIMIT_EXCEEDED”，a06原生AX已保。已通过原导出未保存候选→Storage第3页→实际Chrome下载/OS Save，完整保全native-r1/actual-candidate-before-fix.json：4671765B/SHA6d9ac06d4f208ad33f4880d7b13ffa13d261869bdb12d81944837364ba1c0904，v3/revision337/logical55287608/run u6-board-capital-pilot-v1。原333已保存4652925B/81fd365f..仍独立保全；未点击重试/舍弃/导入/新局，不能把候选337冒保存或把4步早停自动归因于Stop。原物理head及backup还需独立读回。

当前定位：captureWaitCheckpoint对3份Run调用普通assertJsonInput=300000节点，而正式RunCodec.validateRun用既有MAX_LOGICAL_SAVE_NODES=5000000，v3合法历史还有既有10MiB编码/256MiB逻辑/5M节点边界；不能把命令的300k节点套给已支持完整存档。这是原Native实际红，不是missing模块/伪造边界。先从原333及真实候选通过391原Codec读入并实际测节点、复现普通budget拒绝，再只将Run结构检查改用既有保存节点上限；原commands仍300k，原depth32/members100000/getter/prototype与全部领域/引用/版本/receipt/log/CAS校验和全部限额不变，不增加任一全局预算。

固定源391留作错误对照。以真实原4份时间envelope从原候选receipt恢复，必要时按原372Kernel独立重放取得真实紧邻336，严格比完整Run/wire/RNG/receipt/cause与候选337，不用倒推余额或补字段。修后在自有fakeIDB验证同真实候选commitCheckpoint与真正abort/旧head333/原backup、同候选重试存储，不冒Native原session retry。原Native候选已在旧Worker内，静态换源码不能热修该实例；任何以后舍弃/重新读取须先保全旧333、候选337与完整原文/实际同命令审计，旧失败证据不改，不把新尝试当原retry。当前自有QA/DB保，主5415仍372/129不更新。

391首屏修缮已有单独完整ClockFacts3/3真实exit0/11368ms（62451）；原6文件组合两5秒超时+setup10秒导致3skipped保，不能说组全过。392接预算修缮后跑相关完整存储/应用边界、原保存/command budget负例、必要UI和类型构建；当前正常原文/真实小循环未齐前不交付B5，不进U7，全部兼容开发测试0。

## 393停止请求不得成为已保存故事（仍B5，改前准入）

原失败后关闭只读导出，Native实际主幕仍333/Jul4/原钱/AP，hasCandidate保，但“这次真实留下的回响”显示“先停下来，已经发生的日子保留”。此句来自GameController.stopWaiting立即写notice，尚无一段checkpoint保存，不能让控制请求承担真实结果回响。先在已有真实logical-yield Stop集成用例核：stopRequested会立即true，但公开rev仍19、原notice不被请求改写；原最终Stop理由、真实commit20与完整物理wire断言都保，原5秒不改。393只加这个正确红，随后394产品只使stopWaiting触发原通知而不写新的故事notice，处理状态仍读现有timeWait.stopRequested，实际保存后的App waitSceneResult继续负责真实回响；不改步骤/钱/日期/权限/业务规则。runtime-client本来只notify不写notice，保持。

此修缮不抹原Native错误图或把旧337候选当保存。旧候选/333物理旧档与独立原372完整后缀、真正abort/同候选存储retry已保且过，原Worker内候选未retire；新的真实Native循环须最终固定源再做。392存储9文件92/96四5秒超时保，单独两完整wait/runtime文件83257实际exit0/17715ms，全该组case过；392类型/构建真实过。任何下一最终source须按准确文件哈希复用392大档存储证据，不称新Native原session retry。

## 395真实反馈整幕的短文案与可操作性修缮（2026-11-01，仍B5）

最终394已在同一Native原333→实际Stop334/Jul5→无手动Stop到340/Jul11；334完整4657141B/ab3bb2fb..，其物理backup333完整81fd365f..；340完整4681185B/de546c97..，其紧邻backup339完整4675597B/b625c7b3..都已实际UI只读原文取回，未用余额拼数据。334短回响说明实际付54；后段实际付270，总324，AP3保持。当前支持确已完成、存在560条供应记录待独立复核。

A17真实未收起回响组合显示：三个赔付0重复占首层、源季度与日期多处复述，旧line+choice.line合计长，导致“先回今天/生活”在实际画面中离屏。不能以AX含按钮或以后U8/U9替代当前操作可见。当前真实收入/预款变化须从同账期原收入metric/operation核，不用可花增量或保护余额差倒算。

仅UI修缮：原relaySupportSettlement全量summary/lines/sourceRefs及所有正额赔付、欠款、未知来源照旧；增纯只读短句仅在同原服务/支持确完成、结算来源完整、赔付成本/实付/未付全为已核0、正额支持收入全来自同账期deliver_prepaid时，表达“支持完成，XX预款转成收入”。其他/混合/缺源不套本短句，不把收入当现金。等待brief仅对同一次实际保存区间内唯一完成支持、且无别项pause/retain反馈时使用，区间全部现金仍原首句，完整正文仍可细看。

本次已完成支持且可逐项核明的audit-ready主幕用这条真实短结果与待复核计量数组织一段，去重复的长detail；完整资源/日期/费用/原票留原近景与原册，不清记录、不盖未知、不改原command或资格。“安排独立核对”仍同原audit空稿/选择/确认；生活旁路仍只回今天，不自动花钱/AP或清旧约。来源季度在同对象题头保，历史/未核/停止等其他状态保原解释。新标题/主念头与纸件仍同一binding，不增加义务或强迫玩家清账。原字号/viewport不改，不滚动/裁切。

以真实Native334/339/340只读投影验证短句、完整原文、缺源/重复/错主/正额成本/混合反馈回退，相关完整UI/规则边界与类型构建按变化跑；原Native394完整后缀先独立原372核，已知限时红保。新源若只UI且Worker全字节同394，可明确复用实际存储/时间证据，但不能把冷读当新版本新保存；新组合须在实际当前340实核未收起信息/两选择与同动作可达。必要时在完整340/339及394原后缀保全后，单独声明自有QA的新验证分支，通过原恢复确认回合法333再走完整新UI循环，不能把两分支拼成一次或声称原retry。主5415仍未更新，0主Core/import/settings/bookmark，主129现完整pre文件再次82f3147a..核同并已合页回Room。全部兼容开发测试0。


## 397整幕可读性准入（仍B5，先登记再修改）

独立branchB原333恢复已真实完成。原Jul11一次等待于18:47:24.894Z发起、未Stop，18:57:54实际Saved340/Jul11但仍processing；18:59:40才原结果返回并恢复操作。a31完整真实Native图/AX确见实付324、10000预款转收入、560待复核和核对/Today双选择。但未收回响组合下，“环顾房间”仍与底部地点日期重叠，不能只因主旁按钮可点就说整幕过。此为当前自然窗口美术/文案组合，不启动兼容/几何专项。

仅把当前已核零赔付、纯预款支持收入的audit-ready那一句改成更短的玩家用语：560条用量记录还没核实。继续查账，还是先过自己的日子？原560来源/未核含义不变，明确“报告不代替独立实计”仍在同屏原纸件，原近景/原册保全原区别/来源/所有费用和全部记录；标题、收入短回响、主体/可花/保护余额/日期/AP/原两个动作与确认全保。其余阶段、正额赔付、未知和保存失败回退不改。不改CSS、字号、viewport、滚动或裁切。原396和a31错误组合完整保。

冻结397，仅这一UI文案行相对396变化，原Worker须全字节同；相关既有完整文件及类型构建按变化检查，原UI超时身份保。不热换当前396已保存分支。先保全branchB340/339完整原文和原372同ID后缀，必要新397验证分支仍须原UI受保护恢复原333、同一原支持等待，不将冷读或不同版本拼成一次新组合。最终397当次真实未收回响+双选择+探索/Clock/地点同时可读才交当前片；Main仍372，0主业务/导入/设置/书签，B5/整个U6/goal仍未完。
