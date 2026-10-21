# D08 交互重构独立源码复核 r4

2026-10-21。本次只读检查R11新增房间直办原视频/中转命令、已完成未读供应回信及相连原guard/公开结果。仅新写本报告，R1—R3原报告保留；不改源码/计划/输入，不运行测试、类型、构建或浏览器，兼容开发测试0。未把主控前一轮R10结果当作R11已通过。

## 定向结论

在本报告列明15项读取快照的范围内，未发现新的可证明缺陷。房间直办复用原helper给出的命令与confirm，没有自行拼接供应批准、额外付款、客户回款或视频使用权。完整后期组合和实际浏览器结果仍须另验，不能由源码结论外推。

## 新直办连接

- RoomMoment pending依旧只选原公开有效事项；先pause、有效风险、必需交付和首单阶段，再实际sceneWorks及经营pending，旧首单paid回顾和可选Work仍在后。
- video/relay helper若提供command，房间逐项保留kind、payload、原choice.label和confirm；若没有command（包括course、audit需玩家选资源日期等），继续只navigate检查原事项。没有用通用按钮跳过资源/日期/权限选择。
- CommandButton接收confirm=moment.command.confirm??true，保持原StartFirstOrder/SubmitDelivery/WorkQuarter的确认；原free read/review明确false，不被房间硬改为付费承诺。真正执行仍经journeyIntent、controller.preview、App request/prepare和原submit。
- 原Confirm=true的CollectRelayDue/CorrectRelayPeriod/SubmitVideoCommission继续核对原客户/款项或已揭示记录；原Confirm=false的ReadRelaySupplyDecision/ReviewVideoOutput为原免费动作。App仍会在preview真实AP或费用大于0时要求确认，false没有架空费用预览。

## 供应回信的公开边界

- 新pending gate增加!a.read且job.status completed；最终relaySceneProgress仍限定同业务、job.completeAt<=当前date、已完成未读，输出原ReadRelaySupplyDecision/applicationId，不直接读取批准结论。
- helper回信前文案明确尚不宣布批准/拒绝，房间不读approved、factId或隐藏供应资料；原核心Read仅在真实决定ready时允许，并由原revealFact记录。它没有新加AI/代理扩权或替玩家接受充值/合同。
- 房间免费动作的辅文为“阅读与核对，不额外耗费行动”；kind和原label明确阅读结果，没有伪装成开服务或免费盈利。回信本身仍是一项真实保存命令，revision变化不能称为只读无提交；旁边翻资料则不提交。
- r71新增单测确实从原正常输入raw导入，先断言公开approved为null，取roomMoment的原command，再用Controller提交，检查read=true及accounts/budget完全等于前态。这是源码中的合理实际路径，不是本审查亲跑结果。

## 安全与回退事项

- candidate/readOnly/busy/conflict仍由原CommandButton禁用；App unsaved/conflict清空成功回响，saved才生成当前runId/revision回响。没有新存储写入捷径或重新抽取候选结果。
- 直办条件不读取actualUnits/隐藏profile/未来报价；更正仅使用helper对auditedUnits已公开且待corrected的判断，核心仍复核原审计依据。
- 数字键isComposing保护、唯一成功SceneEcho、非互斥工作+小单、后期有效风险优先及完整五路线/原日历/mandatory入口保持R3修复。
- runner新增r71原raw纳入reference freeze，要求普通原文件、真实字节hash及检查后不变；原r105与signal输入也仍在freeze。runner仍按注册准确文件集合核实Vitest报告，不把命令启动视为通过。未执行此runner。

## 证据范围

本报告只证明上述源码检查结果，不证明R11检查已绿、完整业务矩阵、实际当前Chrome视觉或真人易懂/好玩。公开研究非实机竞品试玩；真人0、原PNG缺口、5c-P1暂停而非cancel/完成、M01兼容暂停与后期未验项继续保留。

## 源码/输入读取快照

```json
[
  {
    "path": "src/ui/RoomMoment.tsx",
    "bytes": 12972,
    "sha256": "0013c8030540c251fce85fabbf3e05d404ddabd853d8679b830dd722835b02d3"
  },
  {
    "path": "src/ui/RoomMoment.test.tsx",
    "bytes": 10636,
    "sha256": "93b033a7655619d01da4ddf465e981ea61dc55e051420d0f1c8f9b2804476dfd"
  },
  {
    "path": "src/ui/relay-scene-progress.ts",
    "bytes": 18713,
    "sha256": "9f958d7f989e6a4d4cd488f06a7b3fdcb402bde5310b91fe042ba2857a4128cb"
  },
  {
    "path": "src/ui/video-scene-progress.ts",
    "bytes": 7763,
    "sha256": "9ea48d9b924c2c7eca8453086d60f490aa258be309bb844c33b92a83cc1c187f"
  },
  {
    "path": "src/ui/course-scene-progress.ts",
    "bytes": 13060,
    "sha256": "78af8caf330148f483b627fc5932ed54550527ac82bb2da49068ceaf758f4cc9"
  },
  {
    "path": "src/ui/story-scene-progress.ts",
    "bytes": 7526,
    "sha256": "258aae290532959c6b6cb270dcafc24a1c7d5fdbe7c378c35a4f9ac876e20a36"
  },
  {
    "path": "src/ui/CommandButton.tsx",
    "bytes": 1313,
    "sha256": "17fa2e2799afb252392afb2fa10e3253023c1b5f2a5f77e079c3ea783eeebf43"
  },
  {
    "path": "src/ui/journey-intent.ts",
    "bytes": 690,
    "sha256": "56b17701afa7df5a779ca2e4293edc2bc8c969a57126da85f8e2228fe8e984dc"
  },
  {
    "path": "src/ui/App.tsx",
    "bytes": 28364,
    "sha256": "f1e35804b73813b46fdc7e7253d0bd42894f665a1a36f56e708dc430bef58c77"
  },
  {
    "path": "src/ui/scene-result.ts",
    "bytes": 10267,
    "sha256": "ca76b8d5e1c26f2168bc02f1a786d27a56fc88d6da2df19e433f5760aac83be8"
  },
  {
    "path": "src/ui/CinematicRoom.tsx",
    "bytes": 11826,
    "sha256": "bbace9b6025078a3c3eda651c26237fece5353037ce93f0f18e14ac084ceaec7"
  },
  {
    "path": "src/core/relay.ts",
    "bytes": 55502,
    "sha256": "979ee69da37af324b422313d2665f9d98b38a601919b095e2513a2ba6e269a72"
  },
  {
    "path": "src/core/video.ts",
    "bytes": 44191,
    "sha256": "e97153ba3615b83bece639097842a2ea44a1753155cbe219f6f953a8226efb6b"
  },
  {
    "path": "goal-1/evidence/t17-acceptance-13/run-current-check-r1.py",
    "bytes": 6626,
    "sha256": "e6c494e62932ae1935e99f084cd7cd34a3bee522a19c6c2218ee50853e4b2304"
  },
  {
    "path": "goal-1/evidence/t17-acceptance-11/normal-input-r1/chrome-normal-prefix-r1/r0071.json",
    "bytes": 1029860,
    "sha256": "7722fcc9cacd7e09ca5e546abb1c42d1c6440aaa559e41a281facb86cafb3ddb"
  }
]
```
