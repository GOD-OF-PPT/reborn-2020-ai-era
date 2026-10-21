# D09 生活集成只读复核 r2

本轮仅源码读取与本新报告写入；没有修改src/plan/登记/runner，没有执行测试、类型/静态检查、浏览器或兼容操作。原r1与LI-01修复记录保留。全局R2 typecheck原complete实际state=terminal、wrapper=0、driver=0、冻结417项；这是主流程已执行的证据读回，不是本轮重复执行。本轮不接管/重启父代理R3执行。

## LI-01：原工作导航目标，源码复核通过

sceneWorks返回显式SceneWork[]；lifeWorkTarget读取原job.accountId/personId/kind，人物带personId/person模式、个人rest/workspace不伪造人物。原operations job带对应business.accountId。SceneJournal当前胶片与完整日历具体链接都传workTarget；CinematicRoom running生活卡片也传同lifeWorkTarget。父App接收target.accountId/personId，先navigate，再以target.lifeSelection明确覆盖默认模式，目标不会被默认person重新盖掉。RoomMoment的具体生活inspect也明确person/rest/workspace。泛生活自由入口仍可选择默认person。实际click与原账户/对象尚须主流程Chrome核验。

## LI-02：跨叙事页的旧模式残留，主体修复正确，但发现同屏原册剩余问题

App现在拥有lifeSceneMode，传入NarrativeScene的lifeMode/onLifeMode。NarrativeScene本地mode仅为未受控调用的后备，真实App不再依赖它。navigate('life')明确设person；room具体target随后覆盖。onPeople/onPerson、SceneThreads经navigate、QuarterPanel生活/人物入口也明确person。这修复了“rest/workspace→另一叙事屏→具体人物重进”的旧模式残留，包括人物ID值相同的重进。

### LI-04 / P2 / 尚需修复：只展开当前个人原册也会切换模式

NarrativeScene footer“细看这一幕安排”调用p.onOpen()。当当前screen=life且mode=rest/workspace时，App onOpen只为DeepSeek转交额外target，然后navigate(destination,true)无条件把lifeSceneMode改person。玩家仅查看当前这幕的原册，关闭后却返回唐萤/上次人物，个人模式丢失。此路径也改变lifeSelection/bookContext，不能称作仅清理receipt的稳定上下文。

建议：同屏展开原册显式传当前lifeSelection，或onOpen保存当前lifeSceneMode并在navigate默认之后覆盖；从其他屏进入life仍可默认person。已先消息告知父代理；当前冻结运行须按原handle结束后再修，不应中途改源。本轮没有改源或运行重现。

## LI-03：数键唯一主按钮与可见编号，源码复核通过

NarrativeScene现在按.scene-choices顶层.scene-choice/.scene-action/.scene-wait-decision计数；每个Wait只选.clock-main>button，原.clock-review不占念头序号。Action只选自身直接button，查看/准备Choice本身即button。CourseStageChoice/RelayAuditChoice/RiskInvestigationChoice/MarketSceneChoice/LifeReferenceChoice都用React Fragment返回原顶层Choice；打开Dialog时原数键守卫先退出，不会把Dialog内部控件混入列表。

scene-encounters.css明确给Wait顶层counter-increment和自身before数字；旧scene-decisions.css只给.command/.scene-choice递增，因此Wait不重复计数。src/main.tsx先加载旧决策CSS、后加载encounters，Wait的01/后续02沿同一scene-thought计数器。ScreenBook仍从每项[data-book-chapter]提取选择，与当前三种顶层卡对应。

CinematicRoom默认数键选择限定.moment-decisions的明确button/command主按钮及.moment-wait .clock-main，不包含clock-review；环顾房间是既有明确旁路。探索模式继续按sceneShortcut导航，Space只走ClockAdvance真实main。两条数键路径都保留编辑、IME、modifier、repeat、Dialog与disabled/inert保护，未见副核对/材料select/原册按钮再次占用某个有不同可见编号的卡。以上为源码结论，不宣称实际键盘/焦点已验。

## 草稿、原命令与范围复核

D09 bookContext仍依run/revision/实际entity或selection，而不因receipt清空改变。材料选择器关闭/取消本身保留selected；确认后的实际revision变化、candidate/conflict会关闭原计划Dialog。所有执行仍沿CommandButton→request→原preview/捕获确认→submit，原personal主体/明确材料/费用/AP/日期不改。Dialog层级的真实焦点、当前画面、原候选失败/重试与全Create原文一致性由主流程完成，本轮不拿绿色typecheck替代。

