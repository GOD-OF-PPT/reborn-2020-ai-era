# D09 保存失败、人物自主日程与明确架空不跟投的实际证据复核 r8

本轮独立只读指定四目录的PNG、AX、JSON、journal及公开原档，并核实际bytes/SHA、原receipt与状态。唯一新写为本报告；没有修改源码、调用浏览器、查询几何/尺寸、运行测试/类型/静态检查或执行引擎重放。完整Create审核尚待父代理单独启动，本报告不预判其创建/命令/文件计数或通过结论。

## 1. 真实事务中止与同候选保存

原real-abort-old-scene-r1.json明确banner“写入成功后中止：已触发”，保存仍为未保存第1次提交，successDialogs=0、marketRecordSelectors=0。旧PNG/AX显示原完整提交仍在和原候选重试/导出选项，没有提前显示计划成功；原journal记录一次Plan确认后进入未保存状态，现金26,000元、日期Jan1仍保持。该试验位于DEV的独立abort验证库，不与正常生产存档或真实交易混同。

两份旧已保存/独立物理r1均143775B、SHA3746433bfa15567049f555344ed47cc0d47ceb8905c165c57215d63fd376bf45，实际Buffer字节相同。唯一未保存candidate2、原candidate重试saved2、独立physical2、reload2四份均147439B、SHA9b25197aabc24f32ee110d089c46fdb8902dd242380206e5b90cd75a98b339d0，实际字节相同。candidate在失败时仍是未保存候选，不能把四份都数成独立保存结果。

新态只有CreateRun与一条PlanStockOrder，原commandId不变且均唯一，旧receipt为新态前缀。订单为50股/限价25元、planned、grossFilledFen=0/feesPaidFen=0、无fills。实际现金仍26,000元、economy.actions为空、浏览器AP4→4；原1255元为active plan预留，原候选成功保存后才显示可花24,745与计划回响，没有把预留说成已付手续费或已成交。只读独立标签取得物理旧1/新2，不写新业务；重载原文仍是同一2。

