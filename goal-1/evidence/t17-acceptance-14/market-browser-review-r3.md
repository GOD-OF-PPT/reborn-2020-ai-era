# D09 市场/人物实际浏览器证据独立复核 r3

2026-10-21。已逐一读取R8三个实际原文、其命令/账/订单/成交/交收/生活记录，读取完整AX与native-progress日志，并使用view_image实际目检4份PNG（R8市场终场，R5生活准备/邀请，R7兑现）。不只是采集摘要或文件名判断。只新写本报告；没有修改源、运行游戏/测试/浏览器或几何/兼容专项。完整Create重放仍由父后续，原文含CreateRun receipt不等于本报告执行了重放。

## 结论

界面和实际原账相互支持这次正常人生的计划→原提交→买入→可售后卖出→另单部分成交→撤余量→卖款交收，以及此前唐莹活动/接受/实际兑现。旧物理档、重进与只读查询后三份原文全字节相同。足以作为本次特定市场/生活小循环证据，不是所有个股/账户/页面/真人或完整经济矩阵完成。

## 实际原文身份与同字节

normal-market-life-r17-saved.json实际214997B，SHA33aa1a1c57907f1b3cdfa832483f62f9aefb5e923e66ec202d717a6d7c1695c2；origin normal、schema13/rules-t16-journey-v1、2020-01-21 snapshot、revision17。after-reload与独立readonly stored_original两份均实际同bytes/SHA，全字节对比为true，而不是仅同revision。

原runId life-5fedff3b-eda7-46e6-91cc-2b2959ed0085。17个receipt commandId均唯一，9—17市场步骤日期/载荷与实际UI日志一致；没有从工具超时推断必须重做命令。

## 原委托、费用与真实钱流

1. **计划r9与提交r10**：1/8原PlanStockOrder明确个人账户、SIM-AI02、买50、限价2750分、quoteId initial-2020-01-01、validUntil SIM-CP-2020-01-20。原ledger只有一次reserve_cash 138000分（¥1,380），SubmitStockOrder仅move同一个reservationId。实际确认AX明确本季0点、新增预算¥0；日志9/10可花同¥24,120。提交没有第二份资金占用，也没有股票提前成交。
2. **买入r11**：1/10 fills原记录50股×2505分，gross125250分、fee500分。真实现金支付125750分，余预留12250分释放；限价不是成交价，原股lot.availableAt为1/11。
3. **卖单r13与传媒买单r14**：1/11先推进到实际可售日，原卖SIM-AI02 50股限价2250分，期限1/20；另原SIM-AI05买2100股限价1000分、期限1/31，明确不同order与原quote SIM-CP-2020-01-10。传媒原资金预算2102100分，卖单不凭空加现金。
4. **1/20实际撮合r15**：卖50股实际价2499分、gross124950分、卖费500分，形成124450分原卖款应收至1/21；含原买费和价差的实际收益-1300分，没有假称盈利。传媒只成交2000股×896分、gross1792000分、fee1792分，原订单剩100股；真实cash为630458分，尚held100100分，故可花530358分。
5. **撤余量r16**：同1/20唯一CancelStockOrder针对传媒原order，最终status cancelled、remaining100仍记原未成交数、原2000股不撤销。AX实际回响说释放¥1,001、行动1→1、可花¥5,303.58→¥6,304.58；该receipt transactionIds为空，原账没有取消产生的现金交易，真实cash仍630458分。释放是available变化，不是收入或实际现金变多。
6. **真实交收r17**：1/21原settlement.paidAt为1/21，真实settle_market_receivable现金124450分；630458+124450=754908分，PNG/AX均显示可花¥7,549.08、行动1/4、预留0、已保存17。没有把1/20卖出当作现金早到。

原AP支出只有生活活动1、兑现1、市场研究1，共3点，故当前1点；买卖/计划/撤余量未加行动。原传媒position仍2000股、principal1792000分、buyFees1792分；AI02 position.quantity0及其旧成交/成本仍留存。现有原账没有未付债务，不能据此声称已经用“有债样本”证明不清债；已付1月生活记录与2/1原400000分生活义务调度仍在，已兑现promise及原due event也继续保存。

## 数字2输入方式的证据界限

文件market-number2-cancel-only-remainder-r16-ax.txt与实际raw能独立证明取消后的日期、命令和真实资金后果。当前native-progress在r15之后直接记录r16成功回响的“继续选择”，没有独立记下press 2动作；文件名不能替代按键事件本身。

