# D08 实际画面与功能证据独立复核 r1

2026-10-21。已使用view_image逐张实际目检下列10份PNG，并读取相应AX、动作摘要、exports.jsonl及实际raw字节；仅新写本报告，未控制浏览器、运行测试/完整Create审计或兼容专项，未改源或旧证据。不是按文件名推断画面。

## 结论与范围

实际首单画面和操作证据支持本轮确实改善了“现在发生什么、能做什么、代价多少、等到何日、真实结果是什么”：它把默认房间的多重导航改成具体请求与原动作，等待、完成、亲手交付、到账有可区分的状态，关键结果默认可见。供应回信和0AP旧责任也有真实实例。只覆盖这些已取证状态，不证明全部24季五路线已同等清晰，更不证明真人已觉得好玩。

## 同状态前后与实景阅读

- **旧r1→新r1**：旧图同时有四热点、右上胶片、底部四念头及安排/推进按钮，主要语义是“去另一个页面”；新图同一2020-01-01/¥26,000/4AP直接出现客户¥1,300报价、¥500制作费、1AP与1/5—1/19日期，主选“接下手工单”、另选工作并明确可以一起安排。原r1与新导入buffer原文143782B字节相同，故不是更换有利状态的伪前后。
- **完成r5**：PNG和完整AX均显示1/19、¥25,500、1AP，标题“短片做好了，要发给客户吗”，默认结果说“作品已做完，下一步亲手交客户”，主按钮为原SubmitDelivery；画面没有声称已经回款。
- **到账r7**：PNG/AX显示1/20、¥26,800、1AP，默认回响明确实际付¥1,300、成本¥500、净得¥800；原记录入口与去其他可能仍可到达。阶段之间的区别是实际状态与操作不同，不仅换标题颜色。
- **自由探索r7**：新图将四热点放到明确探索模式，保留返回当前事项；五路线完整AX含A股/视频/课程/中转/DeepSeek全部选择，原日历完整AX仍有旧义务入口。探索后的原文与探索前197562B全部字节相同，重进后物理原档也同字节。

## 失败、只读与原候选

- 失败图实际是未保存处理Dialog，说明旧提交完整、可以重试/导出；失败完整AX同时保留旧1/19、¥25,500/r6的“等客户回信”场景，两种推进都disabled，没有提前出现r7收入回响。只读AX亦保留旧r6、禁用等待但允许纯探索。
- 导出实际物理r6为187900B，SHA bf4f1e097cb0feed92802abd8cd266b67401436742fa37272870314bb7ba980e，date1/19、contract review、6receipts；候选为197562B，SHA c6227a6383115265ca8a0c72c9faed1953bb2ece8ab0c5963fedacb34740deb1，date1/20、contract settled、7receipts。
- 重试后AX才出现r7已保存/实际到账；候选、重试导出与独立物理r7三份实际字节完全一致。支持这次真实原候选被保存，没有用新候选替换。未在此独立重跑Create历史，不能由字节相同扩大证明所有核心规则。

## 后期0AP取证纠错

- **排除旧错帧**：late-zero-ap-next-responsibility-r105.png实际是“本机存档与备份”的同人生恢复确认Dialog，3/03页；不能作为0AP房间画面。原件没有覆盖。其同名完整AX的确描述0AP房间，但图/AX非同一瞬间，不能合并声称一次正确截图。
- **补图已独立目检**：late-room-r105-corrected-dev-r12.png真实显示2025-03-08、¥204,000、0AP、“这期已经留下记录，原账还没有收好”与可用查看原事项主按钮，说明未到期款不能提前取、支持/原账仍在。来源按文件名和主控记录是当前DEV R12，目录旧名chrome-late-r10保留，不能改称R10生产。
- 免费下一步的动作摘要声明0游戏命令；导入r105 buffer与之后stored_original实际2856590B字节相同，SHA478f312b634050e97dd87900f2e8c6d1e6a238af18426faa75c0fa35b5b1f4f9。支持原事项查看没有改变钱/日期/AP，不证明此时执行过后续服务或完整关闭。

## 免费供应回信的实际结果