## 当前只读源码身份

以下每项列出实际regular文件字节与SHA，以及是否匹配主流程R2 typecheck冻结。报告不是新全局freeze。

```json
{
  "src/ui/App.tsx": {
    "bytes": 29336,
    "sha256": "097f36dac8963654060d6dd61039d88b421fd2e10a2530695584cd8fed2ca13c",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/NarrativeScene.tsx": {
    "bytes": 37353,
    "sha256": "9f720e507b874128756ff9fa1b457e5e781615858d9a3ff8d9aa6427dd692cea",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/SceneJournal.tsx": {
    "bytes": 6511,
    "sha256": "f805730c0eecda8ebd1ea6547fe369bbfdfab357c2dfd17894adfc5990aa18ae",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/CinematicRoom.tsx": {
    "bytes": 11820,
    "sha256": "e1c9900e1fd0d5de20b98089e013041cf95bfe6b52fe6ee336dc5308da6803fa",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/RoomMoment.tsx": {
    "bytes": 16660,
    "sha256": "da2accb28d3be3fc5c561ab70cadbf0113120a66c5ec19f845678ea51567a412",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/game-types.ts": {
    "bytes": 2300,
    "sha256": "21f70e49e0ca9fbf441edf4295b7d2a81cd6c16bd235070ab6c9e631aa2687a3",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/LifeReferenceChoice.tsx": {
    "bytes": 2827,
    "sha256": "b0b3d73e7de42772a0686c48297933c947bfc1c8adcc20802b5c3f955254fe5c",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/LifePanel.tsx": {
    "bytes": 10620,
    "sha256": "a32128ede5c67de12760c27e904129b28ce3b35048d509750954804cafb0bc74",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/Dialog.tsx": {
    "bytes": 2456,
    "sha256": "c41652816ceeb77a98bf281ee3d5c8bfba243c531e1175fc82fe7f8fff3d8083",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/ClockAdvance.tsx": {
    "bytes": 2924,
    "sha256": "3d09eb81498ec71ef668ae5a2dcf08c4936bb1c891f84e18256423f708bc490e",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/ScreenBook.tsx": {
    "bytes": 9000,
    "sha256": "9ec810b63bc6d67831f145ea0b172ebc427d65ee90b629fc75d1da16d56a48f9",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/scene-encounters.css": {
    "bytes": 5938,
    "sha256": "a49e9916dc419565a3516efd4dd718610b41fa2caa8be26191012e539d442bec",
    "matchesTypecheckR2Freeze": false
  },
  "src/ui/scene-decisions.css": {
    "bytes": 10358,
    "sha256": "3772f90ee195d1753bb044a8cb78b2e0fd38e6f51a2a0423d966edb6eb05ca22",
    "matchesTypecheckR2Freeze": true
  },
  "src/main.tsx": {
    "bytes": 1049,
    "sha256": "331a6646e19a3ef5bd78a2ed6ebcfcafcbf9f65895ce999139ce818d7c8b58fc",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/scene-season.ts": {
    "bytes": 914,
    "sha256": "7da0ece3634d7414cccfbb899f786339c8b191c4554028ee78eab0d1f9b84588",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/CourseStageChoice.tsx": {
    "bytes": 3027,
    "sha256": "18128adf3ce6fb9baf74ad6a5a685ab70d956db7365ae8b4be4b4faa20a75117",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/RelaySceneChoice.tsx": {
    "bytes": 6766,
    "sha256": "0ccde60aefd407fdac545bafd71a66f3827aa73f0e14220dc7195ca43484d3bd",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/RiskSceneChoice.tsx": {
    "bytes": 5747,
    "sha256": "e9cfa9ad7f0b0a9801ba4ac98f225dc0290aed1d978faeaf9420c75d78ad47ec",
    "matchesTypecheckR2Freeze": true
  },
  "src/ui/MarketSceneChoice.tsx": {
    "bytes": 7850,
    "sha256": "dead126c13ef9316c7dc92184dd0237e7e1fa69e1d78addb5fc774486f1b6f08",
    "matchesTypecheckR2Freeze": true
  }
}
```

[杠精审查] LI-01和LI-03源码修复闭合，LI-02主导航所有权修复但其同屏原册路径仍有LI-04，未因typecheck绿就宣布生活交互全部通过。保持原验收与剩余责任；compatibilityDevelopmentTests=0。