因此本报告把“这次确实只有原Cancel且同日释放”核实成立；数字2的输入来源由主采集工具历史承担，本地这组文件不独立证明当时按下的是键2。无需为补文档重复游戏命令；可另保存已发生的原工具调用来源。数字键源码一卡一主按钮修复是先前源码层结论，不能与本AX拼成额外实测。

## 取消草稿、只读与页序

- 原生产日志r8先打开真实买单确认、返回调整后仍是revision8，随后draftReadback明确quantity50/limitYuan27.50，再选择只预留计划；raw仅有之后一笔PlanStockOrder，无取消确认导致的额外Place。取消没有偷偷提交，原显式数据保留。
- readonly日志真实打开同一r17且save为只读；原完整草稿明确个人、传媒、buy100、限价8.96、原期限1/31。AX显示原readonly/candidate/saving边界不能提交，当前可访问页没有可用提交命令；关闭和原物理导出后仍同214997B/17。这证明本次只读查看没有提交，不外推所有只读状态/所有页面均实测。
- R8未上市实际完整AX的原“给这份判断...”页码是1、共2页；第一可访问页已经出现星野未上市说明、方向与股数/限价/期限，不再沿旧terms切换停在最后页。它明确当前未上市不可提交，没有把本次可用报价范围冒充已知。此结论来自实际AX，不来自几何测量；两页不等于所有操作被裁掉或一次全显示。

## 实际图片目检与人物原记录

- R5生活准备PNG可见唐莹/老友、个人¥200/1点/3日与1/4完成预定；R5邀请PNG实际是1/4、个人¥25,800/3点，接受0点无即时费，后续兑现¥300/1点/3日及期限分别说明。
- R7兑现PNG实际1/7、个人¥25,500/2点，标题答应唐莹的事已做到；没有返还行动、奖励现金或凭空改变权限。r17原文有friend_visit 1/1→1/4、promise_keep 1/4→1/7的completed真job与promise fulfilled；AcceptLifePromise本身无现金transaction，后一次Fulfill才支付30000分。实际费用/日期与PNG一致。
- R8市场PNG确为1/21市场实交收画面而非别的Dialog错帧，金额/日期/AP/保存号与AX及原账一致，原历史selector和完整原册仍可达。R5/R7人物图是其当时生产轮次画面，不改称全部由R8新拍，也不由此宣布真人理解度或趣味性通过。

## 一项可见语义清晰度残项

R8终场首卡视觉大标题是“核对这笔原交收”，正文仍讲原成交/费用/应收，AX按钮实际是“选择一份模拟委托”（源码inactive settlement分支打开新MarketSceneChoice）。玩家看到标题会预期看旧交收，点开却是新交易草稿。资金/数据没有丢失，但它违背操作名称对应实际行为的准则。建议已交收/历史状态的新交易卡独立叫“再写下一份判断/选择新委托”，原交收详情继续由清楚的原册入口承担；不把当前首卡称为已完全清晰。未改冻结源。

## 观察错误保留

生产journal有6条CDP观察超时，后读均已实际出现更高saved revision；原17个receipt唯一、字段与后果一致，日志政策明确不盲重交。这里保留为观察错误，不隐藏成零错误，也不把观测超时误判为游戏进程终止/命令未执行。

本报告未跑完整Create、codec或重新执行任一命令。后续完整历史验证、其它市场/生命周期矩阵、真正候选失败与真人体验保留其责任；兼容开发测试0、M01暂停、原PNG/真人缺口保持。

## 实际原文提取事实

