# D08 最终可视证据增量独立复核 R13

2026-10-21。本报告追加对既有interaction-browser-visual-review-r1.md的明确修复证据，不覆盖旧件。4张新/旧相关PNG均已实际调用view_image目检，同时读取完整AX、focus样式原记录、raw字节与R13源桥接；未操作浏览器，未运行测试/构建/fullCreate审计，兼容开发测试0。

## 技术notice已经有真实中文画面证据

R12 chinese-read-feedback-r72.png与同名full-ax.txt均实际可见“回信已经读过，原许可和下一步条件留在中转原册里。”；不再由compact diff AX推断文字，也没有显示ReadRelaySupplyDecision技术名。PNG和完整AX共同显示2024-10-09、¥224,000、行动3/4、预留0、第72次已保存。原许可并未被文案重写成自动开服务/保证收益。

这解决原独立r1报告中“R12中文只经过源码核对、尚缺真实完整文案”的具体证据缺口。R11三份compact/no-change AX仍保留原身份，不反写成完整树。

## 确定的探索按钮可读性缺陷与修复边界

- 原R12 final-room-first-paid-r7.png已实际目检：探索按钮整行白底、浅字几乎不可辨，确实存在可读性缺陷；原图保留为失败证据。
- R13 final-room-paid-r7-hover-fixed.png实际目检为普通态，探索文字重新清楚，主按钮金底辅文也较深；即使文件名含hover-fixed，也不把它说成实际鼠标hover截图。
- R13 explore-focus-readable.png实际目检有金色focus轮廓，探索行深绿底浅字可读；对应styles.json明确focused=true、focusVisible=true、hovered=false，前景rgb(255,240,209)、背景rgb(23,49,45)。这是实际键盘焦点可视状态证据。
- 最后CSS将moment-explore:hover和:focus-visible放入同一深底浅字规则，并补primary:hover辅文/符号颜色，辅文11→12px且常态金底颜色加深。静态selector覆盖hover意图正确，但当前证据没有实际鼠标hover动作，不能把焦点截图扩大称hover实测完成。

因此本次解决的是探索按钮普通态与实际键盘焦点态的确定可读性问题，并对主按钮辅文作了针对性视觉改善；不宣布所有状态/字体/风格已完美。

## R13构建与UI/类型证据的真实桥接

已读取R13 complete.json：真实build driver/wrapper均0，373源冻结、metadataErrors/validationErrors均空。已独立读取R12与R13 source-freeze并逐项重读当前文件：两边均373项且同集合，只有game-clarity.css改变，其余372实际hash/bytes相同，当前全部373匹配R13 freeze。

已有type-ui-source-bridge记载R12 type0及26文件/172UI测试通过，R13仅重做生产build、未重跑172UI。这里正确使用未变TS/测试/配置/raw的R12证据桥接，不把R13写成新执行一次26/172。CSS不能由UI绿测代替视觉，以上普通态/键盘焦点图为本次相应可视补充。

## 原文身份与免费读信的两个分支

- R13最终r7原文197562B，SHA0b41e3515a06c96c589344e1e68c5fca206de32b455744afb94584007823ec1a；本审查实际与R10小循环已保存原文比较全字节相同，延续原探索/重进一致性结论。
- R11 r72 SHA f640daeefe06c9c35278e3e822d4286cc9a8f3809d837ea941625b6f688691d0；R12 r72 SHA c06d93a2ef0508b4b2c2f0d439bffe1687142d5d4a7d1d79f6d74737f5c2b124。两者**不是**canonical相同或全字节同档。
- 本审查实际确认：同runId，前71条receipt与同一原r71前史完全相同，最后各为原ReadRelaySupplyDecision且commandId不同；R12读取后与原r71 economy整个对象相同、date相同、application read=true。公开恢复/读信/导出动作记录可见；不把恢复前后不同物理保存身份隐去。
- R12完整中文回响来自这次原r71恢复后实际另一次阅读分支，不是用R11的结果截图冒充R12。不同commandId造成不同原文符合记录身份，不能为追求hash相同而覆盖旧分支。

## 旧错帧与未完成范围

