# D08 交互重构独立源码复核 r3

2026-10-21。对主控所称r9最终delta及其相连公开投影/保存/操作入口作只读源码复核。仅新写本报告，未改任何源码、计划、输入或旧报告，未运行测试、类型检查、构建、浏览器或兼容专项。主控正在进行的最终26UI/build结果不由本报告预判；报告不把主控口述typecheck0冒充本审查亲自运行。

## 结论

在下列17份源码快照的本次定向范围内，未发现新的可证明动作缺陷；r2两项确定问题均已由实现修复。该结论只覆盖静态调用、公开信息选择及guard连接，不等于所有后期组合、浏览器视觉、真人可理解度或趣味性已获验收。

## r2修复核对

1. **Story不再进入choice union。** activeRisk先以公开resolvedAt===null且stage非normal/resolved筛选，再把原id传给storySceneProgress。房间detail单独取deadlineWarning，缺省只说明原公开deadline和既有责任。统一pending.choice.line仅剩接口确实含choice的video/course/relay，不再存在story undefined.choice.line路径。
2. **已解决风险不再抢占当前责任。** 上述activeRisk过滤不会拿storySceneProgress为专页保留的最近历史fallback作为房间当前事项；有效风险在sceneWorks前优先呈现，原pause仍最高。风险专页的全历史未删。
3. **纯历史不作为默认pending。** video gate针对未结合同、未发布自有作品、未测量发布或未收结算；course gate针对open班或公开更新；relay gate针对未结周期、公开未结客户/款项或已揭示待更正差额。无业务relay不会触发opening，单纯closed历史不主动接管房间。原helper专页与原册仍保存历史。
4. **新事项优先旧首单回执。** paid只是后备，sceneWorks、有效经营pending和原生态合作先返回。原budget不足2时不再首推不能执行的WorkQuarter。

## 原修复持续有效

- 成功非时间回响只有App中原有唯一room拥有者；CinematicRoom不再重复挂载SceneEcho。
- 数字快捷键过滤isComposing、编辑域、修饰键、modal、repeat及禁用/inert按钮，最终调用现存按钮click，不另行构造核心命令。
- 首单offer/planned/running/waiting未就业时，原WorkQuarter可作为明确非互斥旁路，金额/AP/日程仍由原预览裁定。反向组合测试使用真实Controller动作，未赋予免费预算。
- 当前抉择说明、真实成本、4AP筹码与直接行动保留在RoomMoment同场景；完整日历以compact入口打开原Dialog。资料/决定/时间保留不同语义，五路线和全部原账继续可达。

## 公开信息、规则与保存边界

- 新activeRisk/pending只读view.features公开字段：已知deadline、实际stage/status、公开funds、审计后auditedUnits及原correctionId。gate在auditedUnits非null时才比较reportedUnits，不读取隐藏actualUnits、profile、未来价格或随机。
- activeRisk的sort对filter新数组执行，没有重排原投影；roomMoment没有apply/随机/存储写入。helper计算只作展示。
- 首单StartFirstOrder、SubmitDelivery、WorkQuarter仍由原CommandButton→App request→controller.prepare/preview→原confirm/submit执行；读原事项只navigate，不把打开资料冒充完成。
- 所有等待仍经原ClockAdvance/playableAdvanceDate，真实AdvanceTime继续处理原费用、日期和事件屏障；当前pause或requiresDelivery禁止该等待，未加自动提交或额外授权。
- App onSubmission仅在saved时形成新receipt；unsaved/conflict清掉receipt并保留failedScene供原候选重试。CommandButton/ClockAdvance继续挡readOnly/candidate/busy/不可用预览。此次源码没有绕原子保存或重抽候选结果。
- 全局SceneAttention、缺口/到期/强制信号、桌上责任、人物/年度/篇章和原册入口保留；没有删除到期义务或以普通显示预算吞掉mandatory。

## 新用例的证据身份

RoomMoment.test.tsx新增knownSignalRaw实际原档导入，检查公开active风险可成为房间当前事项；另用有界公开display projection将已解决历史与既有relay投影组合检查排序，注释明确不保存、不称为同一完整正常campaign。真实r105原档作为0AP未结relay输入继续保留。两份原raw按原路径读取，未在测试里重写；本审查未运行它们，不能据此宣称通过。

