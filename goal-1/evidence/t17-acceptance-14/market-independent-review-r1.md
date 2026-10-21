# D09 市场早期独立审查与DS反向复核 r1

2026-10-21。当前仅只读新market-scene-progress.ts/MarketSceneChoice.tsx及其原合同，另按主控要求反向核已交回DS helper。未修改源码/计划/输入，未运行测试或浏览器，未审仍在大改的NarrativeScene，兼容开发测试0。市场两新测试文件在首次读取时尚不存在，不以此宣称检查已通过或缺陷。

## 市场定向结论

在下列实际源码快照中，未发现可证明绕过原报价、账户、到期ID、资金或保存保护的确定缺陷；这不是集成/实际画面或全交易路径验收。

- 草稿初始账户、标的、方向、股数、限价和到期点均为空，需要玩家明确选择。采用当前价也是明确按钮，不默认满仓/按未来价格成交。
- marketDraftPayload核对受控view.accounts、公开symbol、方向、正整数数量、安全范围、正限价、非空且匹配当前m.quoteId和实际matchingCalendar.id。validUntil传原撮合点ID，没有把日期当ID。
- quote更新提示保留已填股数/限价，显式重新核对才更新quoteId；不会悄改玩家限价。原核心检查stock自身checkpointId、open/price/rule/资格、限价区间/交易单位、期限和资金/可售原股，最终仍通过CommandButton preview/request执行。未知行情/停牌/无资格不会由本地parser直接取得执行许可。
- 草稿所选accountId进入真实payload，position和可售数量也按该账户+symbol查；原资金冻结及卖股在原owner核验下执行，没有误用页面当前accountId覆盖玩家所选账户。
- 场景委托和交收先按accountId过滤；原计划SubmitStockOrder只传orderId/current quoteId，保留原占款；撤余量只传orderId，原预览releasedFen而非新收入。原改单和所有细节仍交回原册。
- 新提交按钮受busy/readOnly/hasCandidate/conflict/日期边界限制；CommandButton再重验原preview。candidate或只读不发布新委托。填写或返回只改本地草稿。
- Dialog仍使用原ScreenBook，草稿在翻页时保持挂载；是否在当前实际窗口需要过多翻页尚未目检，不能由源码宣布一屏清晰。

## 市场集成必须核对的边界（尚不足以认定缺陷）

1. MarketSceneChoice当前内部没有runId重置，只记录openedRevision；若父组件能跨人生复用同一实例且revision恰好相同，旧open/draft可能残留。因此父应以runId key或明确重置拥有者保证不跨人生复用。当前未审父接线，不能假定其已出错或已正确。
2. marketSceneProgress里的running research是全局个人研究，并未按账户过滤（原ResearchMarket从personal扣成本）；其返回base.accountId仍是当前查看账户。父展示时应标注“玩家的个人研究”，不要把它解释成该企业的费用/研究。这里没有错误支付路径，但需避免财务主体语义混淆。
3. matchingCalendar来自原公开quote后的有限点，scene nextDate只是便利目标；父必须继续经playableAdvanceDate/Workbench屏障裁剪。特别同日中途暂停的后续市场阶段不能由该日期提示越过或按旧价重新交易。

## DS反向复核发现一项确定阶段排序问题

### [P2] 已进入谈判仍可能默认退回前一份邀请

原core/equity.ts StartEquityNegotiation只追加negotiations，不把invitation.status改成used；used发生在实际签署。DS helper为尚open的邀请赋active=true/priority30，为running negotiation赋active=true/priority42。默认排序active后取priority小者，所以实际已经开始的谈判工作期间，原同一邀请的旧已揭示尽调介绍会抢主焦点，显示“已确认意愿、可继续谈”而不显示已经在谈及真实等待。这与D09阶段清晰度目标不符，即使底层能拒绝重复同条款，并不构成资金错误。

建议：当原邀请存在未结束、未过期的真实谈判时，原邀请降为非active但仍留entityIds可切换；或保证当前谈判/工作优先于前提介绍。已完成且未作签署/拒绝的谈判继续作为当前决定。不要删邀请历史、自动签约或收窄合法的原其他条款选择。我本次未改DS源码。

## DS其他反向核对

