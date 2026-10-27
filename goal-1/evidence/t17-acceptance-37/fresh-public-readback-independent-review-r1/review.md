# Fresh R4独立静审：两项P2，当前不准执行

审查切面：R4入口31206B / 1efaa7917c04be66453c1d3f7cda26f622937d0a117a31810400209137e7ee66；spec R4模板20397B / 711a838952f31139d4a5c798cb4c7ab7cf1c808efadf044854f183afa1b61610。完整读文本与最终registry协议，未运行/import/语法检查任何候选，未启动codec/engine/projector/Browser或产品工程。最终producer/spec尚未齐，不能GO。

## P2-A｜更正事实没完整绑定已公开实计及保存后原票

位置：fresh-public-readback-candidate-r4.mjs:92—99。

single_negative的passed只核payload.correctUnits===correction.correctUnits、auditId/meterId、originalReportedUnits；没有核这些correctUnits等于before中已完成原audit.actualUnits，也没确认该audit的同业务/原job真正completed、其meter在after按相同身份指回新增correction。bulk_remaining的valid同样只核原meter.correctionId===null和reported原文，没有核每条correctUnits与原已公开audit.actualUnits、after meter.correctionId/correction.auditId反向一致。合同却明确声称“原完成audit公开payload/correction/meter”。目前不能由这份独立facts结果证明该已公开事实链，未来fullCreate通过不应替代这段独立断言。

最小成组补法：只在audit.completedAt非null且<=beforeDate、原job已completed且完成<=beforeDate后读取actualUnits；核audit同business/meter、safe integer公开实计；payload/新增correction.correctUnits都等它；after唯一原meter保报告/价格并将correctionId指到本新增correctId，原auditId/meterId/period/business同链。bulk同时保原已保存更正不重写、所有新更正均属于同原期且每原meter只新增一次。未知/null/缺job不补0、不读未完成audit实计。

## P2-B｜R8用途矩阵只认标签，不能证明对应原组关系

位置：R4:39及83—85。R8只要求存在三个purpose字符串，unchanged算法仅判keys>=2且raw字节相等；semanticRole未进入任何核验，原auditRole/branchId只与registry字面一致，并未在每个purpose约束对应revision/角色/同branch/不同用途关系。于是静态可构造三个不同name、相同原115 alias keys，分别贴old115_today_and_draft_cancel、old99_confirmation_cancel、three_composition_read_aliases；purpose存在谓词都会满足。其它cases仍可覆盖余keys和实际新command贡献，故完整key集合/贡献总数不能补上取消与三幕来源组的语义缺口。这里只指出代码路径，未执行此反例。

最小补法：最终spec用明确purpose合同绑定每一组原capture key与角色（before/after_cancel/after_read/reentry等）、必须revision/同branch以及零新增贡献；old99取消必须原99前后，old115阅读必须其原115前后，不能用相同115组占old99。三构图按working/settled-unreviewed/kept分别显式登记来源/读后等值组及对应Root观察引用，不能仅一个purpose标签冒三组；JSON只核这些已登记组的原文不变，依旧不证明实际构图或草稿UI内容。不要靠source文字正则或从runId挑latest。

## 本切面未发现放宽的部分

- 模板本身final=false/authorizedBy=null，R8 cut/keys/cases null；入口先拒未final授权，随后exact producer/key/role/scope校验，不会直接让当前模板通过。未来需要的真实R8仍未编造。
- spec producers与finalProducerSet.freshDirectories双向等集，fresh scope要精确等原producer全部records keys，buffer/backup/cancel/reentry不能择子集；未知新producer没有专用算法直接拒。required.expectedChecks等cases+3。
- 经营transition single核同run/account/business/period、+1及完整原receipt metadata前缀；不同同run分岔不能只靠revision串接。字面origin/source/branch/auditRole/captureRole与registry一致。
- bulk现金refund2424与新AR1212分别核原ops/新invoices/cash delta，income净变为1212-2424而非现金1212；supplier恢复808与新增成本/原债404分列。single606与202也另核income/cost和现金/资产。退款原debt.remainingFen=0由实际债字段严格核，不缺失兜零。未知引用会抛错/attempt红。
- 旧positive35/negative31由audit-io按原manifest完整path/bytes/hash/mode+原manifest行身份+origin/source/run/rev映射exact keysets，只继承原15/25capture；fresh新行不能挤入旧scope。没有重跑旧35/31。
- 历史127/901/P326/37refs/3authority只在不可变历史before/after/executionContract相等窗口中核，不要求今天tasks继续5618B；当前runtime完整dependencies由builder→freeze→runner绑定，未把901当当前count。当前tasks若另引用须mutable-final snapshot保持至terminal。
- 一次readback marker/wx与producer tree首末保护保；图/AX引用只在observationsOnly列身份与claim，不独立宣布视觉通过。读回失败不能触发再次绿Create。

## 范围与真实操作说明

只新建本review目录。元数据JSON摘要读取第一次对R8 null.recordFacts.map报TypeError，随后改为可选链重新读取；这是本审稿的fs/JSON列表输出失误，未import/执行被审候选，不是候选测试红或正式读回。所有候选/产品/旧证据未写。当前两P2需Owner成组补正和新切面独审，再由Root待最终producer/spec齐后决定执行，不能以此次静审作为GO或U4-B完成。