- r71未读PNG实际显示2024-10-09、¥224,000、3AP；说明原申请完成但尚不替对方宣布批准/拒绝，主按钮“阅读这份供应审查结果”，辅文明确不额外耗费行动。
- r72结果PNG实际写杉木直供（虚构）本局许可获准、有效至2025-10-10，实际适配/启用条件仍另核；日期未变，AP3→3、个人可花¥224,000→¥224,000。动作日志只见一次阅读→保存72，不是自动领取或付费读信。
- 实际r71→r72原档对照：date相同、economy整个对象相同、同一application read false→true、receipt71→72，最后receipt为ReadRelaySupplyDecision。读取是免费但真实保存动作，不能称为没有revision变化的纯只读。
- **AX限制**：本目录unread/read/post-read三个AX文件为CUA“no change”或少量diff，不是完整树；post-read-technical-notice-r72-ax.txt也没有实际保留技术notice字面。此处主要凭两份PNG、原文及动作日志作有限结论，不把compact AX说成完整文案证据。

## R12文案源码评审

当前game-text.ts仅新增中转ReadRelaySupplyDecision的窄中文映射，以及中转/视频/课程原技术notice的通用中文回退；没有改核心命令、金额、日期、权限或保存状态。读信映射只说回信已读、原许可和下一步条件在原册，没有凭notice宣布批准。此处已读源码diff，但未运行R12检查，也尚未用本审查看到R12生产读信后完整中文画面；保留来源分层。game-text.ts读取SHA a30408b3f6fc7fc37eca469ea53559878b799a9006b3795500d7edf7fdc82bff。

## 后续美术与理解度仍值得推进

1. 完成/到账截图的深绿主按钮辅文目检偏暗，主标题可读，但次级说明不如初始金色按钮清楚；可继续统一其可读性，不能只因AX含字就认定玩家看得清。
2. 关键回响目前有日期连续重复（外层date与结果text均含日期），右侧随身入口标签仍小；可继续简化阅读节奏，保持真实日期/原入口。
3. 物件场景目前以同一住处承载多个经营阶段。已改变交互重心，但后期人物/客户身份、阶段物件和因果画面仍可扩展；不能据本轮称全游戏已完成美术重构。

真人理解度与趣味性样本0，原PNG缺口、5c-P1暂停及完整核心/例行/风险矩阵继续保留；本次兼容开发测试0。当前全文Create独立审核尚未由本报告执行或读取终态，不可将图片/元数据校验当作它已通过。

## 实际导出元数据核对

{
  "allMetadataMatch": true,
  "count": 14,
  "comparisons": [
    {
      "pair": [
        "chrome-before-r1/same-normal-r1-before.json",
        "chrome-production-r10/same-normal-r1-production-import-text-before-import.json"
      ],
      "bytesEqual": true
    },
    {
      "pair": [
        "chrome-production-r10/r7-production-first-loop-saved.json",
        "chrome-production-r10/r7-after-free-exploration.json"
      ],
      "bytesEqual": true
    },
    {
      "pair": [
        "chrome-production-r10/r7-production-first-loop-saved.json",
        "chrome-production-r10/r7-after-real-reload-physical.json"
      ],
      "bytesEqual": true
    },
    {
      "pair": [
        "chrome-fault-r7/r7-income-candidate.json",
        "chrome-fault-r7/r7-original-candidate-retried.json"
      ],
      "bytesEqual": true
    },
    {
      "pair": [
        "chrome-fault-r7/r7-income-candidate.json",
        "chrome-fault-r7/r7-physical-after-original-retry.json"
      ],
      "bytesEqual": true
    },
    {
      "pair": [
        "chrome-late-r10/late-normal-r105-public-input-text-before-import.json",
        "chrome-late-r10/r105-after-free-next-step.json"
      ],
      "bytesEqual": true
    }
  ],
  "supplier": {
    "revision": [
      71,
      72
    ],
    "dates": [
      "2024-10-09",
      "2024-10-09"
    ],
    "economyEqual": true,
    "readBefore": false,
    "readAfter": true,
    "lastReceiptKind": "ReadRelaySupplyDecision",
    "receipts": [
      71,
      72
    ]
  }
}

## 已逐张目检图片的字节身份

