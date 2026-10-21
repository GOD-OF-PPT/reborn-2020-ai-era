# D09 支持等待数键修后实际浏览器证据复核 r7

本轮只读R8失败前图/属性JSON、R10长回响仍显示时的PNG/AX、按键记录、journal及公开74/75/76原文。没有修改源码、运行测试/类型/静态检查、操作浏览器或查询几何/尺寸/兼容。唯一写入为本新报告。

## 此具体Wait缺口已在R10原支持路径闭合

旧R8首图中，支持等待标题和长责任正文可见，原按1记录却保持Jul19/r75/page1不变，主按钮inert属性存在、tabIndex=-1，未产生新提交。R10以原物理74明确恢复后，沿原Jul19客户实际复核到新的75；新PNG/AX在相同长回响仍显示时，首项已有原“等这份合作的原反馈·2024-07-26”和相邻“先核对”。80%已验收/20%待完成支持、预款与原应收、现金口径等完整文本仍在原AX/分页内容中。

新eco-wait-number1-working-r75-to76.json记录主按钮inertAttribute=null、tabIndex=0；当场的一次按1后，先读到实际Jul26/已保存76、原企业可花31,061.30保持不变。该状态与即时journal、公开76及物理75相符。因此本次“标题导航在首页而原主等待不可操作”的具体功能问题，已有修复后真实数键到达原支持结果的证据，不仅是CSS或组件推断。

## 回包错误必须保留

这次Input.dispatchKeyEvent的CDP回包发生超时。原journal明确保留错误，同时在任何重复之前已观察到saved76/Jul26，并明确没有重复按键或命令。不能描述为“初次按键工具无错”或“全程无观测错误”，也不能因回包超时把已保存业务当未执行而重发。本轮未发出任何新按键。

按键原记录如下：

```json
{
  "before": {
    "books": [
      {
        "name": "眼前的选择 · 翻页阅读",
        "page": 1,
        "pages": 3
      }
    ],
    "cash": "可花 ¥31,061.30",
    "date": "2024-07-19",
    "dialogs": [],
    "save": "已保存，第75次提交",
    "screen": "deepseek"
  },
  "buttonBefore": {
    "html": "<button type=\"button\" class=\"\" aria-label=\"等这份合作的原反馈 · 2024-07-26\"><span>等这份合作的原反馈 · 2024-07-26</span><kbd aria-hidden=\"true\">Space</kbd></button>",
    "inertAttribute": null,
    "tabIndex": 0
  },
  "after": {
    "books": [
      {
        "name": "眼前的选择 · 翻页阅读",
        "page": 1,
        "pages": 2
      }
    ],
    "cash": "可花 ¥31,061.30",
    "date": "2024-07-26",
    "dialogs": [],
    "save": "已保存，第76次提交",
    "screen": "deepseek"
  },
  "observationError": "Reply timeout; actual saved76 observed and no repeat."
}
```

## 原文与实际结果交叉核对

- R10恢复缓冲74与旧R8物理原备份74相同SHA c3b1343d811e014f03e4fa24508cbb7fa1296811a48b3e9b04a8567fd58ab7b5；其为导入缓冲，不计为新的保存结果。
- R10新物理75为fca52077…，不同于旧失败分支31214696…；二者各自保留，不混成同一个原字节快照。
- 75的75条原receipt逐项完整保留为76的前缀，76只新增一条expectedRevision=75的AdvanceTime（Jul26/snapshot），76个commandId均唯一。
- 同一原supportJob由running→completed，原合同由support→completed，supportPostedAt=Jul26。没有用免费状态按钮伪造完成。
- 浏览器显示现金仍31,061.30；实际支持完成没有被写作新增现金到账。后续应收实际到期收取仍是独立行为，本轮不替代其完整核定。

