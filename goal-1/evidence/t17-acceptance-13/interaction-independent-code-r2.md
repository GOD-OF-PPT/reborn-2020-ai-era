# D08 交互重构独立源码复核 r2

2026-10-21，主控所称r8当前源码快照的只读复核。仅新建本报告；未改源码/输入/计划，未运行测试或浏览器，兼容开发测试0。主控正在运行的定向检查未被本审查读取为通过，不能预判其结果。

## r1事项已由当前源码修复

- 非AdvanceTime的room成功回响仅由App原有条件渲染；CinematicRoom已移除SceneEcho导入/回响Props/第二个渲染者。
- CinematicRoom数字快捷键入口已过滤event.isComposing，保持原sceneShortcut对输入框、modal、修饰键的保护；最终仍点击原按钮。
- 未就业时planned/running/waiting也提供原WorkQuarter旁路，且明确“可以和小单一起安排”；新增真实StartFirstOrder→WorkQuarter反向组合单测，检查原available1/reserved1。此处只审源码，不声称测试已运行通过。

## 新发现

### [P1] story进度不实现choice接口，房间fallback直接读取将抛错

RoomMoment的pending数组同时包含storySceneProgress和video/course/relay进度，随后统一使用pending.value.choice.line。StorySceneProgress接口只提供incident/title/line/phase/completeAt/deadlineWarning，没有choice；其所有返回值也没有choice。因此任何story非null并被选中的房间会在访问undefined.line时抛错，而严格TS同样应指出choice不存在。需要把story转换成房间所需的公开detail（例如deadlineWarning或已公开日期说明），其他三路才读取choice.line。结论为静态接口与返回值的直接对照，不冒充Chrome复现。

### [P2] 已解决的历史风险抢占实际未结责任，并被误称为继续中的承诺

storySceneProgress/selectIncident在active为空时仍返回最近历史incident；该函数为风险专页保留历史选择的原用途正确。RoomMoment却把它放在pending.find的第一项，没有排除resolvedAt非null或stage normal。故一旦本局存在任何已解决历史风险，即使video/course/relay有当前未结事项且没有sceneWorks中的活动job，房间将一直选历史story并配“原来的承诺，还在继续”。这会重新模糊完成与未完成、挡住更相关的当前抉择。建议仅在房间筛选公开active风险，风险专页继续保留全历史；再区分视频paid回顾、已收尾课程、relay closed/records等纯历史与实际未结责任，避免纯历史优先。不要删除历史或强制义务。

## 其余关键核对

- 无中转业务时现在明确businesses.length gate，不会由relay opening fallback无故把新玩家带入API开站。
- sceneWorks当前承诺在首单paid回执之前；首单paid也已变为待选备用，不再先于当前工作。
- 新RoomMoment已移出通用ScreenBook，当前说明、已知成本、AP筹码与真实选择由同一个场景直接承载；完整原日历仍为compact按钮打开Dialog。不会再因通用书页先见介绍后翻页找主操作。实景尺寸/阅读顺序需主控当前窗口证据，不由CSS静态推理证明。
- 首单planned/running/delivery/waiting/paid保留不同公开状态，报价、已付、实际回款分别取相应字段；没有新奖励/随机/授权。
- 原CommandButton/ClockAdvance/request guard继续拥有实际命令。RoomMoment只从已提交view.features作只读选择，不调用随机、核心apply或未保存候选；App onSubmission仅saved更新receipt，unsaved/conflict清空receipt，候选时原命令禁用。
- 真正决定、资料翻阅与时间推进有不同语法；所有五路线由原routes入口可达，完整人物、篇章、年度、随身日历、桌上责任和全局SceneAttention保留。未查到本改动删除原价格/客户/权限/到期义务/强制风险。
- 光色用于主抉择、四份时间和状态，不只是背景换图；保留纯文本/减少动效。

## 未证明与保留范围

源码报告不证明真人理解度、趣味性、完整后期业务、实际失败重试视觉或一屏全部状态。研究仍为公开一手材料，真人0；核心288/关键62/例行22与P1矩阵仍暂停而非完成/取消。原PNG缺口与M01兼容暂停继续。

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
    "bytes": 11322,
    "sha256": "c20c85d055b95d21e0a400aa66191e76c7f4452cb8eaf485ebfad2ef9d6d55fb"
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
    "path": "src/ui/RoomMoment.test.tsx",
    "bytes": 7068,
    "sha256": "483533e4eb0eb2666b9761766e8ffd647023f7254cf6e78e5d587954bfa128cf"
  },
  {
    "path": "src/ui/SceneEcho.test.tsx",
    "bytes": 4295,
    "sha256": "5f2e6cf7d9713c05346de2f5b4aad1eac28f75fec1f6d893f665c1263647bf26"
  }
]
```
