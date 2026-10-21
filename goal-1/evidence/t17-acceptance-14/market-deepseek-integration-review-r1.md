# D09 市场/DeepSeek统一接线独立复核 r1

2026-10-21。只读新市场与DeepSeek统一接线、原日期/命令/账户合同；未修改源码、测试或计划，未运行测试/浏览器/兼容，未审另一代理正在修的domain-result差分源。父全局freeze尚未启动，以下为本次所读实现快照的发现，不预判30UI/20rules结果。

## 确定需要处理的接线问题

### [P1] 等待卡内两个按钮破坏数字决策索引

NarrativeScene.chooseWithNumber按.scene-choices内所有button的顺序选1/2/3；ScreenBook的决策导航却按[data-book-chapter]每张卡一条。新WaitChoice含ClockAdvance，后者有clock-review“先核对”和clock-main“真实等候”两个button。于是等待卡+撤余量卡+原册卡的页面，编号2实际命中等待主按钮，而非第2卡撤余量；编号3才命中撤余量。当clockCommitments已知时main可confirm=false直接AdvanceTime，这不只是导航歧义，可能按错决策推进日期并执行原支出。

建议每张决策卡显式拥有一个数字主按钮，Wait只计clock-main，不把review计作第二决策；导航和快捷键使用同一主决策集合。保留原preview、modal、isComposing、inert与disabled保护，不为修数字映射新增直调核心命令。未操作键盘，本结论来自两套不同索引的静态直接对照。

### [P2] 明确架空的当前事项打开后仍先落生态服务页

NarrativeScene的DeepSeek非简单动作Choice统一p.onOpen()，没有传source或当前pane；App只按screen打开原workspace。DeepseekPanel初始化pane固定ecosystem，尚无initialPane/目标参数。因此从“查看本轮付款与不跟投”“查看独立买方、原报价与股数”等当前架空事项打开，仍先看到生态服务，玩家需再次切直接投资并找记录。这保留了原数据，但没有完成D09所需减少多重菜单/明确参与方式的接线。

建议把source对应原pane上下文传到原册，至少架空事项直接打开equity；生态事项仍生态页，完整原册通用入口保留。可进一步携带原entity ID定位原片段，不能借打开原册自动enable、付款、跟投或接受股数。原固定CollectEquityExit直办不受此跳转问题影响。

### [P2] DS可直办收款的第一层没有渲染原资金主体

helper已提供entity.accountId，但当前DeepseekRecordSwitch仅渲染生态/架空分类，NarrativeScene主动作与RoomMoment DS detail也未补原主体。顶部全局所选账户可能与被选原agreement/business不同，而CollectEcoReceivable/CollectEquityExit沿原false confirm直接执行。特别生态企业持有股权时，玩家只看金额和“架空转让款”，第一层不清楚进入个人还是企业。原核心按原ID归属正确，不能称为错付；这是决策所需主体信息缺失。

建议在当前记录/主动作旁明确entity.accountId对应的原个人或企业主体，RoomMoment DS直办也带相同说明。不要把修文案误写成改收款账户，不允许用全局当前账户覆盖原协议。

## 已排除的一项误诊

审查中曾把MarketRecordSwitch拼接submittedAt推断为计划会显示null；复核MarketOrder类型、marketStateSchema与MarketRuntime.#newOrder后已撤回。市场submittedAt始终是date，plan和place均写原date；DeepSeek合同submittedAt才nullable。没有合法normal市场null证据，**该项不列缺陷**。若改为“计划·日期写下/委托·日期提交”是清晰度改进，不是修复null。

## 已确认的正确连接

- RoomMoment从所有受控账户寻找当前market事项，详情带原账户，并将inspect.accountId传NavigateScene；CinematicRoom接同合同，App包装器先setAccountId后navigate。市场专页context用runId|accountId，切账户不复用另一账户选中事项。
- 个人running research已显式返回accountId personal且文案个人费用，解决早期审查的财务主体语义。
- MarketSceneChoice由view.runId作为key，取消只setOpen(false)而保留draft/page；明确账户、标的、方向、股数、价格、撮合点才形成payload，expiry仍原ID。quote改变须显式重新核对，数量/限价不暗改。原preview仍处理停牌/未知规则/资格/交易单位/资金与可售股。
- 新Dialog只有已保存且revision真实改变才按成功关闭；hasCandidate/conflict也关闭以让SafetyNotice拥有失败处理。失败候选不把原稿变成成功交易，readOnly仍只允许读草稿。这里是源码核对，实际取消/原候选视觉需Chrome验证。
- MarketRecordSwitch只列当前账户progress.entityIds，DS RecordSwitch保留各实体、原客户/准备/适配/邀请/条款/持仓/退出/治理/历史可切换；chosen context按runId重置而非跨人生串记录。
- DS helper当前修复了有效未结束negotiation使关联invitation非active；真实谈判/跟投/到期应收不再被旧前提或锁定无决定状态抢焦点。复杂金额/股数/资源/日期/范围始终留原显式选择，不从场景自动签约或扩权。
- waitAt使用原playableAdvanceDate(w,current,公开目标)，pause/requiredDelivery会禁止，仍由原ClockAdvance处理原费用/事件/日序。主等待存在时footer显示说明，不再再放第二份时钟。
- 同run/revision的receipt、原CommandButton/原request保存guard和全局SceneAttention仍保留；本次没有看到为一屏重构删除原市场账目、五路线或原风险/义务。

