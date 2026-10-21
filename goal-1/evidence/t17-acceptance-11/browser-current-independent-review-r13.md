# 5c-U1 当前 Chrome 业务与保存证据独立复核 R13

结论：本轮指定的当前窗口业务与保存证据限定通过，未发现所核结果与原文不一致。此报告只读核对已完成的原 AX、公开导出与原动作日志；本代理没有重新操作浏览器，也未读取隐藏 roll/profile 来选择策略。页面兼容开发与测试为 0。

## 实际复核、支付和追加更正

生产包 R12 从真实正常 r99 原文接续。原委托确认 AX 的日期为 2025-03-05—2025-03-08，资源为本人 player-production。r100（3月4日）保留原 ¥100 和 1 点，AX 明确尚未开工支付；r101（3月5日）实际开工，原动作 executedAt=2025-03-05、成本10000分、1点，预留归零；r102（3月8日）实际完成。原文中的唯一 relay-meter-audit 任务与动作日期逐项一致。

168 条原计量对应 168 条完成复核记录，覆盖集合无重复/遗漏；只有 7 条实计与原 reportedUnits 不同。随后 r103 另行确认，追加 168 条 meter/audit/correction 引用，其中 161 条差额为零、7 条差额非零。不是168条财务差额。逐条核对 correctUnits 来自该条已完成 audit、originalReportedUnits 来自原报告，客户/供应差额分别等于用量差×原单价。合计客户收入差额 -¥18.18、供应成本差额 -¥6.06，与原确认 AX 一致。

将 r99 与 r105 的168条原计量按 ID 对齐，原 reportedUnits、requestedUnits、unitPriceFen、unitCostFen、rateId、termsId、客户、原日期、供应账期/到期日、原交付/计量依据等20个公开原字段逐一相等。更正引用另加，没有静默重写原报告/价格。r99没有完成 audit/correction；没有把未完成结果当成可用证据。

## 六次真实回款与未结责任

按六个 CollectRelayDue 命令的原 transactionIds 联结现金交易、收款明细与原客户，应收条目共52条；每次入中转站账户的现金增量等于其收款额，关联操作未新增 income metric。

| 提交 | 原日期 | 原客户 | 实际现金回款 | 收款明细条数 |
| --- | --- | --- | ---: | ---: |
| r95 | 2025-02-25 | 客户5 | ¥897.78 | 15 |
| r96 | 2025-02-25 | 客户6 | ¥909.90 | 15 |
| r98 | 2025-03-04 | 客户5 | ¥424.62 | 7 |
| r99 | 2025-03-04 | 客户6 | ¥424.62 | 7 |
| r104 | 2025-03-08 | 客户5 | ¥242.64 | 4 |
| r105 | 2025-03-08 | 客户6 | ¥242.64 | 4 |

六次合计 ¥3,142.20。前四次实际发生在 DEV 的服务/支持接续中，最终生产包从 r99 承接这些完整原记录，再实际完成最后两次；不冒称六次都在最终生产包重新游玩。最后两次的确认与已保存回响分别绑定客户5/6及 ¥242.64，没有重复确认服务收入。

截至 r105 / 2025-03-08，按原 ledger 计算并与最终 AX 核对：

| 仍在原账的项目 | 核定值 |
| --- | ---: |
| 个人现金/可花 | ¥204,000.00 |
| 中转站现金 | ¥36,586.30 |
| 活跃客户保护款 | ¥7,175.78 |
| 中转站实际可花（现金减活跃预留） | ¥29,410.52 |
| 尚未到期应收 | ¥1,254.76 |
| 供应应付（3月15日到期） | ¥4.04 |
| 供应贷项/预付资产（未变现金） | ¥10.10 |
| 本季度已用 / 已预留 / 可用行动 | 4 / 0 / 0 点 |

剩余8条应收分别在3月9、10、18、22日到期，全部晚于当前3月8日；未被提前取用。原周期仍为 settling，原企业仍 operating。支持实际完成不等于企业关业或原债务清空，客户保护、供应资产及应付继续存在。

## 保存故障与原候选重试

故障范围是既有 DEV 独立 abort-relay 库里的首次服务 AdvanceTime：从1月27日/r92推进1月28日，触发原 head.put 成功后事务 abort；不是计量复核故障，也不是原生离页专项。原 AX 显示“写入成功后中止：已触发”“未保存，第92次提交”，画面仍在1月27日、服务仍为待开工，新动作暂停，保留导出候选和重试原候选入口。

独立原产品“本机故事→导出原档”读出的物理旧 r92 与实际导入缓冲逐字相同：1,159,691字节，SHA256 d2a42c34932414c5473d04c5415af88e0604b944ec3bc0d4aabeaeccf85fbea6，计量0。未发布 r93。

