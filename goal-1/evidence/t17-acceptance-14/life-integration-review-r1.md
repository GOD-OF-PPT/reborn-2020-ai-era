# D09 生活集成只读审查 r1

本轮仅源码审查与本新报告写入，未改源码/测试，未执行测试、浏览器、几何/尺寸/缩放或兼容检查。root14 input/plan/tasks已全读。检查的是父代理集成的人物导航、原材料、等待、确认/失败与完整原册；life-scene-progress模块本身由本agent此前实施，其定向9测试是另一个证据层，不冒充本轮独立执行。完整Create、当前Chrome与全局冻结仍待主流程。

## 确定发现

### LI-01 / P2 / 尚需修复：具体生活工作的跳转丢失人物

CinematicRoom.tsx:80的每条running生活工作按钮只调用p.onNavigate('life')，没有传j.personId。SceneJournal.tsx的sceneWorks生活条目也只存screen:'life'，走近/查看原工作入口没有人物目标。已存在陈屿/许澄/林舟实际工作时，点击该明确工作会使用App上次lifePerson（初始唐萤），与D09 RoomMoment已经正确附personId的路径不一致。个人rest/workspace也缺精确模式目标。

建议：具体原工作条目保留原personId；个人工作可带明确lifeSelection，或明确打开完整原生活记录。自由探索“生活”入口仍可不附对象。验收须从曾选唐萤的状态进入另一人物的具体原工作，确认场景/确认主体仍是原对象；不能只核roomMoment返回对象。

### LI-02 / P2 / 尚需修复：叙事页之间复用组件会保留旧个人模式

NarrativeScene.tsx:118的lifeMode由本地useState保存，lifeSelection在:128优先用rest/workspace。App的room/routes之外各屏复用同一个NarrativeScene类型。因此先在生活选rest/workspace，转去market/quarter，再由SceneThreads具体陈屿承诺入口进入life；App设置lifePerson=陈屿并打开人物原册，但关闭原册后，原组件lifeMode仍为rest/workspace，主场景显示错误对象。只监听personId变化不足：具体重进也可能仍是同一人物值。

建议：显式导航目标携带lifeSelection/人物或明确导航epoch，由App与NarrativeScene共享本次选择；实际对象切换可改变上下文，关闭确认/清理receipt不应重置草稿。验收需同时覆盖不同人物、同一人物重入、rest/workspace原工作与取消确认草稿。

### LI-03 / P1 / 发现后父代理已修改源码，当前仅只读复核：念头数键曾命中副核对按钮

发现时chooseWithNumber遍历.scene-choices全部后代button，新WaitChoice里的ClockAdvance有“先核对”和主推进两个按钮，却只是一项[data-book-chapter]。生活running第二念头“中断”、市场pending第二念头“撤单”会按2命中推进，可能真实经过费用/期限。已先消息报告。末次源码读回，父代理已改为按顶层.scene-choice/.scene-action/.scene-wait-decision计数，等待项仅选.clock-main>button，排除副核对。当前修正方向正确，本轮未执行任何键盘或浏览器，仍须主流程定向验证。

## 已核对的正确连接与边界

- 人物/个人模式显式可选。life-scene-progress的原command进入CommandButton/request/原preview和确认，不新增免费AP/钱或人物同意。offered接受和明确婉拒分开；running等原完成日与中断分开；失约/对方撤回仍有原状态。
- LifeReferenceChoice不默选材料；选择值由kind:id映射回当前person.references原对象，确认前展示原日期、类型、完整ID。完整LifePanel也已移除references[0]默认，原条件不足仍由原preview拦截。
- 材料Dialog的selected state在关闭/重新打开时保留。原确认弹窗叠在其上，取消不改revision/source；新D09 bookContext不再依receipt字符串，因此request清空receipt不会卸载选择器。原ScreenBook翻页保持children挂载。实际新revision或run/entity/source变化允许旧上下文失效。
- 材料Dialog在candidate/conflict或实际新已保存revision时关闭。CommandButton继续禁用busy/candidate/readOnly/conflict；新life选择与只读资料浏览不直接调用submit。
- 默认住处保留pause、公开active risk与requiresDelivery优先分支；life.queued未安排承诺复制按deadline/id排序，offered未当作强制焦点。全部持续牵挂/桌上责任与原册仍在。
- NarrativeScene的life waitAt先核canAdvance，再以playableAdvanceDate裁到原季度/生活/交付屏障；若停在早于所选对象日期，使用“先走到原日历的这一处”。ClockAdvance沿原AdvanceTime，候选/只读仍禁用。
- RoomMoment已经给它自己的生活inspect附personId；App/CinematicRoom的NavigateScene透传正确，缺口是LI-01的其他具体条目和LI-02的mode所有权。
- 生活确认主体由intentAccount固定personal，LifeCommandDetails使用捕获的原promise/job/reference与preview费用/AP；选择企业账户不能代付。App从当前controller context prepare命令，原actor/revision/幂等链保持。
- Dialog沿原native modal、Esc stopPropagation、Tab trap与portal stage。当前源码未见新增绕过disabled或直接写余额/日期/权限路径；实际多Dialog焦点仍需当前Chrome验证，代码审查不能证明运行体验。
- 完整人物原册、材料、公开日程、旧承诺、全部工作/中断和年度回顾仍可通过LifePanel三层页签到达；默认场景未替代或删除原内容。