后期0AP原restore Dialog错帧仍排除；此前已实际目检的late-room-r105-corrected-dev-r12.png继续承担DEV R12的0AP房间视觉证据，目录旧名不改变来源。没有把它升级为R13生产后期全部体验。

本次没有读取fullCreate独立审计终态，不预判其通过；raw字节与receipt前史对照不能代替从Create重放。原范围中重复日期、右侧标签阅读节奏、后期人物/客户/阶段场景的持续美术优化仍可推进。主观风格、真人理解度/趣味性仍没有真人样本；原PNG缺口与完整后期矩阵保留，5c-P1暂停而非完成/取消，M01兼容继续暂停。

## 本次实际读取比较

```json
{
  "sources": {
    "r12": 373,
    "r13": 373,
    "sameKeys": true,
    "changed": [
      "src/ui/game-clarity.css"
    ],
    "currentMatchesAllR13": true
  },
  "r7ProductionBytesSame": true,
  "supplyBranches": {
    "sameRunId": true,
    "prefix71Equal": true,
    "lastCommandIdsDifferent": true,
    "lastKinds": [
      "ReadRelaySupplyDecision",
      "ReadRelaySupplyDecision"
    ],
    "r71ToR12EconomyEqual": true,
    "dateBefore": "2024-10-09",
    "dateAfter": "2024-10-09",
    "readAfter": true
  }
}
```

## 增量证据字节索引

```json
[
  {
    "path": "chrome-production-r12/chinese-read-feedback-r72.png",
    "bytes": 122392,
    "sha256": "47f2d06f5c396f76c7810a726efab7bd9282db3b21ea097606d3ab48a74367f5"
  },
  {
    "path": "chrome-production-r12/chinese-read-feedback-r72-full-ax.txt",
    "bytes": 2463,
    "sha256": "e0ecda513e79d8f16c6bf34157e58396dba4d06b41a2dc0292f548870fd755f5"
  },
  {
    "path": "chrome-production-r12/final-room-first-paid-r7.png",
    "bytes": 119361,
    "sha256": "20eb10511daa8464178559acf4410ea558667d6238951b325d670a2325f1055b"
  },
  {
    "path": "chrome-production-r13/final-room-paid-r7-hover-fixed.png",
    "bytes": 119868,
    "sha256": "03d638c42643a0e2001d81ad444fabd3c8ca99ea98b4cf4de3c877c97a51a553"
  },
  {
    "path": "chrome-production-r13/explore-focus-readable.png",
    "bytes": 122483,
    "sha256": "39fa94c01a7be96603713b2236c640da57cac27d9da5332b79fab7230f58d011"
  },
  {
    "path": "chrome-production-r13/explore-focus-styles.json",
    "bytes": 190,
    "sha256": "ca86e808025d301c43ab5434cf62fd4d0c87bfbc8fbc0124955560da28bf54ed"
  },
  {
    "path": "chrome-production-r13/final-room-paid-r7-full-ax.txt",
    "bytes": 2380,
    "sha256": "cd830837d718464377d92690d08acf1829e4c8f4e9ac4acab01bebc25ee57b0a"
  },
  {
    "path": "chrome-production-r13/r7-final-production-readback.json",
    "bytes": 197562,
    "sha256": "0b41e3515a06c96c589344e1e68c5fca206de32b455744afb94584007823ec1a"
  },
  {
    "path": "chrome-production-r12/r72-free-read-final-production-saved.json",
    "bytes": 1031478,
    "sha256": "c06d93a2ef0508b4b2c2f0d439bffe1687142d5d4a7d1d79f6d74737f5c2b124"
  },
  {
    "path": "checks-r13/build/complete.json",
    "bytes": 620,
    "sha256": "8f159b4bd8151adba722ab0c606eb877f2b86b4d8d1b9c3bab2f30daef003214"
  },
  {
    "path": "checks-r13/build/type-ui-source-bridge.json",
    "bytes": 1514,
    "sha256": "f9eea1bbdb162459de5afa2dfe260058c67bd7960360cdb3536a3640fcb721d6"
  }
]
```