```json
{
  "identity": {
    "runId": "life-5fedff3b-eda7-46e6-91cc-2b2959ed0085",
    "origin": "normal",
    "schemaVersion": 13,
    "rulesVersion": "rules-t16-journey-v1",
    "contentHash": "d2cb24af0ffcad3a172e28e0a6cf6612feb383e9c60db597f9491772d338530a",
    "date": "2020-01-21",
    "revision": 17
  },
  "byteEquality": [
    {
      "path": "chrome-production-r8/normal-market-life-r17-after-reload.json",
      "bytesEqualToSaved": true
    },
    {
      "path": "chrome-readonly-r8/independent-physical-readonly-r17.json",
      "bytesEqualToSaved": true
    }
  ],
  "plan": {
    "orderId": "market:435d8628a188582c0dd0daddda3ead59",
    "reservationId": "market:5cae093947a5f462b09a0cfd77ad4e5d",
    "originalReserveCount": 1,
    "originalReserveFen": 138000,
    "moveSameReservationCount": 1
  },
  "cancel": {
    "revision": 16,
    "date": "2020-01-20",
    "orderId": "market:58b15b93e7a1792fe3017b864fa8b5dc",
    "transactionIds": [],
    "record": {
      "accountId": "personal",
      "eligibleIndex": 1,
      "expiresIndex": 2,
      "feesPaidFen": 1792,
      "grossFilledFen": 1792000,
      "id": "market:58b15b93e7a1792fe3017b864fa8b5dc",
      "limitPriceFen": 1000,
      "oddLot": false,
      "quantity": 2100,
      "quoteId": "SIM-CP-2020-01-10",
      "reason": "PLAYER_CANCELLED",
      "remaining": 100,
      "replacesId": null,
      "reservationId": "market:82192bef9b3c1d76b1affa838554224f",
      "ruleId": "SIM-R5",
      "sequence": 3,
      "side": "buy",
      "status": "cancelled",
      "submittedAt": "2020-01-11",
      "symbol": "SIM-AI05"
    }
  },
  "fills": [
    {
      "checkpointId": "SIM-CP-2020-01-10",
      "date": "2020-01-10",
      "feeFen": 500,
      "grossFen": 125250,
      "id": "market:58a0e120af68e236ee379fb58dc9c8bd",
      "ledgerId": "market:58a0e120af68e236ee379fb58dc9c8bd",
      "orderId": "market:435d8628a188582c0dd0daddda3ead59",
      "priceFen": 2505,
      "quantity": 50,
      "realizedProfitFen": null,
      "receivableId": null,
      "removedBuyFeesFen": 0,
      "removedPrincipalFen": 0
    },
    {
      "checkpointId": "SIM-CP-2020-01-20",
      "date": "2020-01-20",
      "feeFen": 500,
      "grossFen": 124950,
      "id": "market:44c1d5c5069e2866357300a650c9f803",
      "ledgerId": "market:44c1d5c5069e2866357300a650c9f803",
      "orderId": "market:73d9e2d0b7760e1d1e351d6583171982",
      "priceFen": 2499,
      "quantity": 50,
      "realizedProfitFen": -1300,
      "receivableId": "market:bde76013e6f20e4ece81c2ab0be0a8df",
      "removedBuyFeesFen": 500,
      "removedPrincipalFen": 125250
    },
    {
      "checkpointId": "SIM-CP-2020-01-20",
      "date": "2020-01-20",
      "feeFen": 1792,
      "grossFen": 1792000,
      "id": "market:3116a82319183ee737ccc7420a969e2f",
      "ledgerId": "market:3116a82319183ee737ccc7420a969e2f",
      "orderId": "market:58b15b93e7a1792fe3017b864fa8b5dc",
      "priceFen": 896,
      "quantity": 2000,
      "realizedProfitFen": null,
      "receivableId": null,
      "removedBuyFeesFen": 0,
      "removedPrincipalFen": 0
    }
  ],
  "settlements": [
    {
      "accountId": "personal",
      "amountFen": 124450,
      "dueAt": "2020-01-21",
      "id": "market:bde76013e6f20e4ece81c2ab0be0a8df",
      "kind": "sale",
      "paidAt": "2020-01-21",
      "sourceId": "market:44c1d5c5069e2866357300a650c9f803",
      "symbol": "SIM-AI02"
    }
  ],
  "retainedPositions": [
    {
      "accountId": "personal",
      "buyFeesFen": 1792,
      "id": "market:ff9596206eaa88820fdb0deee4b87207",
      "lastMarkIndex": 1,
      "lots": [
        {
          "availableAt": "2020-01-21",
          "id": "market:3116a82319183ee737ccc7420a969e2f",
          "quantity": 2000
        }
      ],
      "principalFen": 1792000,
      "quantity": 2000,
      "symbol": "SIM-AI05"
    }
  ],
  "finalPersonalCashFen": 754908,
  "completedActionPoints": 3,
  "unpaidObligations": [],
  "retainedNextLivingExpense": {
    "date": "2020-02-01",
    "instanceId": "living:2020-02-01",
    "payload": {
      "accountId": "personal",
      "amountFen": 400000,
      "counterpartyId": "world",
      "date": "2020-02-01",
      "id": "living:2020-02-01",
      "kind": "due_expense",
      "obligationId": "living-due:2020-02-01",
      "sourceEventId": "bootstrap:living"
    },
    "phase": "due_obligations",
    "priority": 0
  },
  "uniqueReceiptCommandIds": 17,
  "receipts": 17,
  "journalObservationErrors": [
    {
      "row": 14,
      "action": "就这样决定 →",
      "beforeSave": "已保存，第8次提交",
      "afterSave": "已保存，第9次提交",
      "error": "Error: Error: Timed out after 2896ms waiting for CDP command Input.dispatchMouseEvent.\nwaiting on click for selector dialog[open] >> nth=-1 >> internal:role=button[name=\"就这样决定 →\"s]\nLocator diagnostics: {\"kind\":\"no_matches\",\"action\":\"click\",\"locator\":\"dialog[open] >> nth=-1 >> internal:role=button[name=\\\"就这样决定 →\\\"s]\",\"matchCount\":0,\"matches\":[],\"visibleCount\":0,\"truncated\":false}"
    },
    {
      "row": 17,
      "action": "就这样决定 →",
      "beforeSave": "已保存，第9次提交",
      "afterSave": "已保存，第10次提交",
      "error": "Error: Error: Timed out after 2880ms waiting for CDP command Input.dispatchMouseEvent.\nwaiting on click for selector dialog[open] >> nth=-1 >> internal:role=button[name=\"就这样决定 →\"s]\nLocator diagnostics: {\"kind\":\"no_matches\",\"action\":\"click\",\"locator\":\"dialog[open] >> nth=-1 >> internal:role=button[name=\\\"就这样决定 →\\\"s]\",\"matchCount\":0,\"matches\":[],\"visibleCount\":0,\"truncated\":false}"
    },
    {
      "row": 21,
      "action": "推进到所选日期",
      "beforeSave": "已保存，第11次提交",
      "afterSave": "已保存，第12次提交",
      "error": "Error: Error: Timed out after 2968ms waiting for CDP command Input.dispatchMouseEvent.\nwaiting on click for selector dialog[open] >> nth=-1 >> internal:role=button[name=\"推进到所选日期\"s]\nLocator diagnostics: {\"kind\":\"no_matches\",\"action\":\"click\",\"locator\":\"dialog[open] >> nth=-1 >> internal:role=button[name=\\\"推进到所选日期\\\"s]\",\"matchCount\":0,\"matches\":[],\"visibleCount\":0,\"truncated\":false}"
    },
    {
      "row": 28,
      "action": "就这样决定 →",
      "beforeSave": "已保存，第12次提交",
      "afterSave": "已保存，第13次提交",
      "error": "Error: Error: Timed out after 2880ms waiting for CDP command Input.dispatchMouseEvent.\nwaiting on click for selector dialog[open] >> nth=-1 >> internal:role=button[name=\"就这样决定 →\"s]\nLocator diagnostics: {\"kind\":\"no_matches\",\"action\":\"click\",\"locator\":\"dialog[open] >> nth=-1 >> internal:role=button[name=\\\"就这样决定 →\\\"s]\",\"matchCount\":0,\"matches\":[],\"visibleCount\":0,\"truncated\":false}"
    },
    {
      "row": 36,
      "action": "等这份委托的下一次撮合 · 2020-01-20",
      "beforeSave": "已保存，第14次提交",
      "afterSave": "已保存，第15次提交",
      "error": "Error: Error: Timed out after 2970ms waiting for CDP command Input.dispatchMouseEvent.\nwaiting on click for selector internal:role=button[name=\"等这份委托的下一次撮合 · 2020-01-20\"s]\nLocator diagnostics: {\"kind\":\"no_matches\",\"action\":\"click\",\"locator\":\"internal:role=button[name=\\\"等这份委托的下一次撮合 · 2020-01-20\\\"s]\",\"matchCount\":0,\"matches\":[],\"visibleCount\":0,\"truncated\":false}"
    },
    {
      "row": 38,
      "action": "等这笔原款交收 · 2020-01-21",
      "beforeSave": "已保存，第16次提交",
      "afterSave": "已保存，第17次提交",
      "error": "Error: Error: Timed out after 2960ms waiting for CDP command Input.dispatchMouseEvent.\nwaiting on click for selector internal:role=button[name=\"等这笔原款交收 · 2020-01-21\"s]\nLocator diagnostics: {\"kind\":\"no_matches\",\"action\":\"click\",\"locator\":\"internal:role=button[name=\\\"等这笔原款交收 · 2020-01-21\\\"s]\",\"matchCount\":0,\"matches\":[],\"visibleCount\":0,\"truncated\":false}"
    }
  ],
  "cancelledDraftReadback": {
    "quantity": "50",
    "limitYuan": "27.50"
  }
}
```