[
  {
    "path": "chrome-before-r1/same-normal-r1-before.png",
    "bytes": 165368,
    "sha256": "386855859ffe663cf7523f9e9e0427a6289e61e813720389b94c7dbd103d951d",
    "actuallyViewed": true
  },
  {
    "path": "chrome-production-r10/final-same-normal-r1.png",
    "bytes": 121920,
    "sha256": "6c15491c0e7995b990051e3eaedf0bfa63bf21f09e188a0b6ad17bc254b54d12",
    "actuallyViewed": true
  },
  {
    "path": "chrome-production-r10/actual-completion-r5.png",
    "bytes": 114762,
    "sha256": "b325d667baa7b6b28bb37fcf1106eb24ec2f360e87a80be91d284d6e50a65cbf",
    "actuallyViewed": true
  },
  {
    "path": "chrome-production-r10/real-cash-r7.png",
    "bytes": 115766,
    "sha256": "020663eec0511ffe12e8338ad8a9ca9652b42992ca706039895a69ebb43dbad1",
    "actuallyViewed": true
  },
  {
    "path": "chrome-production-r10/free-explore-r7.png",
    "bytes": 166459,
    "sha256": "c374a12904001929068373b1034008b221aac69293260dc3e60ae3bb1fa39141",
    "actuallyViewed": true
  },
  {
    "path": "chrome-fault-r7/income-abort-old-room-r6.png",
    "bytes": 45666,
    "sha256": "03dcef17d45fe86920a2dfacb4f76eb90fb2921961dd902e6d5c8b6439383c84",
    "actuallyViewed": true
  },
  {
    "path": "chrome-late-r10/late-zero-ap-next-responsibility-r105.png",
    "bytes": 39889,
    "sha256": "8973d8166a95af39016161fb5767171c4233d9eac6e735576ccfe9276054b7ae",
    "actuallyViewed": true
  },
  {
    "path": "chrome-late-r10/late-room-r105-corrected-dev-r12.png",
    "bytes": 129188,
    "sha256": "5ad097845dd039a6a9b5ceb3644ae6a5f9a01459a0fc0ef47a70b79028204220",
    "actuallyViewed": true
  },
  {
    "path": "chrome-production-r11/unread-supplier-r71.png",
    "bytes": 124486,
    "sha256": "1bda3f60895dc98d2ba0985eca5126ff1c6f41c31ce4a935625ad6682b548c2e",
    "actuallyViewed": true
  },
  {
    "path": "chrome-production-r11/read-supplier-saved-r72.png",
    "bytes": 52184,
    "sha256": "a25c57746d6c331a840734fd9dfecc002693ca2e16ec6f1044091c6afc0b799c",
    "actuallyViewed": true
  }
]

## 实际导出读取索引