```json
{
  "abortObservation": {
    "banner": "隔离存储验证库：reborn-2020-t09-abort-validation · 写入成功后中止：已触发。此开关只存在于本地开发服务。",
    "date": "2020-01-01",
    "heading": "先留好生活，再给判断一个边界。",
    "marketRecordSelectors": 0,
    "save": "未保存，第1次提交",
    "successDialogs": 0
  },
  "oldOriginals": [
    {
      "path": "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/normal-content-original-committed-r1.json",
      "bytes": 143775,
      "sha256": "3746433bfa15567049f555344ed47cc0d47ceb8905c165c57215d63fd376bf45",
      "recordedOrigin": "product_export",
      "recordedSource": "D09-dev-current-R11-isolated-real-head-put-abort",
      "recordedMethod": "Public product text buffer/export -> original full-text book DOM in bounded chunks; no geometry, viewport, hidden controller, storage injection or compatibility checks.",
      "origin": "normal",
      "schemaVersion": 13,
      "runId": "life-4bbbfd63-0b6c-450f-8085-27d4abfee42f",
      "revision": 1,
      "date": "2020-01-01"
    },
    {
      "path": "goal-1/evidence/t17-acceptance-14/chrome-fault-physical-r11/independent-physical-old-r1-after-abort.json",
      "bytes": 143775,
      "sha256": "3746433bfa15567049f555344ed47cc0d47ceb8905c165c57215d63fd376bf45",
      "recordedOrigin": "stored_original",
      "recordedSource": "D09-dev-R11-independent-physical-originals-readonly",
      "recordedMethod": "Public product text buffer/export -> original full-text book DOM in bounded chunks; no geometry, viewport, hidden controller, storage injection or compatibility checks.",
      "origin": "normal",
      "schemaVersion": 13,
      "runId": "life-4bbbfd63-0b6c-450f-8085-27d4abfee42f",
      "revision": 1,
      "date": "2020-01-01"
    }
  ],
  "sameOldBytes": true,
  "candidateAndSavedCopies": [
    {
      "path": "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/normal-content-original-unsaved-plan-candidate-r2.json",
      "bytes": 147439,
      "sha256": "9b25197aabc24f32ee110d089c46fdb8902dd242380206e5b90cd75a98b339d0",
      "recordedOrigin": "candidate",
      "recordedSource": "D09-dev-current-R11-isolated-real-head-put-abort",
      "recordedMethod": "Public product text buffer/export -> original full-text book DOM in bounded chunks; no geometry, viewport, hidden controller, storage injection or compatibility checks.",
      "origin": "normal",
      "schemaVersion": 13,
      "runId": "life-4bbbfd63-0b6c-450f-8085-27d4abfee42f",
      "revision": 2,
      "date": "2020-01-01"
    },
    {
      "path": "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/normal-content-same-candidate-retry-saved-r2.json",
      "bytes": 147439,
      "sha256": "9b25197aabc24f32ee110d089c46fdb8902dd242380206e5b90cd75a98b339d0",
      "recordedOrigin": "product_export",
      "recordedSource": "D09-dev-current-R11-isolated-real-head-put-abort",
      "recordedMethod": "Public product text buffer/export -> original full-text book DOM in bounded chunks; no geometry, viewport, hidden controller, storage injection or compatibility checks.",
      "origin": "normal",
      "schemaVersion": 13,
      "runId": "life-4bbbfd63-0b6c-450f-8085-27d4abfee42f",
      "revision": 2,
      "date": "2020-01-01"
    },
    {
      "path": "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/normal-content-r2-after-reload.json",
      "bytes": 147439,
      "sha256": "9b25197aabc24f32ee110d089c46fdb8902dd242380206e5b90cd75a98b339d0",
      "recordedOrigin": "product_export",
      "recordedSource": "D09-dev-current-R11-isolated-real-head-put-abort",
      "recordedMethod": "Public product text buffer/export -> original full-text book DOM in bounded chunks; no geometry, viewport, hidden controller, storage injection or compatibility checks.",
      "origin": "normal",
      "schemaVersion": 13,
      "runId": "life-4bbbfd63-0b6c-450f-8085-27d4abfee42f",
      "revision": 2,
      "date": "2020-01-01"
    },
    {
      "path": "goal-1/evidence/t17-acceptance-14/chrome-fault-physical-r11/independent-physical-r2-after-original-retry.json",
      "bytes": 147439,
      "sha256": "9b25197aabc24f32ee110d089c46fdb8902dd242380206e5b90cd75a98b339d0",
      "recordedOrigin": "stored_original",
      "recordedSource": "D09-dev-R11-independent-physical-originals-readonly",
      "recordedMethod": "Public product text buffer/export -> original full-text book DOM in bounded chunks; no geometry, viewport, hidden controller, storage injection or compatibility checks.",
      "origin": "normal",
      "schemaVersion": 13,
      "runId": "life-4bbbfd63-0b6c-450f-8085-27d4abfee42f",
      "revision": 2,
      "date": "2020-01-01"
    }
  ],
  "allFourNewBytesEqual": true,
  "oldReceiptPrefixPreserved": true,
  "newCommands": [
    {
      "commandId": "create-b7fd4951-a0b5-4231-8300-ee172f53a5e5",
      "revisionBefore": 0,
      "actorId": "player",
      "kind": "CreateRun"
    },
    {
      "commandId": "command-99955c94-4b24-4c79-980b-b70cddf57e61",
      "revisionBefore": 1,
      "actorId": "player",
      "kind": "PlanStockOrder",
      "payload": {
        "accountId": "personal",
        "limitPriceFen": 2500,
        "quantity": 50,
        "quoteId": "initial-2020-01-01",
        "side": "buy",
        "symbol": "SIM-AI02",
        "validUntil": "SIM-CP-2020-01-20"
      }
    }
  ],
  "uniqueCommandIds": 2,
  "cashBeforeFen": 2600000,
  "cashAfterFen": 2600000,
  "activeReservations": [
    {
      "accountId": "personal",
      "amountFen": 125500,
      "id": "market:7292e848b88ea03314ac909860247a87",
      "kind": "plan",
      "originId": "market:6708851be4d56f1f6e9ca9639b04cbe1",
      "status": "active"
    }
  ],
  "economyActions": [],
  "marketOrders": [
    {
      "accountId": "personal",
      "eligibleIndex": 0,
      "expiresIndex": 1,
      "feesPaidFen": 0,
      "grossFilledFen": 0,
      "id": "market:930f9a127373de7ff793aadae38fa5c4",
      "limitPriceFen": 2500,
      "oddLot": false,
      "quantity": 50,
      "quoteId": "initial-2020-01-01",
      "reason": null,
      "remaining": 50,
      "replacesId": null,
      "reservationId": "market:7292e848b88ea03314ac909860247a87",
      "ruleId": "SIM-R2",
      "sequence": null,
      "side": "buy",
      "status": "planned",
      "submittedAt": "2020-01-01",
      "symbol": "SIM-AI02"
    }
  ],
  "marketFills": []
}
```