```json
{
  "sameOriginalRun": true,
  "original74RestoreBuffer": {
    "path": "goal-1/evidence/t17-acceptance-14/chrome-deepseek-r10/eco-real-original-backup74-restore-text-before-import.json",
    "bytes": 1022729,
    "sha256": "c3b1343d811e014f03e4fa24508cbb7fa1296811a48b3e9b04a8567fd58ab7b5",
    "recordedOrigin": "import_buffer",
    "recordedSource": "D09-production-r10-C16-normal-ecology-equity",
    "origin": "normal",
    "schemaVersion": 13,
    "runId": "normal-deepseek-technical_employee",
    "revision": 74,
    "date": "2024-07-16"
  },
  "actualPhysical75Backup": {
    "path": "goal-1/evidence/t17-acceptance-14/chrome-deepseek-r10/eco-original-physical-backup-r75-before-support.json",
    "bytes": 1030898,
    "sha256": "fca52077dc4b14611ce698d3ac341d57984d82a46920b5d5d9f3643bd91152a5",
    "recordedOrigin": "stored_original",
    "recordedSource": "D09-production-r10-C16-normal-ecology-equity",
    "origin": "normal",
    "schemaVersion": 13,
    "runId": "normal-deepseek-technical_employee",
    "revision": 75,
    "date": "2024-07-19"
  },
  "actualPublic76": {
    "path": "goal-1/evidence/t17-acceptance-14/chrome-deepseek-r10/eco-real-support-completed-r76-after-key1.json",
    "bytes": 1038331,
    "sha256": "debdcd2e75fcfe716ad40b4a1c77402cfa6b8ce52bedd9dafe243b16aa5285fe",
    "recordedOrigin": "product_export",
    "recordedSource": "D09-production-r10-C16-normal-ecology-equity",
    "origin": "normal",
    "schemaVersion": 13,
    "runId": "normal-deepseek-technical_employee",
    "revision": 76,
    "date": "2024-07-26"
  },
  "original75ReceiptPrefixPreserved": true,
  "receiptCount75": 75,
  "receiptCount76": 76,
  "uniqueCommandIds76": 76,
  "newSingleCommand": {
    "commandId": "command-c2242fe1-e132-42d2-afc5-6db515916790",
    "revisionBefore": 75,
    "kind": "AdvanceTime",
    "payload": {
      "date": "2024-07-26",
      "phase": "snapshot"
    }
  },
  "beforeContracts": [
    {
      "id": "dsk:ddd9d8b77b2bb26b80e20849a48f6ae4",
      "status": "support",
      "reviewAt": "2024-07-19",
      "supportJobId": "dsk:85101adfabaa517b875e13cde9d8ed62",
      "supportPostedAt": null,
      "supportJob": [
        {
          "id": "dsk:85101adfabaa517b875e13cde9d8ed62",
          "status": "running",
          "startAt": "2024-07-19",
          "completeAt": "2024-07-26",
          "releasedAt": null
        }
      ]
    }
  ],
  "afterContracts": [
    {
      "id": "dsk:ddd9d8b77b2bb26b80e20849a48f6ae4",
      "status": "completed",
      "reviewAt": "2024-07-19",
      "supportJobId": "dsk:85101adfabaa517b875e13cde9d8ed62",
      "supportPostedAt": "2024-07-26",
      "supportJob": [
        {
          "id": "dsk:85101adfabaa517b875e13cde9d8ed62",
          "status": "completed",
          "startAt": "2024-07-19",
          "completeAt": "2024-07-26",
          "releasedAt": null
        }
      ]
    }
  ]
}
```

上列是原字节身份、receipt增量和已发生状态的读取，不是重新运行引擎。完整Create到各分支的实际重放审核仍由主流程统一执行；不能以这个原文前缀核对冒充完整Create审核。

## 与路线5遮挡分开

R10另有routes-with-obligation-first-frame.png以及pointer5仍被牵挂覆盖的实际记录；R11只CSS移动routes thread-pocket并完成构建，路线5的同一实际原75重验是另一项责任。本报告没有操作或确认其修后pointer5，不能把本Wait数键成功扩写为五路线入口已完成。

当前实际结论限定为：一个正常technical_employee原生态合作、一次已保留长客户回响的原支持等待按1→实际saved76/Jul26。其他等待卡、架空权益、完整生态收款、候选失败/重试、完整QX与真人体验均不由本报告宣告完成。兼容开发/测试为0。

## 读取时原证据身份

本报告不宣布浏览器根目录封存；journal/exports为本轮读取时的实际字节快照。

```json
{
  "goal-1/evidence/t17-acceptance-14/chrome-deepseek-r8/eco-support-after-review-r75-first-frame.png": {
    "bytes": 148915,
    "sha256": "759d8fe2b59a3ce3fa3812958352e96395b15c479336bbdcae9b64190c533d90"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-deepseek-r8/eco-wait-number1-blocked-before-repair-r75.json": {
    "bytes": 963,
    "sha256": "5662044b94a4964f411839edaa47ab7b3b2411a5ccdd4d2f9e2c565de97dac36"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-deepseek-r10/eco-long-reply-wait-ready-r75.png": {
    "bytes": 145589,
    "sha256": "6f5f3c3b4cb087130e11d82df111e4d0ac9d865e7021d10fa9437a06436ab5b4"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-deepseek-r10/eco-long-reply-wait-ready-r75-ax.txt": {
    "bytes": 3843,
    "sha256": "0da7d32d4d717aa906539500fe1a2746db19c237ed36ee6598195d25959b4498"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-deepseek-r10/eco-wait-number1-working-r75-to76.json": {
    "bytes": 943,
    "sha256": "53bddf4887fad8c14275a3badca5c6f80f8a22555bafa3b695c3a70c6227e5ea"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-deepseek-r10/native-progress.jsonl": {
    "bytes": 15683,
    "sha256": "5da41b8f7a883ab572a9ab453db89f34537151eab0edad17b8a7790b7e45f5bc"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-deepseek-r10/exports.jsonl": {
    "bytes": 1470,
    "sha256": "b2fa6bf10620e45822bbcdee9bde2647239882caddbf9a7108852d2b0d8bd6fc"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-deepseek-r10/eco-real-original-backup74-restore-text-before-import.json": {
    "bytes": 1022729,
    "sha256": "c3b1343d811e014f03e4fa24508cbb7fa1296811a48b3e9b04a8567fd58ab7b5"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-deepseek-r10/eco-real-support-completed-r76-after-key1.json": {
    "bytes": 1038331,
    "sha256": "debdcd2e75fcfe716ad40b4a1c77402cfa6b8ce52bedd9dafe243b16aa5285fe"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-deepseek-r10/eco-original-physical-backup-r75-before-support.json": {
    "bytes": 1030898,
    "sha256": "fca52077dc4b14611ce698d3ac341d57984d82a46920b5d5d9f3643bd91152a5"
  }
}
```

[杠精审查] 已用实际可操作属性、原按键后态、唯一命令和真实support完成共同核定该具体问题；保留CDP回包错误，没有借旧源、构建或绿色测试冒充初次工具无错。完整Create和route5修后pointer各自仍需独立证据。