未保存候选 r93、一次“重试保存原候选”后的已保存 r93、另一原产品读取的物理 r93 三份逐字相同：各1,197,588字节，SHA256 e4b7e2d7bb8f7fda9f4cc8a0ba2611e65b433ce34e7b7581f09d38ed30418517。三者日期1月28日、6条已发生计量、0条复核。候选的旧92条 receipt 前缀不变，只多一条原 AdvanceTime；原动作日志只记一次首次推进和一次原候选重试。重试后 AX 才显示“已保存，第93次提交”。

## 生产原档重载与日期草稿

生产导入 r99 缓冲与 DEV 实际保存导出逐字一致，2,584,198字节/SHA256 5b665cbc19f44a55eae5aa075a0de37562c20c24f9ae1c0f98985891e0f2b0de。生产 r105 已保存导出与保存退出后从原产品重新读取的物理原档逐字一致：各2,856,590字节/SHA256 478f312b634050e97dd87900f2e8c6d1e6a238af18426faa75c0fa35b5b1f4f9。最终 AX 保留3月8日/r105、当前原账与未结责任。字节比较是本报告的读取核查，实际退出/原档读取/继续人生动作另据原 journal，不混称本代理再次执行。

日期草稿原记录显示：9999-12-31 时预览禁用、字段仍聚焦且非 inert；明确选2025-03-05后预览启用、字段仍聚焦且非 inert，原分页往返后日期不丢。两状态都停留3月4日/已保存r99，gameCommandsSubmitted=0；之后最终生产提交采用同一明确日期，而不是钳制或替换输入。

## 原工具异常与完整 Create 字节审核

原日志如实保留 CDP observation timeout：生产日志46条中的15条、故障日志29条中的2条、日期草稿日志18条中的0条。部分返回超时的动作已在 after 状态及其后 AX/原文体现唯一实际提交，故以原结果核定，不把超时当成未执行，也不把工具调用全部报成功。原异常与原文均未重写。

完整 Create 审核的真实完成记录：wrapperExitCode=0、driverExitCode=0、validationErrors=[]，实际用时210.25秒；1个Create、107个去重完整命令、18份公开原文，其中7份是输入缓冲，allByteEqual=true。再次逐项重读125份 sourceHashes 与26份 inputHashes：均为物理常规文件且实际SHA256全部相同。未重跑审核、未追加它的输入。

该审核只证明当前引擎完整创建/命令重放与各原文的字节关系。浏览器动作、日期草稿、候选未发布及画面语义分别依据原 AX/journal；输入缓冲不是新保存结果，候选也不是已提交结果。1个Create及其分支不等于六固定身份、288形态、完整5c、完整T17或真人试玩。

## 输入字节索引与边界

下表是本次只读核查直接使用的原证据，不改原文件。报告本身以wx新建并先调用父目录浏览器证据守卫；不新建chrome目录/exports，不变更冻结源或审核输入。

