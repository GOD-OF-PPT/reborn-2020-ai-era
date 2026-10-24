# R3后交互与R4窄修复独立只读复核

结论：已读范围未发现新的确定阻断；本次不运行测试/类型/构建/浏览器/审计，不修改任何源或旧证据。

1. CourseThreadAction的teaching non-success现在先于thread.wait路由onResult，原pending planned/running仍走原Clock。新增stopped-priority回归明确是UI政策输入，由真实normal92得到base后显式覆盖stage/outcome/wait；不冒新停止存档或真实C端履历。历史job仍先进Next、再由玩家明确返回同cohort去jobId，不默选后来尝试。
2. CourseTeachingChoice首段stage-needed的暂缓Clock在原record/next内以details显选展开，日期仍来自courseStageWaitDate；原主决定仍为选择教学。CourseTeachingChoice.test.tsx:203—226继续保Jan30上限、AP0/1、readonly/candidate禁等、同稿与无命令/原档不变断言。More只增加打开同对象原册的显选导航，没有弱化原断言。OpeningMoment.course-wait两例保原Feb10/Jan30、期限/屏障/错对象政策边界。
3. related-r3真实终态exit0，13文件98/98，223891ms，562源前后同；build-r3实际exit0/54627ms，562源前后同。新互动7/共享5在R2、SVG4/C1原6/Today9/等待2在首轮另有身份，未将不同批次相加为一次全绿；R1 36/38与R2 17/18的原红记录保留。
4. R4准备变化对R3原562条源路径逐项读回只见CourseThreadAction.tsx（受众caption）、OpeningMoment.tsx（翻阅inspectLabel）、course-teaching-art.css三项。前两者不改payload/target/guard；CSS仅在带data-teaching-phase且非disabled物件的hover/focus-visible/active上background:none，保持原静态文字、透明素材及disabled状态。此为原窗口已见hover问题修缮，无兼容或几何工作。

验证边界：组件/SSR能证明Clock存在和原锁，并不证明原生details展开后的实际可操作性；R4当前Chrome还需观察该入口与hover结果。R3绿身份不代称R4已经运行，也不证明当前完整班期/只读原生焦点/失败恢复/趣味性。当前只比较R3既定源路径，没有建立新全源冻结；最终源身份由Root的R4 runner实际承担。

后续normal-export-audit需等Root明确原文停止写入后再独立核实际终态、manifest角色与公开金额/日期/AP/同班事实；不会把不同Advance分支完整features SHA相等当门槛，也不在此预跑审核。

[杠精审查] 限定通过；已区分真实存档、UI政策覆盖、分批检查与尚未Native验证部分，未隐藏旧红或删除能力。

读取身份（sha256，未附新大快照）：

- goal-1/evidence/t17-acceptance-32/debug-r3.md 1330B 098721cea8fc23c43b67ef2d236bdb0cd4b18f74dc4c5c2ef6ef19acca9a99a0 mode 420
- goal-1/evidence/t17-acceptance-32/related-r3.result.json 985B ee14e4b6d9af73b3bf6a04a2982c95cd7a93c0fffa59cc667065287989a45561 mode 420
- goal-1/evidence/t17-acceptance-32/related-r3.stdout.log 194B da3509efe2fd86e5df71705dce36b6ae2c2198f2692725eed6b43d3ed857018f mode 420
- goal-1/evidence/t17-acceptance-32/build-r3.result.json 310B 2070a55b2447b962dc9de21ce94a9ac12287eff3fee8290ace70e7db229993c5 mode 420
- src/ui/CourseThreadAction.tsx 3588B 32a1830f7805c5fb8893b665d3de1a831c22709d5ea8d8acce3747080fb43cbf mode 420
- src/ui/OpeningMoment.tsx 47674B 3d0d3621e4a2ff6d8be5dd960767ee4ab86e845953971ff6f7ba98f85283a229 mode 420
- src/ui/CourseTeachingChoice.tsx 53368B c12ce42e60045000bf46bea5ba07652c6c11c198f787e65c8cecf05abcf2104c mode 420
- src/ui/CourseTeachingChoice.test.tsx 21653B 1be4fd49a2d3dc797be7795395f610ab1d20851ed1c32e1be9af7e48b2667457 mode 420
- src/ui/CourseTeachingContinuity.test.tsx 7945B 6e762f05ab3a1763ee499224edf9891b2afeecf8c5b40862b355159d574557a5 mode 420
- src/ui/OpeningMoment.course-wait.test.tsx 5835B cf5c644397fefbe79cb2f9003f1fee0a889e3a3556268d1c51fa7c41b3362980 mode 420
- src/ui/course-teaching-art.css 4466B 0edf7b7d31aa65272f851d051b3a0768c7d413f587ac802d3eb8a179940ad74f mode 420