## 2. NPC自主撤回，不是玩家失约或免费奖励

原C16 normal r12邀请按原公开渠道导入，来源buffer222704B/SHA5fd29beaf62409cedc3f61f243614695c92597e909ef884e62f3342898738f12。实际从June23分别推进到June30/r13、July1/r14；新命令只有两条AdvanceTime，未接受、拒绝、兑现或再付生活工作。最终231680B/SHA6fbf7dc29844a8833d6fa651b1533fe30c9159776d9628977e389920416f6835。

原邀请offered→npc_declined，acceptedAt/acceptedCommandId/responseCommandId/completionJobId仍null，resolvedAt=July1；resolutionSourceId精确对应原tang-away-2020:start公开agenda。life.jobs完全保持，未新增promise_keep，也没有missed。原时间回响和人物场景PNG明确“对方按自己的安排撤回尚未接受邀请，不记玩家失约”，原共同经历与已付成本仍在。

现金5800→1800的唯一新增个人现金交易是living:2020-07-01，-4000元，source=bootstrap:living；不是NPC撤回收费。AX/PNG的4/4来自进入Q3原四点预算，不是增加的赠送行动。原期限expiresAt=July7尚未到，本次不是自然过期或玩家超期未兑现。

```json
{
  "input": {
    "path": "goal-1/evidence/t17-acceptance-14/chrome-life-npc-r11/normal-c16-npc-offered-r12-text-before-import.json",
    "bytes": 222704,
    "sha256": "5fd29beaf62409cedc3f61f243614695c92597e909ef884e62f3342898738f12",
    "recordedOrigin": "import_buffer",
    "recordedSource": "D09-production-r11-C16-normal-NPC-own-calendar",
    "recordedMethod": "Public product text buffer/export -> original full-text book DOM in bounded chunks; no geometry, viewport, hidden controller, storage injection or compatibility checks.",
    "origin": "normal",
    "schemaVersion": 13,
    "runId": "t15-npc-own-calendar",
    "revision": 12,
    "date": "2020-06-23"
  },
  "saved": {
    "path": "goal-1/evidence/t17-acceptance-14/chrome-life-npc-r11/normal-npc-own-calendar-not-player-missed-r14.json",
    "bytes": 231680,
    "sha256": "6fbf7dc29844a8833d6fa651b1533fe30c9159776d9628977e389920416f6835",
    "recordedOrigin": "product_export",
    "recordedSource": "D09-production-r11-C16-normal-NPC-own-calendar",
    "recordedMethod": "Public product text buffer/export -> original full-text book DOM in bounded chunks; no geometry, viewport, hidden controller, storage injection or compatibility checks.",
    "origin": "normal",
    "schemaVersion": 13,
    "runId": "t15-npc-own-calendar",
    "revision": 14,
    "date": "2020-07-01"
  },
  "originalReceiptPrefixPreserved": true,
  "newCommands": [
    {
      "commandId": "command-3808260f-4ba6-47c0-921c-290045268166",
      "revisionBefore": 12,
      "actorId": "player",
      "kind": "AdvanceTime",
      "payload": {
        "date": "2020-06-30",
        "phase": "snapshot"
      }
    },
    {
      "commandId": "command-f2de4310-7ed0-4ff5-95eb-69b261f32610",
      "revisionBefore": 13,
      "actorId": "player",
      "kind": "AdvanceTime",
      "payload": {
        "date": "2020-07-01",
        "phase": "snapshot"
      }
    }
  ],
  "cashBeforeFen": 580000,
  "cashAfterFen": 180000,
  "lifeJobsUnchanged": true,
  "beforePromises": [
    {
      "acceptedAt": null,
      "acceptedCommandId": null,
      "actionPoints": 1,
      "completionJobId": null,
      "costFen": 30000,
      "days": 3,
      "deadline": "2020-08-07",
      "expiresAt": "2020-07-07",
      "id": "life:41f85a063e4bfab5e46a9eefe283ae77",
      "offeredAt": "2020-06-23",
      "personId": "tang-ying",
      "resolutionSourceId": null,
      "resolvedAt": null,
      "responseCommandId": null,
      "sharedJobId": "life:19d95ab2e7b728faabb607b525523cc5",
      "status": "offered",
      "year": 2020
    }
  ],
  "afterPromises": [
    {
      "acceptedAt": null,
      "acceptedCommandId": null,
      "actionPoints": 1,
      "completionJobId": null,
      "costFen": 30000,
      "days": 3,
      "deadline": "2020-08-07",
      "expiresAt": "2020-07-07",
      "id": "life:41f85a063e4bfab5e46a9eefe283ae77",
      "offeredAt": "2020-06-23",
      "personId": "tang-ying",
      "resolutionSourceId": "life:1902faffcc02680314be805ebf189163",
      "resolvedAt": "2020-07-01",
      "responseCommandId": null,
      "sharedJobId": "life:19d95ab2e7b728faabb607b525523cc5",
      "status": "npc_declined",
      "year": 2020
    }
  ],
  "newAgenda": [
    {
      "date": "2020-07-01",
      "definitionId": "tang-away-2020:start",
      "id": "life:1902faffcc02680314be805ebf189163",
      "personId": "tang-ying",
      "sourceEventId": "life:1902faffcc02680314be805ebf189163"
    }
  ],
  "newPersonalTransactions": [
    {
      "id": "living:2020-07-01",
      "date": "2020-07-01",
      "sourceEventId": "bootstrap:living",
      "personalDeltaFen": -400000
    }
  ]
}
```

