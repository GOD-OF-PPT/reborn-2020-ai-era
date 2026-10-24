# U3-C1 最终限定代码复核与暂停分支回归

范围：root31开工HEAD d77822a及547项source/assets/config基线的UI增量；只读检查本片CourseThreadAction/Encounter、CourseSceneChoice、Today/courseFocusOpen、App保存scope与其接线，并读取CoursePanel/OpeningObject/day-perspective/course-scene-result差分。没有执行产品模块、测试、类型、构建、浏览器或完整Create审计；仅Root后续明确授权在新CoursePreparationInteraction.test.tsx末尾追加第6例。App与其它产品源码均未由本次复核改动。

本次文件身份盘点：当前556项，新增9/修改14，共23项全在src/ui，0删除、0非UI/资产/配置差异。完整精确清单、SHA/模式和时点见baseline-ui-scope.json。基线包含开工原P3工作树，本报告不把它误说成裸HEAD构建。该盘点只是本时点源身份，不是行为、图片或最终封存验收。

## 唯一确定缺口：已完成样课暂停后的默认去向

原规则可从封存的正常ready86沿真实PauseBusiness达到：课程仍ready、工作室paused，公开focused模型为course-paused/outcome actual。房间保存原命令时，seasonFocusAfterSave保原course pin；它没有被强制换成studio目标。因此这不是只在伪造显示投影出现的状态。

复核时CourseThreadAction仅把course-ready、non-success、course-closed接onResult，其余接onChoose；Choice默认页也只ready/non-success进next。paused actual便落record，Today/Life只在next页提供，玩家回房间点原样课会失去本片新增的下一选择。路线App会跟随PauseBusiness到studio/non-success，可能让只走路线的检查漏过这条房间路径。原C2提前委派修补尚不能覆盖这个默认入口。

Root接受并实施的最小产品修正，当前源引用已独立读到：

- CourseThreadAction.tsx:22只把course-paused且outcome actual纳入onResult；命令/等待/历史分支仍先按原顺序裁定，不泛化一切actual为结果菜单。
- CourseSceneChoice.tsx:114将ready课程的course-paused默认页指向next。没有改原Pause命令、维护、钱、AP或日期；next仍不承诺暂停状态能新备课或开班。

具体产品SHA见source-after.json的rootProductPatchReferences。此时两predicate均实际存在；代码复核只确认接线，真正运行结果由Root后续原门槛核定。

## 新授权回归增量

只在新CoursePreparationInteraction.test.tsx追加第6个case，旧5整份16482B/SHA a507bc7273efc889c54bdb962590552e73e4f31de99128ba544c345ff1f3fd94 前缀逐字不变，包含Root刚加的可见课名断言，原WindDown例没有替换。新文件18260B/SHA f4887dad006143e63d43d9d929fcb6d4e3a6d8c697ca1d8ef73e965d3900106e，6例皆保默认5000ms，无增时限。

第6例使用同正常schema13 ready86原文，经原Controller先preview.allowed、再真实submit PauseBusiness saved；核paused actual后主button/物件同handler且进onResult不进onChoose、Choice默认open真next、Today/Life可达、同target及停止后原raw/账户/AP/date无额外活动、cohort0/收入0。以真实暂停后原文为阅读基线，不假设停止免费或抹去费用；不造状态、不复放C2或冗余activation长链。

源码已经冻结通知Root；本子任务未运行该例或其它检查，不写虚构红/绿。新旧前像/after原字节、写前guard三文件及追加prefix证明均在本fresh目录，Root将串行跑当前新6及必要原case。

## 其余限定检查结论

- 主操作与前景物件接同一个SharedActionBinding；原Activate仍CommandButton与confirm、等待仍ClockAdvance/公开日期和原屏障。history先回Today，source invalid不画准备纸件，readonly只放行阅读/选择；candidate/conflict/stale source仍由原共享守卫拒绝。可见课名现由Encounter的course-encounter-object直接呈现，不只依AX/title。
- Choice合法ready先给next，明确选受众才打开原CourseTeachingChoice；audience/cohort/refresh/update继续原入口，没有本轮实施C2。ready但winding_down/closed不再被提前教学委派吞掉next；停止许可有明确重核原范围入口，仍原资源/日期/投入与原确认。案例超过3保全部原选择并提示/阻提交，不再slice掉旧选择；其它完整原册、原draft槽和能力仍可达。
- Today只将准备thread纳入本片支持，按实际command/wait/工作室/当前草稿/原job判断待续，历史样课尝试不冒最新未完任务；完成样课与开课/报名/收入分开。账户不匹配先invalid，未用美术物件修复权限或换企业。
- App按run/account/完整target/准备与教学槽/recordId/open/epoch判同原册。旧回调不接管后来对象/账户/重开；License保留仍原白名单/真实committedEcho，自己的合法新许可仅在真实saved后绑定预期下一scope，不预写active ref。原video/relay及undefined legacy准备和原retry保持，旧recordId只在实际target变化清除。
- 结果helper已核连续revision、当前原receipt/真实saved及candidate/readOnly/busy，纯公开差分不构造收益；准备纸件13状态纯装饰，动态金额/日期/对象保原文本层，样课actual不用收款收据。

除上面已经最小修补的1项，没有在本次限定源阅读中发现新的确定阻断；这不等于穷尽所有分支或宣称完整游戏无缺陷。没有泛化兼容/C2、添加新流程或因假设风险而改源。

## 尚未完成的实际层

Root告知的R3正常82已有大纲100元/1点/7日、许可300元/1点/7日和跨季AP4、0cohort/无收入；DEV原head.put abort73→候选74/新物理73/原retry74/新物理74逐字同是Root独立实际证据，本代码审查未重复浏览器取证，也不凭说明补成整片通过。样课停止/重做/实际完成/next、重进及最后可见课名图与断言在本轮仍由Root继续；第6暂停回归实际终态尚未在本报告执行。

准备中的root31完整Create wrapper另作纯文本快核：输入/baseline/fresh同级输出与原mandatory字段/codec raw完整覆盖保留，角色由显式ROLE:前缀决定、lowercase origin只做一致性校验，126官方源与26P3 workingtree初末绑定；没有执行模块或审计，不能把它冒作已完整Create审核。全部captures停写与实际终态仍待Root。

原90个不同case分批、最新23 UI与Root其它检查应各按真实结果/源身份登记，不拼成一次全绿。兼容/几何/book-layout/缩放、真人/原PNG/P3正式62与22/T17/M01/T18/整体goal均不因本审关闭。

[杠精审查] 限定源审发现并促成1个真实可达分支修正，当前最小代码修补已核，第6回归只追加且保原5；本报告保持实际测试/Native/fullCreate待验边界。自此本writer停止，不再改源码或新证据；Root掌握最后串行验证与收口。
