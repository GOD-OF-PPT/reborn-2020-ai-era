# 六项consumer增量静态交回

只改新RelayRecordBook.test.tsx：原15case/断言/原five-save setup逐字保持；新增6case、独立controller setup、专用walker和5行必要import。新增ClockAdvance consumer调用useMemo，故仅在原React mock返回中增加useMemo(factory)=>factory()以驱动纯计算；原state/ref/id/effect及旧driver不改。逆去这组新增内容后整文件逐字等R4，所有原门槛与配置不动。

1. 原Panel带encoded invoice key进入Reader，填写0.02后展开同票details原依据；不触发onTargetChange、不丢invoice/来源/金额稿，也无业务request。只核实际React状态，不冒真实DOM reveal/focus。
2. 原客户票进入明确充值PreparationEditor，再onInspect→Panel.onTargetChange携原target、customer-funds和encoded原key；同近景到原册原case仍保，其App setter/read-prop链已静态读取，实际App/Chrome仍Root验证。
3. 独立controller正常86真正原StartRelayAudit单meter安排：根据已公开本人active支持Nov6—13选择Nov14未来空档，显选player-production，原preview+submit必须saved；没有推进日子、没有扫描随机结果。SceneProgress/Book/ThreadPurpose/FocusOpen须指同job等实际完成，不给第二次委托、不揭实计。该流程尚是测试代码，未在本子项执行。
4. 多active审计是明确public input歧义反例，不导入/不保存；不挑一份/不重复委托/不揭实计。
5. 实际CommandDetails→RelayCommandDetails渲染captured续签/重报价完整参数，包含新旧期限、mode/信用、客户编号、方案、资源及开始/完成/生效日；构造后来公开view不变原capture，candidate/readonly渲染无按钮/写档。preview使用原controller实际返回（旧capture可能stale），没有伪造allowed。没有完整App确认testhook，不借此宣称App实机验证。
6. 原Panel实际RelayJob Advance在有效snapshot发原date/label/request后只保存另一条原Audit修订，再调用旧handler不得新增request；初次request调用副本保存在普通数组，避免clearMocks清零误判。原Advance没有被submit。

原6文件58case=52pass/6harnessfail原红保，R4只修harness未跑；本R5也未跑tests/type/build/Browser/Git。beforeAll新hook仍20秒、原每it默认5秒，不改配置/worker。Root统一r3Gate/type/consumer运行后才可说通过。原response生产与其它产品未由本子项修改。

[杠精审查] 静态范围通过：新增用例沿真实Reader/Editor/CommandDetails/Clock/Panel链而非只查helper或源码；真实安排与display歧义分开，原字段/原确认/同对象/旧snapshot均有具体断言。全部21case源码现在冻结，兼容/几何开发测试0；不代U4-B/C-S4-R/原人类理解与美术认可。