## 3. Sep1明确amount0不跟投，不是Sep15无人响应默认

原normal已签约94来源1242505B/SHA5ee2c1fdc5cbb9999edaad1871d677ade51f7aba3f2e2d4571dce5a424d16120，沿原日期到June30/95、July1/96、Sep1/97；玩家明确查看“付款与不跟投原选择”并确认FollowEquityRound amountFen=0，保存98。最终1319024B/SHAec27af701258126ac6526784860cc1b3262cb51ce8d8e73ba0192fa6fccb58b6与记录一致。

原94 receipt完整保留，新四条仅三次AdvanceTime和一次FollowEquityRound，全部98 commandId唯一。最终followDecision=declined、followAt=2025-09-01、followAmountFen=0，明确不是Sep15 defaulted。2500股、原成本、锁至2027-04-22、deepseek-counterfactual主体、personal账户、原投资lots/权利/已持份额与原94保持；agreement仅followAt/Decision发生变化，没有新增股份或权限，不能宣称本日已经发生未来实际稀释。该主体持续标明counterfactual，不是现实DeepSeek申购或投资承诺。

即时原确认明示0点/¥0，成功回响AX/PNG明示Sep1、AP4→4、个人可花156,000→156,000。推进前期的原生活费与新季度预算另按原日序发生，不能拿94→98跨季度变化冒充Follow产生的资源；上述不增钱/AP指97→98本次决定。

### 导出工具错误与恢复边界

父代理记录原导出遭工具kernel30秒中断；原journal及exports row.method也明确tool-kernel timeout后的恢复，而不是初次顺利完成。游戏保持saved98，原“导出已保存/只读翻阅完整原文”已经打开，随后从当时同一原公共full-save DOM按保留文本游标分段恢复；有一次只读尾段selector求值也超时，使用原public page reader继续，未重复FollowEquityRound或重新打开导出。原日志与特殊method保持原字节，本轮不覆盖为普通成功路径。

最终文件可解析JSON、bytes/SHA与row相符、原命令顺序及状态可核；这仍不能代替codec/完整Create重放对恢复原文的全部语义检验，本轮未执行该审核，也不报告“首次无错误”。