- 未完成尽调、谈判、买方核实和治理先看原job planned/running；已揭示结果须对应report/response/resolved<=date且job completed，不从冻结accepted/authority/buyer price或referenceUnitPrice提前叙述。拟投资金额/股数是玩家已提出的公开条款，不是隐藏对手回应。
- nextJobDate仅返回真实未来start/complete；null保持无自动等待，不将空日期格式化成过去节点。closed/locked历史active=false；待收/未结保护/应付仍可见，未到期应收不给Collect命令。
- jobFacts使用DEEPSEEK_JOBS的基础固定费用/AP；operations-validation明确实际action定义的costFen/actionPoints必须等于该任务定义，雇员并不让AP变0，因此这里不存在“换资源后任务点数失真”的确定bug。
- 但该串不是企业全部支出：员工工资、维护和补救后另排支持费用仍额外。建议描述明确“任务基础成本，原工资维护/后续支持另列”，不要把该单job串宣传成总项目投入或全部预留。当前helper未读实际ledger reservation/metric，不能以它证明已付总额。
- 只有原SubmitEcoDelivery/两类原到期收款提供固定原payload；所有融资/跟投/资源/日期/金额/股数保持原选择，不绕原preview/保存。原取消/退款/支持赔偿/业务欠款和历史记录未被删除。

## 保留范围

上述结论只是这次早期源码检查，不替代父集成类型/测试、当前Chrome真实交易/回款和原候选重试，亦不覆盖完整矩阵、真人理解度或趣味性。原兼容暂停、5c-P1暂停和原PNG/真人缺口继续。

## 实际读取源码身份

```json
[
  {
    "path": "src/ui/market-scene-progress.ts",
    "bytes": 7025,
    "sha256": "4aa75586ac0c4a65d845a21ce606fcb3f3881798c08c8c71b90655988c3a68a3"
  },
  {
    "path": "src/ui/MarketSceneChoice.tsx",
    "bytes": 7513,
    "sha256": "c182a3d95b2c1f9d0bb08965006f62738da31674bf844bfe4f6d8a331a9d15d9"
  },
  {
    "path": "src/ui/deepseek-scene-progress.ts",
    "bytes": 19448,
    "sha256": "531ce989b1197fa491daf9e4fe85b5e9080e5f4260b6aa5319d5bbe9f7352803"
  },
  {
    "path": "src/ui/CommandButton.tsx",
    "bytes": 1313,
    "sha256": "17fa2e2799afb252392afb2fa10e3253023c1b5f2a5f77e079c3ea783eeebf43"
  },
  {
    "path": "src/ui/Dialog.tsx",
    "bytes": 2456,
    "sha256": "c41652816ceeb77a98bf281ee3d5c8bfba243c531e1175fc82fe7f8fff3d8083"
  },
  {
    "path": "src/ui/ScreenBook.tsx",
    "bytes": 9000,
    "sha256": "9ec810b63bc6d67831f145ea0b172ebc427d65ee90b629fc75d1da16d56a48f9"
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
    "path": "src/core/operations-validation.ts",
    "bytes": 15486,
    "sha256": "5b2c0a15c57ba37b7941d9eb1e82d938845dc9e2d86aed16ed039bf462117748"
  },
  {
    "path": "src/core/operations.ts",
    "bytes": 42459,
    "sha256": "02e55e3524b8ac9c65719ad64f2145f34a73662f1bd6510e0ac2395ef3e0d0a5"
  },
  {
    "path": "src/core/equity.ts",
    "bytes": 24814,
    "sha256": "ef2c0d406f8453d3fc5910aa26bed7b966ae87720ac86e1fc231922b0edeaa74"
  },
  {
    "path": "src/core/deepseek-projection.ts",
    "bytes": 4391,
    "sha256": "bc4c4a42acd5f54a630daff4ec7eaf454d7c6cf0bccf2c833aaa00107b70b209"
  },
  {
    "path": "src/application/market-commands.ts",
    "bytes": 1379,
    "sha256": "1675ba4f8afc4bddbb1fe5e22508c47c063e1be66b98424c7a63a8b06a2c1e66"
  },
  {
    "path": "src/application/deepseek-commands.ts",
    "bytes": 3052,
    "sha256": "73f0df92f80c213bd50de2a9de1dff6ae23d45ec8f07602d696e78b05040dc65"
  }
]
```
