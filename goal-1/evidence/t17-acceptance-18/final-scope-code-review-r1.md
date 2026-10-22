# P2 原288最终代码、范围与证据审查 R1

记录时间：2026-10-22T07:18:02.732Z。只读复核当前冻结源码、root18 input/plan/tasks/policy-r1、固定连续控制与真实采集/独审终态。仅 wx 新建本报告；未改冻结源/计划/旧证据，未启动游戏、类型、测试、浏览器、兼容或 stage/commit。此前报告保留各自旧快照；本报告已读到完整最终 audit，不再沿用236项中途状态或 pending。

结论：未发现当前范围内尚未处理的确定代码或安全阻断。原288项均已实际执行并独立核定：264正向、24真实违规有限，错误0；48种形态全部有正向样本。allRowsIndependentlyVerified=true，all288Positive=false。这只关闭本批原P2核心矩阵的执行/独核责任，不把有限结果当业务正向，不代替父步骤6收尾、Git交付或其他项目验收。

## 实际终态与覆盖

- collector-R1真实exit0，2026-10-22T03:21:57Z→05:31:18Z，7761.426983秒。原六身份Create前史先行，再原RLY-C001—C288；summary recorded/executed=288，completed/positive=264，policy_refused=24，fatal/notExecuted=0，finalGuardError=null。
- 独审真实exit0，2026-10-22T05:31:27Z→06:37:42Z，3974.631932秒，metadataErrors=[]。逐原六Create重新执行619接受、219原完整里程碑、6 preview、619 finance/AP trace，六份proof均verified且ready；随后重放3496 suffix接受/3496完整候选、0拒绝、264真实preview、3408 milestone、7256 journal事件。当前report18019688B，SHA600b2bd5c88d300721abc09b385ff4e54e6e1687677f4932f309b5037c967b39。
- 独审全部原ID顺序与registration一致；全部288项保留原十checkpoint名。264正向的十项均passed、真实Mar14、用量收入>0、目标到期应收/应付已结；low本period费全部0，managed本period费全部50000分。不能把服务费、预款、保护款、未来应收、供应资产或264计数解释为利润或个人可花现金。
- 24有限全部为actual_independent_violation_finite_stop，positive=false、无本项新客户/周期；每项均有同对象已完成独立调查、Confirm、本人显式Stop、原责任Declare来源链。不是deadline自动停止、ACK、runner自报或隐藏profile替代。技术/内容seed1各12有限及36正向；其余四身份各48正向。36个非delegated形态各6正向，12个delegated形态各4正向+2有限；全部48形态有正向不等于全部288正向。

## 原范围与规则桥接

三供应×两报价×两客户账期×四支持×六固定正常身份=288，每身份48，未改为挑选容易样本。杉木/港湾后付、青桥预付为原绑定账期；每反事实分支从同身份原P1末档开始，只新增一个未转换真实公开成员，P1旧客户/保护/账目/period/meter/价格/许可保留，不跨分支累计利润或人口。原ID、run/seed/背景、receipt序列、revision/幂等命令及schema/rules版本均沿原Create/codec/registry，不靠载入晚档ready取代重放。

shape scenario 的决策只读公开projection/已读许可、真实preview、公开信号与已完成独立核查；固定Jan11签约/充值/青桥自有400000分、Jan12—Feb9服务、原四种支持费用/AP/日期、Feb24付费audit→Feb27更正→Mar14收付不因隐藏需求/故障或失败结果变额、换供/seed、借钱补款或免费改授权。服务1AP，self支持2AP+audit1AP总4；其他支持1AP，delegated有调查才另1AP。真实时间仍逐事件/暂停/维护/工资/生活/供应义务执行。受阻有限与未知fatal分开，后者保原并停止后续，不拼旧成功。

assertions 在每接受/里程碑核分账户现金transaction增量与总账、保护和自有可花、供应资产/应付恒等式、原账前缀及P1记录不可改删。原请求与命令receipt、收入metric、资金占用和客户余额分别核源；收款只减已到期应收，不二次确认收入。预付更正可产生新客户应收、青桥正更正可有7日应付，后付已付款负更正可形成合法供应贷项；未误禁或抹除。目标收入按本新period与meter源隔离，未把P1已挣费用计入本项。

计量保原reported数量/费率/版本/引用；只审本period已发生且有供应的原记录，不硬写28个都可审。完成audit才使用其公开实计，Correction另追加每条原引用（包括零差），不覆盖历史。审查旧账原文可核其来源，不用于策略窥视未审actual或未来风险。remaining保护与供应资产允许保留，原P1及全企业后续责任不以退款、Close或年末清零洗净。零差、正常种子或本批正向不能替代原62关键边界/故障与独立财务夹具责任。

纯Stop链 helper仅依赖src/core纯值/类型；verifier仍导入并重导出原接口，src测试无Node脚本依赖。本人调查job的原command ID、公开boundary_trace、同incident/business/deployment的Confirm→Stop→Declare、accepted候选来源/revision/run/actor/同日、Stop报告及Declare责任快照来源均严格串接。纯helper不单独证明候选完整bytes；外层独审先实际重算原envelope及完整candidate/journal/receipt，再用此来源链分类。它既不扩权，也不称外部已撤回。

## 保全与连续控制的实际边界

runner先完整保存已生成且能导出的proposal，再做旧态不变/严格导入/账务；统一RelayShapeBranchFailure出口携已有members/attempts/milestones、source、最后已核canonical raw及首错/次错/journal。无法导出的对象明确为未核诊断，fingerprint或记录异常不冒充新合法末档。collector即使未取得正常execution，也用该原payload恢复；磁盘完全不可写或对象不可表示不能保证新文件生成，失败会明报，不能把恢复尝试当已完成保存。两个受控serializer故障是工具异常保全证据，不是经营或正常新局验收。