## 后续定向验证

在修LI-01/02后，以真实不同人物/个人工作检查上下文；数键1/2应分别对应等待/中断或撤单；材料选择→原确认→取消仍保留同一材料和页码；candidate失败保留旧人物/旧完成状态，原候选重试后才有新回响；只读不提交。上述均为当前功能验证，不是尺寸/缩放/跨浏览器/原生离页兼容。

## 本报告末次读回源码身份

报告不是全局冻结，父代理仍在实施。以下为写本报告时实际读取的regular源码字节SHA；若之后修复，需新报告/新验证身份，不能覆盖本文件。

```json
{
  "src/ui/NarrativeScene.tsx": {
    "bytes": 36775,
    "sha256": "93f7cbb5a3ba2a833c8650f25c1ebf32a92785ef481c4cdfe5008db9df28fad9"
  },
  "src/ui/LifeReferenceChoice.tsx": {
    "bytes": 2827,
    "sha256": "b0b3d73e7de42772a0686c48297933c947bfc1c8adcc20802b5c3f955254fe5c"
  },
  "src/ui/LifePanel.tsx": {
    "bytes": 10620,
    "sha256": "a32128ede5c67de12760c27e904129b28ce3b35048d509750954804cafb0bc74"
  },
  "src/ui/RoomMoment.tsx": {
    "bytes": 16051,
    "sha256": "bb00c3e793907b091e169895eeea4185a8c0ec8e3f0a5ee0108a001666df999b"
  },
  "src/ui/CinematicRoom.tsx": {
    "bytes": 11787,
    "sha256": "4c0e56c92dce4d6df128860441cd2d3d5340a565d134961f0a0f2c3d7a2a01c3"
  },
  "src/ui/App.tsx": {
    "bytes": 28494,
    "sha256": "34a47fc8a6fc6820acb206565415fea98fc27519a3369d94327f3c002158af04"
  },
  "src/ui/game-types.ts": {
    "bytes": 2124,
    "sha256": "a3d92d5284c0d888c810e458c3206cb77597b8e9182b4b8eb649dd6c339f294c"
  },
  "src/ui/SceneJournal.tsx": {
    "bytes": 5249,
    "sha256": "55b05e8aee90cdb08fa167cb8a37a48ab989fe246882742b5e32609a5e34d5b7"
  },
  "src/ui/ScreenBook.tsx": {
    "bytes": 9000,
    "sha256": "9ec810b63bc6d67831f145ea0b172ebc427d65ee90b629fc75d1da16d56a48f9"
  },
  "src/ui/Dialog.tsx": {
    "bytes": 2456,
    "sha256": "c41652816ceeb77a98bf281ee3d5c8bfba243c531e1175fc82fe7f8fff3d8083"
  },
  "src/ui/CommandButton.tsx": {
    "bytes": 1313,
    "sha256": "17fa2e2799afb252392afb2fa10e3253023c1b5f2a5f77e079c3ea783eeebf43"
  },
  "src/ui/ClockAdvance.tsx": {
    "bytes": 2924,
    "sha256": "3d09eb81498ec71ef668ae5a2dcf08c4936bb1c891f84e18256423f708bc490e"
  },
  "src/ui/intent-account.ts": {
    "bytes": 4889,
    "sha256": "081bfe122fad84023b134d55f34a0dc2b91d78803098ba80a73734b9457a1fe0"
  },
  "src/ui/LifeCommandDetails.tsx": {
    "bytes": 3625,
    "sha256": "56eab299b9a155ab0a4834aa9ad1f9d61990ab6a04bf74b6d078ff314d16baac"
  }
}
```

[杠精审查] 未把新功能入口存在当作完整交互通过；发现的对象导航和数键语义问题已先报告。两个开放问题不因无金额越界而免修；真实Chrome/原子失败/完整Create尚未由本轮执行。compatibilityDevelopmentTests=0。
