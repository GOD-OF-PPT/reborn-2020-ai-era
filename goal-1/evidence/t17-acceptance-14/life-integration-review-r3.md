# D09 LI-04与未上市报价提示只读复核 r3

收到父代理明确“两项源码已修复”后开始本轮只读复核。仅写本新报告，没有改src、测试、配置、计划、登记或runner；没有运行测试/类型/静态检查或浏览器，compatibilityDevelopmentTests=0。原r1/r2审查和review-source-r3两份修改前源码保留。旧R3 current-scenes的7文件61/61属于旧源，不据此宣称本轮新源已经通过。

## LI-04：当前个人原册展开后模式回退，源码已闭合

App openWorkspace在调用navigate之前捕获target.lifeSelection，未显式传时：同screen保留当前lifeSceneMode，跨screen默认person。随后navigate(screen,true)，再在life分支明确恢复捕获mode，并将person模式原册定位people，rest/workspace原册定位today。NarrativeScene唯一onOpen已接openWorkspace。

因此生活rest/workspace footer“细看这一幕安排”不再因原navigate默认person而改变实际lifeSelection；关闭原册只切workspaceOpen，不另改模式。人物模式同幕原册保留原lifePerson并进入人物页；跨屏进入生活仍沿明确person默认。DeepSeek原显式pane/record目标由该统一入口保留，未扩任何命令权限。

其余life导航不变量仍在：具体SceneJournal/CinematicRoom原工作传accountId/personId及个人模式；RoomMoment生活inspect和sceneWorks兜底都透传target；App room目标先navigate后覆盖target.lifeSelection；onPeople/onPerson、SceneThreads和QuarterPanel明确人物模式。NarrativeScene由App受控lifeMode/onLifeMode，未退回仅本地useState。

## 未上市/null报价提示：源码修复符合原数据语义

MarketSceneChoice仅在stock.status=open且stock.priceFen非null时展示当前报价及原上下限。“本段没有固定限价边界”因此不再由未上市/未知报价的两个null限价误触发。not_listed明确说明尚未上市；停牌与其他无公开报价另有当前不可提交说明，不把未知报价填成0或未来价格。

stockUnavailable同时检查缺标的、本局资格、状态非open、priceFen=null、原rule未知，并进入原locked条件。即使玩家把草稿填成可解析payload，这些状态也不渲染PlaceStockOrder/PlanStockOrder命令按钮，只能保留/修改草稿。已开放且价格已知时，仍须明确账户、标的、方向、股数、限价、原到期点与当前quoteId；实际资金/交易单位/费用/撮合仍由原CommandButton/preview/确认裁定。

原quoteChanged提示及明确重核入口、返回步骤/关窗后草稿、candidate/conflict/实际revision关闭行为、readOnly/busy/date边界均保留，没有自动购入/成交、资金改写或资格扩张。此为源码分支检查，不替代当前Chrome的未上市→返回→选择合法标的→原确认体验。

## 先前LI-01—03与草稿复核

LI-01具体工作目标与LI-02跨页受控模式仍闭合。LI-03数键仍按顶层scene-choice/scene-action/scene-wait-decision定位唯一主button，Wait取clock-main，原副核对不占编号；CSS Wait单独递增同一scene-thought，不双计数。原Dialog/编辑/IME/disabled守卫未减。

D09 bookContext继续使用run/revision/实际对象或selection，不因request清理receipt卸载材料草稿。同幕openWorkspace保留模式后也避免了此次发现的伪source切换。原材料选择明确kind:id并回取当前原reference，接受/付费兑现/等待/已完成仍分离；完整人物、个人生活、公开日程、原账与年度页未删除。

本轮未发现该两项修复新增的确定缺陷。实际多Dialog焦点、取消/草稿、只读/事务失败原候选、原日序结果和完整Create重放仍由父代理新的统一验证承担。不能把本报告或旧61绿结果当新源全局验收。

## 本次只读身份

```json
{
  "src/ui/App.tsx": {
    "bytes": 29688,
    "sha256": "4ddd19923097fc00630625a92e96f7d0c55042bbe4e29a4a218936ff72215ccc"
  },
  "src/ui/NarrativeScene.tsx": {
    "bytes": 37353,
    "sha256": "9f720e507b874128756ff9fa1b457e5e781615858d9a3ff8d9aa6427dd692cea"
  },
  "src/ui/MarketSceneChoice.tsx": {
    "bytes": 8450,
    "sha256": "0bd4ee9c5139ad1741c15fae57941a8e2b437663007d1d7b66fa53cc09f4f834"
  },
  "src/ui/game-types.ts": {
    "bytes": 2300,
    "sha256": "21f70e49e0ca9fbf441edf4295b7d2a81cd6c16bd235070ab6c9e631aa2687a3"
  },
  "src/ui/SceneJournal.tsx": {
    "bytes": 6511,
    "sha256": "f805730c0eecda8ebd1ea6547fe369bbfdfab357c2dfd17894adfc5990aa18ae"
  },
  "src/ui/CinematicRoom.tsx": {
    "bytes": 11820,
    "sha256": "e1c9900e1fd0d5de20b98089e013041cf95bfe6b52fe6ee336dc5308da6803fa"
  },
  "src/ui/RoomMoment.tsx": {
    "bytes": 16660,
    "sha256": "da2accb28d3be3fc5c561ab70cadbf0113120a66c5ec19f845678ea51567a412"
  },
  "src/ui/LifeReferenceChoice.tsx": {
    "bytes": 2827,
    "sha256": "b0b3d73e7de42772a0686c48297933c947bfc1c8adcc20802b5c3f955254fe5c"
  },
  "src/ui/LifePanel.tsx": {
    "bytes": 10620,
    "sha256": "a32128ede5c67de12760c27e904129b28ce3b35048d509750954804cafb0bc74"
  },
  "src/ui/ClockAdvance.tsx": {
    "bytes": 2924,
    "sha256": "3d09eb81498ec71ef668ae5a2dcf08c4936bb1c891f84e18256423f708bc490e"
  },
  "src/ui/CommandButton.tsx": {
    "bytes": 1313,
    "sha256": "17fa2e2799afb252392afb2fa10e3253023c1b5f2a5f77e079c3ea783eeebf43"
  },
  "src/ui/scene-encounters.css": {
    "bytes": 5938,
    "sha256": "a49e9916dc419565a3516efd4dd718610b41fa2caa8be26191012e539d442bec"
  },
  "src/ui/scene-decisions.css": {
    "bytes": 10358,
    "sha256": "3772f90ee195d1753bb044a8cb78b2e0fd38e6f51a2a0423d966edb6eb05ca22"
  },
  "goal-1/evidence/t17-acceptance-14/review-source-r3/App.tsx": {
    "bytes": 29336,
    "sha256": "097f36dac8963654060d6dd61039d88b421fd2e10a2530695584cd8fed2ca13c"
  },
  "goal-1/evidence/t17-acceptance-14/review-source-r3/MarketSceneChoice.tsx": {
    "bytes": 7850,
    "sha256": "dead126c13ef9316c7dc92184dd0237e7e1fa69e1d78addb5fc774486f1b6f08"
  }
}
```

[杠精审查] 把同screen展开与跨screen导航分别追到最终setState顺序，并追到原册pane/关闭回场景，而不是只看新增函数名；未上市分支同时核提示与实际命令按钮门槛，未把null当无限制。本轮源码问题闭合，运行验收与整项目责任保持待验证。