writer复用原父级seal/链接保护、fresh路径、wx/nofollow/创建文件身份与2GiB空间门槛；XZ保完整原container/member长度及SHA、顺序分包和实际全量解包逐字回读，不是仅留hash。auditor不调用shape策略/builder生成替代动作，完整六Create和suffix、候选/前后原文/preview/receipt/public投影/账务及原journal事件逐一重放后才判定。输入文件集合/物理身份/byte初末一致与source/input guard仍在；本report观察886采集输入=885原普通文件+自排除marker。

固定Python连续driver实际核原5741/5742/5743 argv/PPID/freeze，等待原collector终态0，不因观察超时重启；元数据异常也先wait同一已起child再拒绝下一phase。helper真实exit0/7.557608秒后，才启动一次fresh audit-r1；总driver最终exit0、error=null。没有app automation/cron/新task/自动重试、commit或改冻结151源/247输入/plan。helper 4942完整源原已导入basename；旧header混读误报已如实纠正，没有虚构修复。

helper只作物理读回/引用/模式/集合封存，不解包或重放游戏。实际matrix seal SHAe5152fceae9ccc7852f665dd9db337657f4e33f824c29690cf0174a51b50223c，885普通文件/296目录/190261256字节另加marker。root独立matrix-r1-root-readback-r1确认完整字节/模式/集合与398源输入一致。本人实读这些成功记录及当前9模块hash；未重新扫描885文件或重新跑398hash，把该全物理重读归属根代理。seal/receipt不能替代上述后来真实完成的独立审核。

## 验证与未验责任

实际终态已读：type-R5 CLI/project均0；纯来源链R2同6项0、前后源hash一致；fresh五pilot-R3 exit0/215.263399秒，原140成员/201526134字节与R2再与R1一致；fault-R2 exit0。它们不是本次重跑。此前fault-R1漏父目录exit1、type-R4 Node类型边界红、组件supplier-credit反例红/绿及旧静态findings保留原身份，不覆盖/重构旧console。当前生产src/core/application/content/persistence/ui与package/lock的HEAD diff实读为空。没有新的UI/美术/Chrome、任意窗口/几何/兼容、原生离页、性能或真人结论。

本批证据支持P2原核心矩阵全部独核、48形态均有正向与24有限原因成立；不等于任意seed/危机/所有更正/权限故障均通过。原关键62、例行22、其余5c/P5、整个T17/goal、旧PNG0/3、新A图与原PNG身份、人类样本0、M01兼容暂停及T18责任继续保留。24季度/五路线的旧范围未删，也未因当前中转矩阵再次全验；当前画面、静态类型、hash/封存或绿色组件测试均不能替代完整业务及人类体验验收。最终资料/Git逐blob/mode/远端读回由根代理步骤6继续，本报告不提前声称交付完成。

GJ：三个已发现工具缺口均保留原红并最小修（供应贷项误拒、异常候选丢失出口、自动Stop误认/Node边界）；当前源码与完整最终结果未见剩余确定阻断。264正向与24有限、物理保全与独审、组件与整体验收严格分开。REPEAT：沿原codec/harness/ledger/receipt/guard/writer/XZ/replay资产补中转验证，未新建通用框架、外部自动化或真实API资源。

## 当前字节身份

freeze-r1.json：101203B / e70b059a5fd466f627e387a755e8960823b3fd5eba513bb5f18ae02a25517aa9，151源/247输入。下列当前新模块实读SHA均与freeze.sourceHashes强等；审查结论只绑定这些实际字节与上述真实报告。

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| src/testing/relay-shape-types.ts | 2150 | cef092d39bc3642d7659407001055b32c0bc0bfb2b8c1770f946fbbfe4d5756d |
| src/testing/relay-shape-scenario.ts | 16119 | a7733de631096114459baa03ff0ea501d99c176f97aba1ead9caededc5797758 |
| src/testing/relay-shape-assertions.ts | 33830 | 2b9737ba0568c2e3c35860d236da6b640ff668db5b6f44d05b9ed95a7318ce53 |
| src/testing/relay-shape-violation-proof.ts | 4741 | 8b6be99572539eebde8ffd62ae2288c5d423230565fc0692181ab6d3aabfafed |
| scripts/relay-shape-evidence.ts | 19515 | 67945f57082cbb669ad302f6d2414113b6dab5ac951c1a48be0abb196ef18138 |
| scripts/relay-shape-prefix.ts | 14917 | 3a5d8254e92a8f9d159aedd3f23352ad6b986bdfef4a7f39036880c8fd33e79d |
| scripts/relay-shape-run.ts | 13326 | 18816ff9fcf89f33c345fa15ac147f7e06f0918deab021e2f031a4836852d31d |
| scripts/collect_relay_shape_evidence.ts | 8134 | af36bb784b64054ffc35273fef261d75471a671fcc80001e576106ab77178f27 |
| scripts/verify_relay_shape_evidence.ts | 33733 | b4ba9c80dbb228a66c9089d17964696efc1b1dd1e6d9329e33d36ef15d844bce |
| goal-1/evidence/t17-acceptance-18/continue-matrix-to-audit-r1.py | 10682 | ef880774c0afe7d3de916f108e2d646b0994ebf24e9e31184530fcd9245cd3e2 |
| goal-1/evidence/t17-acceptance-18/matrix-r1-readback-and-seal.mjs | 20868 | 4942e1ce52089b69ba7c0081fbf5a23a213b71f5b6282b4e8238243fd143bc1b |