[
  {
    "path": "chrome-before-r1/same-normal-r1-before.json",
    "origin": "product_export",
    "source": "immutable-production-relay-r12-before-D08",
    "bytes": 143782,
    "sha256": "c1008e6271ed0d87153ef87869a0f662a0a73c79f42d4ef1fded0914c04cee9b",
    "revision": 1,
    "date": "2020-01-01",
    "metadataMatches": true
  },
  {
    "path": "chrome-production-r10/same-normal-r1-production-import-text-before-import.json",
    "origin": "import_buffer",
    "source": "D08-final-production-r10-frozen372",
    "bytes": 143782,
    "sha256": "c1008e6271ed0d87153ef87869a0f662a0a73c79f42d4ef1fded0914c04cee9b",
    "revision": 1,
    "date": "2020-01-01",
    "metadataMatches": true
  },
  {
    "path": "chrome-production-r10/r7-production-first-loop-saved.json",
    "origin": "product_export",
    "source": "D08-final-production-r10-frozen372",
    "bytes": 197562,
    "sha256": "0b41e3515a06c96c589344e1e68c5fca206de32b455744afb94584007823ec1a",
    "revision": 7,
    "date": "2020-01-20",
    "metadataMatches": true
  },
  {
    "path": "chrome-production-r10/r7-after-free-exploration.json",
    "origin": "product_export",
    "source": "D08-final-production-r10-frozen372",
    "bytes": 197562,
    "sha256": "0b41e3515a06c96c589344e1e68c5fca206de32b455744afb94584007823ec1a",
    "revision": 7,
    "date": "2020-01-20",
    "metadataMatches": true
  },
  {
    "path": "chrome-production-r10/r7-after-real-reload-physical.json",
    "origin": "stored_original",
    "source": "D08-final-production-r10-frozen372",
    "bytes": 197562,
    "sha256": "0b41e3515a06c96c589344e1e68c5fca206de32b455744afb94584007823ec1a",
    "revision": 7,
    "date": "2020-01-20",
    "metadataMatches": true
  },
  {
    "path": "chrome-fault-r7/same-normal-r1-fault-import-text-before-import.json",
    "origin": "import_buffer",
    "source": "D08-r7-existing-income-abort-isolated-native-product",
    "bytes": 143782,
    "sha256": "c1008e6271ed0d87153ef87869a0f662a0a73c79f42d4ef1fded0914c04cee9b",
    "revision": 1,
    "date": "2020-01-01",
    "metadataMatches": true
  },
  {
    "path": "chrome-fault-r7/r7-income-candidate.json",
    "origin": "candidate",
    "source": "D08-r7-existing-income-abort-isolated-native-product",
    "bytes": 197562,
    "sha256": "c6227a6383115265ca8a0c72c9faed1953bb2ece8ab0c5963fedacb34740deb1",
    "revision": 7,
    "date": "2020-01-20",
    "metadataMatches": true
  },
  {
    "path": "chrome-fault-r7/r6-physical-before-income-retry.json",
    "origin": "stored_original",
    "source": "D08-r7-independent-physical-read-original-product",
    "bytes": 187900,
    "sha256": "bf4f1e097cb0feed92802abd8cd266b67401436742fa37272870314bb7ba980e",
    "revision": 6,
    "date": "2020-01-19",
    "metadataMatches": true
  },
  {
    "path": "chrome-fault-r7/r7-original-candidate-retried.json",
    "origin": "product_export",
    "source": "D08-r7-existing-income-abort-isolated-native-product",
    "bytes": 197562,
    "sha256": "c6227a6383115265ca8a0c72c9faed1953bb2ece8ab0c5963fedacb34740deb1",
    "revision": 7,
    "date": "2020-01-20",
    "metadataMatches": true
  },
  {
    "path": "chrome-fault-r7/r7-physical-after-original-retry.json",
    "origin": "stored_original",
    "source": "D08-r7-independent-physical-read-original-product",
    "bytes": 197562,
    "sha256": "c6227a6383115265ca8a0c72c9faed1953bb2ece8ab0c5963fedacb34740deb1",
    "revision": 7,
    "date": "2020-01-20",
    "metadataMatches": true
  },
  {
    "path": "chrome-late-r10/late-normal-r105-public-input-text-before-import.json",
    "origin": "import_buffer",
    "source": "D08-r10-dev-inspection-only-late-normal-r105-public-context",
    "bytes": 2856590,
    "sha256": "478f312b634050e97dd87900f2e8c6d1e6a238af18426faa75c0fa35b5b1f4f9",
    "revision": 105,
    "date": "2025-03-08",
    "metadataMatches": true
  },
  {
    "path": "chrome-late-r10/r105-after-free-next-step.json",
    "origin": "stored_original",
    "source": "D08-r10-dev-inspection-only-late-normal-r105-public-context",
    "bytes": 2856590,
    "sha256": "478f312b634050e97dd87900f2e8c6d1e6a238af18426faa75c0fa35b5b1f4f9",
    "revision": 105,
    "date": "2025-03-08",
    "metadataMatches": true
  },
  {
    "path": "chrome-production-r11/normal-r71-unread-supplier-text-before-import.json",
    "origin": "import_buffer",
    "source": "D08-final-production-r11-frozen373",
    "bytes": 1029860,
    "sha256": "7722fcc9cacd7e09ca5e546abb1c42d1c6440aaa559e41a281facb86cafb3ddb",
    "revision": 71,
    "date": "2024-10-09",
    "metadataMatches": true
  },
  {
    "path": "chrome-production-r11/r72-free-supplier-read-saved.json",
    "origin": "stored_original",
    "source": "D08-final-production-r11-frozen373",
    "bytes": 1031478,
    "sha256": "f640daeefe06c9c35278e3e822d4286cc9a8f3809d837ea941625b6f688691d0",
    "revision": 72,
    "date": "2024-10-09",
    "metadataMatches": true
  }
]