## 实际读取/目检文件索引

```json
[
  {
    "path": "chrome-production-r8/normal-market-life-r17-saved.json",
    "bytes": 214997,
    "sha256": "33aa1a1c57907f1b3cdfa832483f62f9aefb5e923e66ec202d717a6d7c1695c2"
  },
  {
    "path": "chrome-production-r8/normal-market-life-r17-after-reload.json",
    "bytes": 214997,
    "sha256": "33aa1a1c57907f1b3cdfa832483f62f9aefb5e923e66ec202d717a6d7c1695c2"
  },
  {
    "path": "chrome-readonly-r8/independent-physical-readonly-r17.json",
    "bytes": 214997,
    "sha256": "33aa1a1c57907f1b3cdfa832483f62f9aefb5e923e66ec202d717a6d7c1695c2"
  },
  {
    "path": "chrome-production-r8/market-real-settlement-r17.png",
    "bytes": 144829,
    "sha256": "7d4534f6da54c18d80bf0dfdb17d69014469603560c2dc17f6f8985c57369b00"
  },
  {
    "path": "chrome-production-r8/market-submit-plan-zero-new-hold-r9-ax.txt",
    "bytes": 1858,
    "sha256": "f63bdd66fc3c414a6ad796f753a8429f6cc5fd6c8b86c42e0cbe49c96e0ea3f4"
  },
  {
    "path": "chrome-production-r8/market-number2-cancel-only-remainder-r16-ax.txt",
    "bytes": 1543,
    "sha256": "7729b8a0585a9b29ad585079942f68538cb399f15d13283d3225b6a1ad64b936"
  },
  {
    "path": "chrome-production-r8/market-sale-not-yet-cash-r16-ax.txt",
    "bytes": 2854,
    "sha256": "e01ed954ed915e7d95ba95cd0c51f24e8d71a6c4c67a144738d40a45bb868598"
  },
  {
    "path": "chrome-production-r8/market-real-settlement-r17-ax.txt",
    "bytes": 2951,
    "sha256": "0ebd097066aadc2d52d6450ed239c6f51a2ab7b705b96f5bcf561d29a6ca3f5d"
  },
  {
    "path": "chrome-production-r8/market-unlisted-correct-first-page-ax.txt",
    "bytes": 7336,
    "sha256": "e7588efdf247b3a61935e3ba30666a09abc4e508bf44fedef302bf823aa36945"
  },
  {
    "path": "chrome-readonly-r8/complete-draft-readonly-disabled-r17-ax.txt",
    "bytes": 7196,
    "sha256": "218b37daf3bd6ee57d2a0ded5fc2c3558460c5205458d76e9cae9f1d1b823a0e"
  },
  {
    "path": "chrome-production-r8/native-progress.jsonl",
    "bytes": 31310,
    "sha256": "d16a124940a3104d847b6f6e59c7d76f22c52cb95131bba34d096b2b2ce05e0c"
  },
  {
    "path": "chrome-readonly-r8/native-progress.jsonl",
    "bytes": 6862,
    "sha256": "ab4e19792cfe4ffc7f73e6490b412c3035008e1bf14796bfb72352fedec0f420"
  },
  {
    "path": "chrome-production-r5/life-ready-r1.png",
    "bytes": 143150,
    "sha256": "1aa7234a7667cb53b1dc93148c26f16ab571c90769defd044742b679d9fd66d3"
  },
  {
    "path": "chrome-production-r5/life-invitation-r3-first-frame.png",
    "bytes": 149882,
    "sha256": "0411bd464c1a3693fbef7c14b05eb8fdfaf7f960ae0508e0afc6597fa805010b"
  },
  {
    "path": "chrome-production-r7/life-fulfilled-r6.png",
    "bytes": 148622,
    "sha256": "ee6af9948997eb553120ab5d36a943b4fb9c4f2ebbefbf9df360a444ef58e5ca"
  }
]
```