## 持续保留的范围

研究来自公开一手文字/官方资料，不是实机竞品试玩；真人理解度/趣味性仍0。当前美术与交互为源码和主控实际当前窗口分层验收，完整后期核心288/关键62/例行22与5c-P1矩阵仍暂停而非完成或cancel。兼容开发/测试为0，M01继续暂停；原PNG缺口保留。不将这个delta报告外推为整体验收。

## 源码读取快照

```json
[
  {
    "path": "AGENTS.md",
    "bytes": 11631,
    "sha256": "da5d889fbcdece202ad83dc4a4f50a0b470cc9a5bae7a84941684ed661bff9f4"
  },
  {
    "path": "src/ui/RoomMoment.tsx",
    "bytes": 12580,
    "sha256": "77760fa95590de680aadc3bcb24d7db76427fc39fc40ec9239d6fe014954a414"
  },
  {
    "path": "src/ui/RoomMoment.test.tsx",
    "bytes": 8716,
    "sha256": "4f996c3f378ea25c351c97a197767fe2be31c6e6176a828c1e7c1ca74a95c725"
  },
  {
    "path": "src/ui/CinematicRoom.tsx",
    "bytes": 11826,
    "sha256": "bbace9b6025078a3c3eda651c26237fece5353037ce93f0f18e14ac084ceaec7"
  },
  {
    "path": "src/ui/App.tsx",
    "bytes": 28364,
    "sha256": "f1e35804b73813b46fdc7e7253d0bd42894f665a1a36f56e708dc430bef58c77"
  },
  {
    "path": "src/ui/SceneEcho.tsx",
    "bytes": 3295,
    "sha256": "58a439cbf7f540dfc62d21de638149608394938c32bcecf68b530b4f1c27dd7c"
  },
  {
    "path": "src/ui/SceneJournal.tsx",
    "bytes": 5249,
    "sha256": "55b05e8aee90cdb08fa167cb8a37a48ab989fe246882742b5e32609a5e34d5b7"
  },
  {
    "path": "src/ui/NarrativeScene.tsx",
    "bytes": 31363,
    "sha256": "886fc10827497ed7e16fc7b08be98de7bfd0c704d16b0a7548398fbfd0a37ac8"
  },
  {
    "path": "src/ui/game-clarity.css",
    "bytes": 6671,
    "sha256": "bcfdc2ac679a23104944236fd6815696d5c9f4999b924f393ef68a245b46424d"
  },
  {
    "path": "src/ui/CommandButton.tsx",
    "bytes": 1313,
    "sha256": "17fa2e2799afb252392afb2fa10e3253023c1b5f2a5f77e079c3ea783eeebf43"
  },
  {
    "path": "src/ui/ClockAdvance.tsx",
    "bytes": 2924,
    "sha256": "3d09eb81498ec71ef668ae5a2dcf08c4936bb1c891f84e18256423f708bc490e"
  },
  {
    "path": "src/application/playable-advance.ts",
    "bytes": 862,
    "sha256": "c703a8eab70aabd3a1cf3f0a4a0f0b25b9c253a0afca8dd4a192d29a0900c9a0"
  },
  {
    "path": "src/ui/story-scene-progress.ts",
    "bytes": 7526,
    "sha256": "258aae290532959c6b6cb270dcafc24a1c7d5fdbe7c378c35a4f9ac876e20a36"
  },
  {
    "path": "src/ui/video-scene-progress.ts",
    "bytes": 7763,
    "sha256": "9ea48d9b924c2c7eca8453086d60f490aa258be309bb844c33b92a83cc1c187f"
  },
  {
    "path": "src/ui/course-scene-progress.ts",
    "bytes": 13060,
    "sha256": "78af8caf330148f483b627fc5932ed54550527ac82bb2da49068ceaf758f4cc9"
  },
  {
    "path": "src/ui/relay-scene-progress.ts",
    "bytes": 18713,
    "sha256": "9f958d7f989e6a4d4cd488f06a7b3fdcb402bde5310b91fe042ba2857a4128cb"
  },
  {
    "path": "src/ui/SceneEcho.test.tsx",
    "bytes": 4295,
    "sha256": "5f2e6cf7d9713c05346de2f5b4aad1eac28f75fec1f6d893f665c1263647bf26"
  }
]
```
