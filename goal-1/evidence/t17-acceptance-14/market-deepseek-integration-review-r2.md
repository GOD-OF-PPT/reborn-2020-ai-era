# D09 市场/DeepSeek统一接线独立复核 r2

2026-10-21。父已全局freeze，本次只读当前源码，不改任何src/计划/登记/runner，不运行测试、静态检查命令、构建或浏览器，也不读取/预判正在运行的current-scenes终态。只新增本报告。原r1报告保留，包括其已明确撤回的market submittedAt null误诊。兼容开发测试0。

## r1三项修复的源码链已成立

### 1. 一张顶层决策卡只对应一个数字主按钮

chooseWithNumber现在选择.scene-choices直接子层.scene-choice/.scene-action/.scene-wait-decision，再从等待卡只选.clock-main>button，普通Command卡选直接button，资料卡本身是button。“先核对”不再另算一个决策。WaitChoice仍只有一份data-book-chapter；scene-encounters.css另外为Wait卡自增一次scene-thought并显示编号，与原Choice/Action一样一张卡一次。

所以源码上等待/撤余量/原册的1/2/3对应关系已修正；保留原editable/modal/isComposing/repeat/modifier/inert/disabled保护，并只点原按钮，不直接造核心命令。它还未由本审查实测按键或焦点，不能把源码修正写成Chrome通过。

### 2. 当前生态/架空来源经App传到原pane和record锚点

NarrativeScene.openDeepseek根据deepseekProgress.source选择ecosystem或equity；仅active且有真实entity时传recordId（business用既有prepare组映射），未渲染的旧history不承诺精确直达。App.onOpen将该明确target存入deepseekTarget后打开原workspace，DeepseekPanel接initialPane/initialFocusId并把focus继续传EquityPanel；runId变更时App重置target。

原DeepseekPanel默认仍ecosystem，具体目标则按指定pane初始化；真实记录节点的id与编码href连接原ScreenBook.followAnchor，用它展开祖先details/翻页。lazy目标尚不存在时preventDefault，避免原生hash滚动。指定关系/资格prep的business只是可读准备主体初选，不是付款或授权；原资源/日期等草稿不变。没有修改ScreenBook或新增滚动/几何定位实现。

这解决r1“架空主事项先落生态服务”的源码接线问题，真实lazy加载/锚点与当前窗口页序仍由主控后续Chrome证明。通用原册入口仍存在；不是所有历史ID都有本轮新独立节点。

### 3. DS原收款主体已在第一层明确显示

DeepseekRecordSwitch根据entity.accountId显示原个人或原生态企业主体；RoomMoment的两条DS直办/当前分支也将ecoOwner加入detail。没有把顶部当前查看账户写进收款payload。原SubmitEcoDelivery/CollectEcoReceivable/CollectEquityExit继续按原contract/delivery/exit ID归属执行。

主体展示不等于新付款确认，也没有把已签协议主体改成全局账户；r1指出的第一层主体缺失在源码上已补。实际多账户画面和原钱流仍需对应原生样本证明。

## 市场草稿与等待的最终核对

- MarketSceneChoice仍key=runId，初始账户/标的/方向/数量/限价/期限不默认填值；marketDraftPayload核当前公开quoteId、受控账户、真实matchingCalendar ID，validUntil不是日期。
- 新terms显示lowerFen/upperFen来自当前公开stock投影，没有读取未来checkpoint价格或隐藏profile；原限价/佣金/股份/费用继续原preview。详见下方一个未知状态表述残项。
- 取消只关本地Dialog而不清draft/page；Narrative书页key由run/revision/entity决定，没有把普通receipt/取消操作作为新context使草稿重挂载。
- 真正saved且revision改变才走成功关闭；hasCandidate/conflict关闭本地选择让SafetyNotice接手，readonly/busy/原日期边界仍禁新提交。原request捕获当前revision和原确认，失败不产生新成功回响。这里只核调用关系，不声称已操作取消或事务失败。
- waitAt经原playableAdvanceDate/AdvanceTime，pause/requiredDelivery保留；主卡已有Wait时footer不再放第二个ClockAdvance。原额外费用、日序和原事件屏障没有被前台跳过。

## 新发现的限定清晰度残项

### [P2] 未上市/未知报价也被描述为本次可用的数值限价范围

MarketSceneChoice.tsx:38新terms段无条件显示stock.lowerFen/upperFen并称“本次原限价范围”，只在两者null时说无固定边界；没有先排除priceFen null或当前不可交易。合法正常初始SIM-EX01在2023前未上市（content/market.ts），MarketRuntime.initial仍先以initialPriceFen和原rule计算bounds，再把当前priceFen设null。因此选择该公开未上市卡进入terms时，会同时显示报价未知和看似本次可用的数值限价范围。