## 未证明范围

本审查不证明当前窗口排版、草稿取消后实际焦点、数字键、SafetyNotice顺序或新默认流程已可玩；实际Chrome与最终类型/UI/规则/构建/完整Create审计由主控统一。DeepSeek复杂新资源/融资表单仍以原册为权威，不能宣称全部DeepSeek页面已换成全新一屏表单。真人0、原PNG缺口、原矩阵/5c-P1暂停及M01兼容暂停不变，本次兼容开发测试0。

## 实际读取源码身份

```json
[
  {
    "path": "src/ui/market-scene-progress.ts",
    "bytes": 7058,
    "sha256": "71952aa6eaa965eb7d4a012f7d9b00ccac3acfcf6e013337d5be1436f02f7598"
  },
  {
    "path": "src/ui/MarketSceneChoice.tsx",
    "bytes": 7546,
    "sha256": "4a807fead2d577dced1eeed09f4d05a59563cda8331f826cca5c4ed99f7d8361"
  },
  {
    "path": "src/ui/SceneRecordSwitch.tsx",
    "bytes": 2587,
    "sha256": "0d57101dff91e9f52f7fb2cf287b449431b11397a2ccd71a4a4aad4d026d6516"
  },
  {
    "path": "src/ui/NarrativeScene.tsx",
    "bytes": 36775,
    "sha256": "93f7cbb5a3ba2a833c8650f25c1ebf32a92785ef481c4cdfe5008db9df28fad9"
  },
  {
    "path": "src/ui/RoomMoment.tsx",
    "bytes": 16051,
    "sha256": "bb00c3e793907b091e169895eeea4185a8c0ec8e3f0a5ee0108a001666df999b"
  },
  {
    "path": "src/ui/CinematicRoom.tsx",
    "bytes": 11787,
    "sha256": "4c0e56c92dce4d6df128860441cd2d3d5340a565d134961f0a0f2c3d7a2a01c3"
  },
  {
    "path": "src/ui/App.tsx",
    "bytes": 28494,
    "sha256": "34a47fc8a6fc6820acb206565415fea98fc27519a3369d94327f3c002158af04"
  },
  {
    "path": "src/ui/game-types.ts",
    "bytes": 2124,
    "sha256": "a3d92d5284c0d888c810e458c3206cb77597b8e9182b4b8eb649dd6c339f294c"
  },
  {
    "path": "src/ui/DeepseekPanel.tsx",
    "bytes": 15107,
    "sha256": "963317d6f81069f700fd79ae6605b221de65a3282265fbf780e1d438b72e0329"
  },
  {
    "path": "src/ui/EquityPanel.tsx",
    "bytes": 16747,
    "sha256": "7a67cb7ab412c7ed30d94fc52fb9af9997518818bdf50c094c40d263bc60b7c0"
  },
  {
    "path": "src/ui/deepseek-scene-progress.ts",
    "bytes": 19852,
    "sha256": "553c721abe79b9b2c02ab48be954a56a1ed0b0e9ad29bfb3097888f4ca65e2a6"
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
    "path": "src/ui/ScreenBook.tsx",
    "bytes": 9000,
    "sha256": "9ec810b63bc6d67831f145ea0b172ebc427d65ee90b629fc75d1da16d56a48f9"
  },
  {
    "path": "src/application/playable-advance.ts",
    "bytes": 862,
    "sha256": "c703a8eab70aabd3a1cf3f0a4a0f0b25b9c253a0afca8dd4a192d29a0900c9a0"
  },
  {
    "path": "src/core/market-types.ts",
    "bytes": 6772,
    "sha256": "128ff61a76351fa638223ba6770f8280eb40256892af1363d39ea57f06724984"
  },
  {
    "path": "src/core/market-schema.ts",
    "bytes": 5866,
    "sha256": "5528363053e83176043ac072e392cd6d79a1d65654c66ff94b296fa0c348fc29"
  },
  {
    "path": "src/core/market.ts",
    "bytes": 28799,
    "sha256": "166fb7074bb24cd79ec8e89ab00864a1a29e7a6e0d39bffc1b333140b27adc39"
  }
]
```