```json
{
  "input": {
    "path": "goal-1/evidence/t17-acceptance-14/chrome-equity-r11/normal-c16-signed-equity-r94-text-before-import.json",
    "bytes": 1242505,
    "sha256": "5ee2c1fdc5cbb9999edaad1871d677ade51f7aba3f2e2d4571dce5a424d16120",
    "recordedOrigin": "import_buffer",
    "recordedSource": "D09-production-r11-C16-normal-explicit-counterfactual-follow-deadline",
    "recordedMethod": "Public product text buffer/export -> original full-text book DOM in bounded chunks; no geometry, viewport, hidden controller, storage injection or compatibility checks.",
    "origin": "normal",
    "schemaVersion": 13,
    "runId": "normal-deepseek-technical_employee",
    "revision": 94,
    "date": "2025-04-22"
  },
  "saved": {
    "path": "goal-1/evidence/t17-acceptance-14/chrome-equity-r11/normal-equity-explicit-zero-follow-r98.json",
    "bytes": 1319024,
    "sha256": "ec27af701258126ac6526784860cc1b3262cb51ce8d8e73ba0192fa6fccb58b6",
    "recordedOrigin": "product_export",
    "recordedSource": "D09-production-r11-C16-normal-explicit-counterfactual-follow-deadline",
    "recordedMethod": "Recovered existing original public readonly full-save DOM in bounded chunks after tool-kernel timeout. No game command or export-open action repeated; no browser storage/controller access.",
    "origin": "normal",
    "schemaVersion": 13,
    "runId": "normal-deepseek-technical_employee",
    "revision": 98,
    "date": "2025-09-01"
  },
  "original94ReceiptPrefixPreserved": true,
  "newCommands": [
    {
      "commandId": "command-d4c1caba-7008-48f0-9bc9-5d5fe865a806",
      "revisionBefore": 94,
      "actorId": "player",
      "kind": "AdvanceTime",
      "payload": {
        "date": "2025-06-30",
        "phase": "snapshot"
      }
    },
    {
      "commandId": "command-c6216c77-703e-4959-ab3a-ae850cfd9141",
      "revisionBefore": 95,
      "actorId": "player",
      "kind": "AdvanceTime",
      "payload": {
        "date": "2025-07-01",
        "phase": "snapshot"
      }
    },
    {
      "commandId": "command-414f09f2-5200-4176-b819-0220d5c1865a",
      "revisionBefore": 96,
      "actorId": "player",
      "kind": "AdvanceTime",
      "payload": {
        "date": "2025-09-01",
        "phase": "snapshot"
      }
    },
    {
      "commandId": "command-eb170731-e3db-4e6f-a6db-5c7c00123959",
      "revisionBefore": 97,
      "actorId": "player",
      "kind": "FollowEquityRound",
      "payload": {
        "agreementId": "dsk:61a4eaf907b294a94493c01d068b7b39",
        "amountFen": 0
      }
    }
  ],
  "uniqueCommandIds98": 98,
  "onlyFollowDecisionAndDateChangedInAgreements": true,
  "beforeAgreements": [
    {
      "accountId": "personal",
      "acquisitionOperationIds": [
        "dsk:4d91e52aac4613e70073f05aa2897d17"
      ],
      "board": false,
      "businessId": "ops:8576614dfbcb49debc31982710f8f7a6",
      "classification": "counterfactual",
      "costFen": 2000000,
      "disposedBasisFen": 0,
      "disposedShares": 0,
      "followAmountFen": 0,
      "followAt": null,
      "followDecision": null,
      "id": "dsk:61a4eaf907b294a94493c01d068b7b39",
      "information": true,
      "initialCostFen": 2000000,
      "initialShares": 2500,
      "investmentId": "dsk:8a3b337a4fb45bab88eb7a9a57921888",
      "invitationId": "dsk:f14f12aac0739b3c51d9537a261e4947",
      "kind": "new_capital",
      "lockUntil": "2027-04-22",
      "lots": [
        {
          "costFen": 2000000,
          "originId": "dsk:4d91e52aac4613e70073f05aa2897d17",
          "remainingCostFen": 2000000,
          "remainingShares": 2500,
          "shares": 2500
        }
      ],
      "negotiationId": "dsk:2748578ed8ccc7af7a0807e2fa6dac2e",
      "preemptive": true,
      "shares": 2500,
      "signedAt": "2025-04-22",
      "subjectId": "deepseek-counterfactual",
      "termsId": "financial",
      "transferConsent": true
    }
  ],
  "afterAgreements": [
    {
      "accountId": "personal",
      "acquisitionOperationIds": [
        "dsk:4d91e52aac4613e70073f05aa2897d17"
      ],
      "board": false,
      "businessId": "ops:8576614dfbcb49debc31982710f8f7a6",
      "classification": "counterfactual",
      "costFen": 2000000,
      "disposedBasisFen": 0,
      "disposedShares": 0,
      "followAmountFen": 0,
      "followAt": "2025-09-01",
      "followDecision": "declined",
      "id": "dsk:61a4eaf907b294a94493c01d068b7b39",
      "information": true,
      "initialCostFen": 2000000,
      "initialShares": 2500,
      "investmentId": "dsk:8a3b337a4fb45bab88eb7a9a57921888",
      "invitationId": "dsk:f14f12aac0739b3c51d9537a261e4947",
      "kind": "new_capital",
      "lockUntil": "2027-04-22",
      "lots": [
        {
          "costFen": 2000000,
          "originId": "dsk:4d91e52aac4613e70073f05aa2897d17",
          "remainingCostFen": 2000000,
          "remainingShares": 2500,
          "shares": 2500
        }
      ],
      "negotiationId": "dsk:2748578ed8ccc7af7a0807e2fa6dac2e",
      "preemptive": true,
      "shares": 2500,
      "signedAt": "2025-04-22",
      "subjectId": "deepseek-counterfactual",
      "termsId": "financial",
      "transferConsent": true
    }
  ],
  "exportRecoveryObservation": "Game remained saved98; no FollowEquityRound or export-open command repeated. One bounded readonly selector evaluation also timed out; captured text cursor retained and tail read using original public page reader.",
  "exportRecoveryMethod": "Recovered existing original public readonly full-save DOM in bounded chunks after tool-kernel timeout. No game command or export-open action repeated; no browser storage/controller access."
}
```