| 原证据（相对本轮根） | 字节 | SHA256 |
| --- | ---: | --- |
| chrome-relay-fault-r12/r92-normal-for-service-abort-text-before-import.json | 1159691 | d2a42c34932414c5473d04c5415af88e0604b944ec3bc0d4aabeaeccf85fbea6 |
| chrome-relay-fault-r12/service-abort-physical-old-r92.json | 1159691 | d2a42c34932414c5473d04c5415af88e0604b944ec3bc0d4aabeaeccf85fbea6 |
| chrome-relay-fault-r12/service-r93-unsaved-candidate.json.json | 1197588 | e4b7e2d7bb8f7fda9f4cc8a0ba2611e65b433ce34e7b7581f09d38ed30418517 |
| chrome-relay-fault-r12/service-original-candidate-retry-r93.json | 1197588 | e4b7e2d7bb8f7fda9f4cc8a0ba2611e65b433ce34e7b7581f09d38ed30418517 |
| chrome-relay-fault-r12/service-retry-physical-r93.json | 1197588 | e4b7e2d7bb8f7fda9f4cc8a0ba2611e65b433ce34e7b7581f09d38ed30418517 |
| chrome-production-r12/r105-audit-correction-real-cash-saved.json | 2856590 | 478f312b634050e97dd87900f2e8c6d1e6a238af18426faa75c0fa35b5b1f4f9 |
| chrome-production-r12/r105-reload-physical-original.json | 2856590 | 478f312b634050e97dd87900f2e8c6d1e6a238af18426faa75c0fa35b5b1f4f9 |
| chrome-play-dev-r12/r99-before-audit-saved.json | 2584198 | 5b665cbc19f44a55eae5aa075a0de37562c20c24f9ae1c0f98985891e0f2b0de |
| chrome-production-r12/r99-real-service-support-cash-prefix-text-before-import.json | 2584198 | 5b665cbc19f44a55eae5aa075a0de37562c20c24f9ae1c0f98985891e0f2b0de |
| chrome-play-dev-r12/date-draft-live-validation-r99.json | 1170 | 16c85b98c42096fc5ea2e390cab303bf123f13f98b29d3301c0e4a9768a6d698 |
| browser-audit-complete-r1.json | 254 | 6a36cd379a2a53e1dd049f38b049dd4b54badad887d6ff5cb55c8d252935df98 |
| current-chrome-audit-r1/normal-browser-export-audit.json | 26326 | ac36ba348f5858367049c983a30a0b51cd71abc2081e970402977c8ff80212cc |
| chrome-production-r12/audit-chosen-date-confirm-r99-ax.txt | 6140 | d01c2e619ffe6ebad243712cbcbe875a0f5d270916ceef740e52663b676895b5 |
| chrome-production-r12/audit-completed-public-seven-r102-ax.txt | 2580 | 34272fafec0968e5fc9c417eb286eed1777f9e11cb706416453b6eb62e463077 |
| chrome-production-r12/audit-completion-receipt-r102-ax.txt | 3775 | 133d318840d6f1f1bff3cfd7a78f5b28a7b02c1788fe9104553b4bb48ffb2168 |
| chrome-production-r12/audit-reserved-r100-ax.txt | 3885 | 40c76d643c4a158bb31f1fb0bc147b95619720430da17b7356127259e81b7657 |
| chrome-production-r12/audit-started-paid-r101-ax.txt | 2594 | bfecd0ce338db2ac58d2e98bfd5d72a111a8f589c63d3ef9fdc705fe0bca98bf |
| chrome-production-r12/collection-customer5-242-confirm-r103-ax.txt | 4064 | 0e951408000557a37dd18209bb1085839c0630f9131df7a24871101dca6cc3fe |
| chrome-production-r12/collection-customer5-actual-r104-ax.txt | 3809 | a0e19bdf575b1f58db542fd6733c4e2a36b13d2cc2ec7e01ff7b6fd8386d2a99 |
| chrome-production-r12/collection-customer6-actual-r105-ax.txt | 3857 | f7c20b240876e23376203f9cbfa898e6b40db8f57360ec5f78c706a64750172d |
| chrome-production-r12/correction-committed-r103-ax.txt | 3830 | 325210ca62163c2ab87961f10aec63bb0f39e1e0afa5571cea6aa7e728f6a285 |
| chrome-production-r12/correction-original-prices-confirm-r102-ax.txt | 4005 | db2d651498e7ce2e7bd7c4c89dfe1b181dfdb4b88378c07281e4cbc87d9b5a82 |
| chrome-production-r12/final-relay-r105-ax.txt | 2564 | e4d915493844186cb151ba0fcc4f73f61bc19bd1191f89cfaa8e4878ef34538b |
| chrome-relay-fault-r12/service-abort-stays-r92-ax.txt | 4542 | d717be9dbdf9a26da8f5ca213735fc83022f288e41ffbbcc717798080c3ba3f4 |
| chrome-relay-fault-r12/service-original-candidate-retry-r93-ax.txt | 3667 | a0277766e4f43fab76bdc4c4cc1de39467f58d92cebb4b73af028ac525d7382b |
| chrome-play-dev-r12/audit-future-date-confirm-r99-ax.txt | 6129 | 15918effc5b605812c96f36877160a0e7a0d6b806e92ae7abdd349d295c9769d |
| chrome-relay-fault-r12/native-progress.jsonl | 16455 | 93ca63baeb50fd8efd3e87c407d4ee975c89f0bbd86b3070a4c6cac54bfe5e3f |
| chrome-production-r12/native-progress.jsonl | 30392 | 47bfe3e86374f44520d144d68034bdd3d2735bfab2e18e026d0f58fc48048288 |
| chrome-play-dev-r12/native-progress.jsonl | 11369 | a336600aa86aea115e135cff8603e875b4872b37e9324897b899f6ad1a2e977b |

[杠精审查] 本轮指定结果限定通过；168条追加引用与7条实际差额、6次命令与52条明细、候选/输入/保存结果、生产/DEV和字节审核/浏览器动作分别核定。未假称企业结清或完整5c完成。未进行兼容开发/测试；原PNG0/3、真人0、M01暂停及其他T17责任继续保留。
