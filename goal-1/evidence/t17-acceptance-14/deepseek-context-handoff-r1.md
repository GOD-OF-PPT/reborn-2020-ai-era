# D09 原DeepSeek册上下文接线交回

仅按主控授权修改src/ui/DeepseekPanel.tsx与src/ui/EquityPanel.tsx，未改App/NarrativeScene/RoomMoment/CSS/ScreenBook/规则、未提交。原前置字节已另wx保存。未加镜像测试，也未运行类型、UI、全suite、浏览器或兼容专项；git diff --check针对这2份已跟踪改动实际0。

## 实现

- DeepseekPanel新增initialPane?:ecosystem|equity与initialFocusId?:string；仅初始化当前pane，没有传目标时仍以原ecosystem为默认。capital/resource/date及生态model/product/referral/fund草稿保持原默认和行为。
- initialFocusId传给原EquityPanel。若明确目标是现有关系/资格准备或business，EquityPanel把准备主体的初始可见选择定位到该原business；未指定时仍沿原personal desk/first business fallback。只是选中可读上下文，不提交新命令、不改变原已签agreement主体。
- 当前原记录节点加真实id：生态合同、尚有余额的delivery、当前open lead、准备、adapter、outreach；权益邀请/谈判（当前与历史分组）、agreement、exit、governance、关系/资格准备。原关闭生态企业及其合同摘要也加原id。
- 原business入口映射至当前生态b.id-prepare、权益equity-preparation；关闭生态business映射到原档案article真实id。
- 原pane导航后显示唯一“翻到当前这份原事项”链接，href以encodeURIComponent编码真实目标ID。依原ScreenBook.followAnchor展开祖先details/翻到原目标页，不新增scroll、geometry或自有分页。若lazy/pane尚未加载真实目标，点击仅preventDefault，避免原生hash滚动；不自动提交、补齐记录或修改权限。

## 明确保留的边界

链接只定位已经由原面板渲染的节点，不擅自扩展原内容。过去closed企业的准备/adapter/outreach、非open lead等若原面板本来未渲染为独立节点，本次没有凭空造一个替代记录；target不存在时安全不跳。父可按既有原实体/分组选择focus，不能宣称所有历史ID都已出现完整新页。

所有原字段、动作参数/确认、原业务规则、原账与渲染顺序保持；静态逐一提取的原CommandButton节点源文本前后完全相同（见下），不以此冒充UI或真实保存测试。原resource/date默认没有替玩家选新任务，原架空开关仍须明确确认。类型和实际原册定位由父统一检查/Chrome验证。兼容开发测试0。

```json
[
  {
    "path": "src/ui/DeepseekPanel.tsx",
    "before": {
      "bytes": 15107,
      "sha256": "963317d6f81069f700fd79ae6605b221de65a3282265fbf780e1d438b72e0329"
    },
    "after": {
      "bytes": 15745,
      "sha256": "3e3cb1b4f7a86652754b218f53ef972b3fc319c18a54817e0194446d70e5255b"
    },
    "originalCommandButtonNodes": 20,
    "currentCommandButtonNodes": 20,
    "allCommandButtonSourceBytesEqual": true
  },
  {
    "path": "src/ui/EquityPanel.tsx",
    "before": {
      "bytes": 16747,
      "sha256": "7a67cb7ab412c7ed30d94fc52fb9af9997518818bdf50c094c40d263bc60b7c0"
    },
    "after": {
      "bytes": 16954,
      "sha256": "f6391c18b25f511046f08dc1b8576ac4344cc1688d9f355956d64451ee07cff6"
    },
    "originalCommandButtonNodes": 21,
    "currentCommandButtonNodes": 21,
    "allCommandButtonSourceBytesEqual": true
  }
]
```
