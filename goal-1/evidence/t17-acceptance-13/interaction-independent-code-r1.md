# D08 交互重构独立源码复核 r1

只读独立审查，2026-10-21。核对用户“交互不清晰、像软件任务”的原话、AGENTS新增12条及下列实际源码。未改源码/计划/输入，未运行测试或浏览器，兼容开发与测试0；不把代码推理当作浏览器结果、真人理解度或趣味性验收。

## 确定需修复

### [P1] 房间成功回响被渲染两次

审查快照中，App.tsx:91在room且非AdvanceTime且没有modal时渲染SceneEcho；App.tsx:92又把同一个当前receipt传给CinematicRoom，后者:74无modal条件再次渲染SceneEcho。StartFirstOrder、WorkQuarter或SubmitDelivery等原保存成功后两个条件同时成立，会挂载两个相同open dialog。即使共同关闭回调最后会清空receipt，同一成功结果的重复modal也会破坏焦点/阅读顺序，且违反单个抉择、单次回响。保留唯一回响拥有者，并覆盖同次实际承诺只有一个成功回响的集成路径。该结论是可直接由两个同时为真的渲染条件证明的静态缺陷，不宣称已浏览器复现。

### [P2] 数字快捷键没有屏蔽输入法组合事件

CinematicRoom.tsx:39只过滤defaultPrevented/repeat/main范围，未过滤event.isComposing。新分支把数字键从旧版导航提升为点击RoomMoment主操作；在waiting阶段该主操作是ClockAdvance，已公开核对投影存在时confirm=false，因此组合态数字事件存在直接推进时间的路径。应与ClockAdvance和NarrativeScene相同，在快捷键入口先拒绝isComposing；不能仅依靠输入框匹配，因为组合目标也可能是main/按钮。未运行键盘实测。

## 交互清晰度补强（不是底层互斥错误）

RoomMoment.tsx:42只在offer且未工作时显示直接WorkQuarter。玩家若先接单，进入planned后主界面仅有等待、生活、探索；直接工作选项消失，现有测试只覆盖WorkQuarter→StartFirstOrder。原册仍有工作，故不能声称规则互斥或内容丢失；但第一层可能继续暗示两项二选一，与AGENTS第4条的意图不够一致。建议首季的planned/running等阶段也保留未工作的直接旁路，或明确提示工作与小单可一起安排；使用真实反向StartFirstOrder→WorkQuarter组合验证，不做伪造数据。

## 已有的实质改进及保护

- 房间初始不再同时铺4热点、4念头、旧胶片和通用主CTA；RoomMoment按公开首单状态给原StartFirstOrder/SubmitDelivery，减少“进页面→找分区→打开操作”的跳转。探索作为不同模式保留。
- 首单将planned/running/awaiting_submission/review/delivered/payment分开，已知费用、AP、日期显示在抉择旁；未凭计划显示已交付或已收款。报价使用terms，已付使用result，收益没有按钮加钱。
- 所有真正行动仍经CommandButton原preview/request/journeyIntent/readonly/candidate guard；等待经原ClockAdvance和playableAdvanceDate，不绕开预算、日期、原子保存或中间事件。
- SceneTimeNotice现在默认显示原savedSceneResult的完整text，完整事实仍由可选回响打开；原文本经过React文本输出，未引入innerHTML。
- sceneWorks、随身原日历、人物/年度/篇章及桌上责任保留；全局SceneAttention仍由App挂载，已到期/缺口/强制事件仍不被普通显示预算吞掉。未宣称后期所有路已经实际重验。
- NarrativeScene的资料与真正决定有不同文案/data-interaction/边线提示；TA采用既有原创A背景，有限AP筹码、阶段和局部聚焦有信息功能；不是单纯壁纸或换色。
- 新CSS未新增媒体查询/多尺寸策略，原减少动效与纯文本设置被继续引用；这里仅为源码事实，没有执行兼容专项。

## 当前未证明范围

当前源码复核不能证明一屏实景阅读顺序、原子失败重试后的实际视觉、浏览器数字键、反向工作+首单、真人易懂或有趣；由主控后续有界实测承担。P1中转矩阵仍暂停而非cancel，核心288/关键62/例行22、真人0及原始PNG缺口继续保留。

## 审查读取快照

```json
[
  {
    "path": "AGENTS.md",
    "bytes": 11631,
    "sha256": "da5d889fbcdece202ad83dc4a4f50a0b470cc9a5bae7a84941684ed661bff9f4"
  },
  {
    "path": "src/ui/RoomMoment.tsx",
    "bytes": 9865,
    "sha256": "c95fa2dc34f268082d547fb25630c61d18174866f148fe78de953e51e8c81c79"
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
    "bytes": 5624,
    "sha256": "b7b853fbffdc9444a5a9b9fc9f79c0d9de3aa74beaededaca3e29d968bfab648"
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
    "path": "src/application/workbench-projection.ts",
    "bytes": 11014,
    "sha256": "6a625630ed2a632caa4d56984fa7d7286307829e804654751830a72d82d0ae94"
  },
  {
    "path": "src/core/first-order.ts",
    "bytes": 6994,
    "sha256": "66e6b4eb2d6008eb1f04230cc63cf1a67637bc96582c331bac37e5ea9c9d7215"
  },
  {
    "path": "src/ui/RoomMoment.test.tsx",
    "bytes": 4273,
    "sha256": "71d7dfa9855f85cb261662ffc08803af6e2f1dee8071726a36779743306a99fa"
  },
  {
    "path": "src/ui/SceneEcho.test.tsx",
    "bytes": 4295,
    "sha256": "5f2e6cf7d9713c05346de2f5b4aad1eac28f75fec1f6d893f665c1263647bf26"
  }
]
```