## 范围与剩余责任

这三组分别提供真实正常开局的隔离事务失败链、原正常NPC日程分支、原正常明确架空零额决定的实际证据。它们不代表全部订单/保存故障、四人物、融资/股权退出或完整游戏验收；不把import_buffer或candidate当新已保存业务。完整Create审核、所有最终源/构建桥接、原PNG/真人0与完整QX继续按主流程处理。没有页面兼容开发/测试。

## 读取时原证据身份

journal/exports为本轮读取时快照，原文方法/错误保留；本报告不宣布各目录封存。

```json
{
  "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/normal-content-original-unsaved-plan-candidate-r2.json": {
    "bytes": 147439,
    "sha256": "9b25197aabc24f32ee110d089c46fdb8902dd242380206e5b90cd75a98b339d0"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/normal-content-original-committed-r1.json": {
    "bytes": 143775,
    "sha256": "3746433bfa15567049f555344ed47cc0d47ceb8905c165c57215d63fd376bf45"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/normal-content-same-candidate-retry-saved-r2.json": {
    "bytes": 147439,
    "sha256": "9b25197aabc24f32ee110d089c46fdb8902dd242380206e5b90cd75a98b339d0"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/normal-content-r2-after-reload.json": {
    "bytes": 147439,
    "sha256": "9b25197aabc24f32ee110d089c46fdb8902dd242380206e5b90cd75a98b339d0"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-physical-r11/independent-physical-old-r1-after-abort.json": {
    "bytes": 143775,
    "sha256": "3746433bfa15567049f555344ed47cc0d47ceb8905c165c57215d63fd376bf45"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-physical-r11/independent-physical-r2-after-original-retry.json": {
    "bytes": 147439,
    "sha256": "9b25197aabc24f32ee110d089c46fdb8902dd242380206e5b90cd75a98b339d0"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-life-npc-r11/normal-c16-npc-offered-r12-text-before-import.json": {
    "bytes": 222704,
    "sha256": "5fd29beaf62409cedc3f61f243614695c92597e909ef884e62f3342898738f12"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-life-npc-r11/normal-npc-own-calendar-not-player-missed-r14.json": {
    "bytes": 231680,
    "sha256": "6fbf7dc29844a8833d6fa651b1533fe30c9159776d9628977e389920416f6835"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-equity-r11/normal-c16-signed-equity-r94-text-before-import.json": {
    "bytes": 1242505,
    "sha256": "5ee2c1fdc5cbb9999edaad1871d677ade51f7aba3f2e2d4571dce5a424d16120"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-equity-r11/normal-equity-explicit-zero-follow-r98.json": {
    "bytes": 1319024,
    "sha256": "ec27af701258126ac6526784860cc1b3262cb51ce8d8e73ba0192fa6fccb58b6"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/exports.jsonl": {
    "bytes": 1905,
    "sha256": "8c526835e6fdbea315758a09ec89b9fe49a363dea2f684d23ddbd535c7a2828c"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/native-progress.jsonl": {
    "bytes": 16292,
    "sha256": "e5b4ba32d53b50890a32fb71829039b2fde9315d5f2f0a1f7191217fed4f33b7"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-physical-r11/exports.jsonl": {
    "bytes": 970,
    "sha256": "e969a85f1ae2bb81a8bb3eb56e544081ecb04acf09becfa3e69773e2f1817836"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-physical-r11/native-progress.jsonl": {
    "bytes": 7048,
    "sha256": "dcf073b1032b01d571ff654915cbadad693d0836f307507252d09b04d1b27daa"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-life-npc-r11/exports.jsonl": {
    "bytes": 973,
    "sha256": "8340c301ef9bcc2a3a146a82a791ecb89e236d4d2abb033080fb797b524a605e"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-life-npc-r11/native-progress.jsonl": {
    "bytes": 9739,
    "sha256": "cd32d99a38a3e6368068bfe13bfac4a86ab760c21d0d1c6351dc80f1811d76e4"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-equity-r11/exports.jsonl": {
    "bytes": 1031,
    "sha256": "75c3ce7f80f5063929071e5d9cccbea86ddd8f97c6661462d04305ccc774fac5"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-equity-r11/native-progress.jsonl": {
    "bytes": 19441,
    "sha256": "2c5ca6d0bf97fe9f9491a02fa9a64d496e5b210969b6b795b8cab406c7bbbc3c"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/real-abort-old-scene-r1.png": {
    "bytes": 48650,
    "sha256": "d1bb6ce7ac0f3898dd9fff950795c121740cb124307f20433a59e46d41392268"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/same-candidate-retry-only-now-plan-r2.png": {
    "bytes": 50522,
    "sha256": "6e5e57d5d0a313d2087ae22cad66881fdd9bbcefb7a73466dcdf0dc0a3602d2d"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-life-npc-r11/npc-own-choice-scene-r14.png": {
    "bytes": 151078,
    "sha256": "0d395eb8b6ff53977310fe3d54cc0bf0dfb3da120676ae7cc58d1738522d47d7"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-equity-r11/equity-explicit-zero-follow-saved-r98.png": {
    "bytes": 50193,
    "sha256": "e335f06bb2c0675e08895986f6c2ace9393241e679c4bf50010b52a10a1d3542"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/real-abort-old-scene-r1-ax.txt": {
    "bytes": 1026,
    "sha256": "2e38f64567210852272cc5df73ccd785a6740be9f697a3759db0620a091a89ca"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/same-candidate-retry-only-now-plan-r2-ax.txt": {
    "bytes": 1580,
    "sha256": "128c654f55a8f2aab521c9394a2b532ec9296be2730c377df809ae768d922716"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-life-npc-r11/npc-own-calendar-not-player-missed-r14-ax.txt": {
    "bytes": 2412,
    "sha256": "b8fbccbc3ab06b724e8d895ddc99eb766be00ff93811a0e64a9ba687e5dffd4f"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-life-npc-r11/npc-own-choice-scene-r14-ax.txt": {
    "bytes": 3302,
    "sha256": "8ed8fde4de94d0a15c042e79bfa13355e1c60e0ba47989558dba62cd17088784"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-equity-r11/equity-explicit-zero-follow-original-preview-r97-ax.txt": {
    "bytes": 1267,
    "sha256": "cb2e18cf82aa06e400fb9b8a91076941ddbe5997f974eb09ef4343d1afff3411"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-equity-r11/equity-explicit-zero-follow-saved-r98-ax.txt": {
    "bytes": 1212,
    "sha256": "405233a2c0f26bf2b2b639820c0b0b65bf69918d82383c9ca551eaba4226a2bb"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-fault-r11/real-abort-old-scene-r1.json": {
    "bytes": 334,
    "sha256": "8a49c9fada9230bea7be5d2fe3c874a74b31399b7152f26f9a251f52def7b94c"
  }
}
```

[杠精审查] 用旧物理/候选/原重试/新物理/reload的字节关系确认保存边界；用NPC原agenda和生活费源解释日程变化；用明确amount0/declined与实际时间区分主动选择和未来defaulted。导出恢复的错误身份不擦除，完整Create未执行不预判。compatibilityDevelopmentTests=0。