原核心/CommandButton仍正确以not_listed/DATA_UNAVAILABLE拒绝交易，故不是买卖绕过、错付或已证明的隐藏真相泄露；问题是把不可交易时的边界值称为当前可用报价依据。建议priceFen null/无当前有效交易前提时仅说明“当前数据或交易前提未具备，不能据此提交”，不要把bounds表述为本次可用范围；开放且已知报价仍显示原公开边界。没有修改冻结源，也没有用合成非法normal状态支撑此结论。

## 不外推的范围

本次未发现上述范围内其它可证明的命令、账户或保存guard绕路，但这不是全体组合完成声明。父实际type/UI/规则/构建、当前Chrome数键/取消/lazy/锚点、真实钱/日期/AP/原候选重试与完整Create审计各保留自己的证据身份。真人0、原PNG缺口、完整后期矩阵与5c-P1暂停、M01兼容暂停不变。

## 实际读取源码身份

```json
[
  {
    "path": "src/ui/NarrativeScene.tsx",
    "bytes": 37353,
    "sha256": "9f720e507b874128756ff9fa1b457e5e781615858d9a3ff8d9aa6427dd692cea"
  },
  {
    "path": "src/ui/MarketSceneChoice.tsx",
    "bytes": 7850,
    "sha256": "dead126c13ef9316c7dc92184dd0237e7e1fa69e1d78addb5fc774486f1b6f08"
  },
  {
    "path": "src/ui/market-scene-progress.ts",
    "bytes": 7058,
    "sha256": "71952aa6eaa965eb7d4a012f7d9b00ccac3acfcf6e013337d5be1436f02f7598"
  },
  {
    "path": "src/ui/SceneRecordSwitch.tsx",
    "bytes": 2892,
    "sha256": "e498317ab83ce1cc89ce350be7d0394cc78dcd15b60e814c37b5c7dba8f3a96c"
  },
  {
    "path": "src/ui/RoomMoment.tsx",
    "bytes": 16660,
    "sha256": "da2accb28d3be3fc5c561ab70cadbf0113120a66c5ec19f845678ea51567a412"
  },
  {
    "path": "src/ui/CinematicRoom.tsx",
    "bytes": 11820,
    "sha256": "e1c9900e1fd0d5de20b98089e013041cf95bfe6b52fe6ee336dc5308da6803fa"
  },
  {
    "path": "src/ui/App.tsx",
    "bytes": 29336,
    "sha256": "097f36dac8963654060d6dd61039d88b421fd2e10a2530695584cd8fed2ca13c"
  },
  {
    "path": "src/ui/game-types.ts",
    "bytes": 2300,
    "sha256": "21f70e49e0ca9fbf441edf4295b7d2a81cd6c16bd235070ab6c9e631aa2687a3"
  },
  {
    "path": "src/ui/DeepseekPanel.tsx",
    "bytes": 15776,
    "sha256": "71f9104daf6cafc9395cbd609650acd47bb0143387b70b580ffea12777f0d084"
  },
  {
    "path": "src/ui/EquityPanel.tsx",
    "bytes": 16954,
    "sha256": "f6391c18b25f511046f08dc1b8576ac4344cc1688d9f355956d64451ee07cff6"
  },
  {
    "path": "src/ui/ScreenBook.tsx",
    "bytes": 9000,
    "sha256": "9ec810b63bc6d67831f145ea0b172ebc427d65ee90b629fc75d1da16d56a48f9"
  },
  {
    "path": "src/ui/scene-encounters.css",
    "bytes": 5938,
    "sha256": "a49e9916dc419565a3516efd4dd718610b41fa2caa8be26191012e539d442bec"
  },
  {
    "path": "src/ui/ClockAdvance.tsx",
    "bytes": 2924,
    "sha256": "3d09eb81498ec71ef668ae5a2dcf08c4936bb1c891f84e18256423f708bc490e"
  },
  {
    "path": "src/ui/CommandButton.tsx",
    "bytes": 1313,
    "sha256": "17fa2e2799afb252392afb2fa10e3253023c1b5f2a5f77e079c3ea783eeebf43"
  },
  {
    "path": "src/application/playable-advance.ts",
    "bytes": 862,
    "sha256": "c703a8eab70aabd3a1cf3f0a4a0f0b25b9c253a0afca8dd4a192d29a0900c9a0"
  },
  {
    "path": "src/core/market.ts",
    "bytes": 28799,
    "sha256": "166fb7074bb24cd79ec8e89ab00864a1a29e7a6e0d39bffc1b333140b27adc39"
  },
  {
    "path": "src/core/market-projection.ts",
    "bytes": 2575,
    "sha256": "53ae8a8ac3cb3c864d6d02164678f31e6405c52bedf7019d91fd18408c46f7d5"
  },
  {
    "path": "src/content/market.ts",
    "bytes": 4033,
    "sha256": "94da1efbf90a5512ff5b6da2ea14f168368b1763622f6c24e56851e91c3ec8d6"
  }
]
```
