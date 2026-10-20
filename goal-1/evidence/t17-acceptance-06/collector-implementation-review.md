# P2核心形态采集器实现复核

本文件为当前同一P2的源码层实现复核，不是288形态执行结果。只新增scripts/collect_course_shape_evidence.ts；没有修改运行时、规则、钱数、日期、权限、随机、存档版本、原证据或依赖。全部页面兼容开发/测试及浏览器操作均未执行。

复核的collector SHA-256：2ee047a1c97a2c9c398882543e9224c578a4d581c9c682aabcaec705e8c948cd。P1固定前置提交1938030714f5318287910a5f57d976c412d553b9；原root05保持只读，不接受环境变量替换前史/readiness。

## 范围和来源身份

- 固定六正常身份：technical_employee/content_employee分别配t16-campaign-0/1/2。原三产品×两主题×基础/进阶×四支持逐组合核对48项，不依赖临时删改过的子集。执行任何前史或形态前先写完整288注册，后续未知fatal也保留所有未执行原行。来源：scripts/collect_course_shape_evidence.ts:128-150。
- 固定读取root05/prefix-r1和readiness-r1。P1汇总/readiness与原提交Git字节锚定，再校验P1 sourceHashes、readiness输入哈希/验证器、六final原字节、所有P1里程碑原字节；源及输入文件均纳入本轮登记。来源：scripts/collect_course_shape_evidence.ts:62-147。
- 每身份先从原Create参数和原命令独立执行，逐命令strict codec并比较原initial、全部P1里程碑与final完整原文，再核公开course/video/story等于原记录，才允许形态分叉。不能用读档直接赠资格或钱。来源：scripts/collect_course_shape_evidence.ts:197-223。

## 实际命令、拒绝与字节证据

- RecordingHarness在调用原sendAs前先把实际完整CommandEnvelope、sourceRevision/date落入新command-attempts.jsonl；成功、真实拒绝及非命令异常分别记录。没有把任意error或reason都归成政策拒绝。只有scenario明确抛出的CourseShapePolicyRefusal才分列有限政策结果，其他未知错误为fatal。来源：scripts/collect_course_shape_evidence.ts:166-195、scripts/collect_course_shape_evidence.ts:257-261。
- 各分支保存实际已提交后缀、所有attempt、当前完整final/partial原文、逐里程碑完整原文、公开course/video/story、实际资金/AP与公司cost/accrual差额。后缀命令以实际receipts为权威，并与harness记录交叉核对。来源：scripts/collect_course_shape_evidence.ts:156-195、scripts/collect_course_shape_evidence.ts:235-293。
- 独立后缀从已经赚得并核定的原前史重新执行。成功attempt逐个strict import/export；真实拒绝在同一sourceRevision用原envelope再次evaluate，核reasonCodes相同且拒绝前后原文未变。成功attempt序必须等于实际已提交suffix；全部里程碑和final原文逐字一致，原共享前史在重放前后都不能改变。非命令异常不冒充已重放拒绝。来源：scripts/collect_course_shape_evidence.ts:264-285。
- actualClosedShape另核本形态确实定义新课、实际两段交付、所选原支持真实完成、原班期已关闭，不只看函数返回。实际留存helped人数独立记录；关闭不自动等于利润、全部学习成功、企业清债或外部控制安全。来源：scripts/collect_course_shape_evidence.ts:286-293。

## 独立账务数值

milestone先保留完整原文，再对相对前史新增的实际cohort调用assertCourseMoney，将返回的学生/批次/原流水/保护/费用/AP等完整独立数值写入moneyEvidence；旧公司原现金变化另存assertCourseCashDelta结果。pending/passed/failed和错误独立列出，不能只保留一个断言通过布尔值。trace保留原公司实际cost/accrual/income变化及各账户原仓位。来源：scripts/collect_course_shape_evidence.ts:156-160、scripts/collect_course_shape_evidence.ts:242-252；具体公式由src/testing/course-shape-assertions.ts负责，原scenario也在各milestone调用。

## 体积与防覆盖

现场仅约3.9GiB可用，故所有新增完整raw采用node:zlib gzipSync无损保存为.json.gz，逐份记录未压缩/压缩后的bytes及SHA-256；写入后重新读取并gunzip，逐字节比较全部原文。没有裁剪字段、规范化ID、截断内容或删除旧证据。每分支完整JSON只保存一次，汇总使用文件引用与哈希，避免把数百份完整记录重复塞入巨大JSON。来源：scripts/collect_course_shape_evidence.ts:90-97、scripts/collect_course_shape_evidence.ts:297-301。

输出必须显式指定新的--output-dir，复用assertFreshVideoEvidencePath/evidenceDirectory检查同级任务、跟踪状态、符号链接与覆盖边界；新文件wx，预先新建空progress/attempt日志后才追加。本轮不修改原root04/root05及全部post，源与P1输入结束再次核哈希。来源：scripts/collect_course_shape_evidence.ts:58-60、scripts/collect_course_shape_evidence.ts:294-296。

## 验证和未完成部分

本子任务未自行执行类型检查、测试、模拟、回放或浏览器。父代理报告collector standalone严格tsc r1 exit0（含exactOptional/noUnchecked/noUnused/erasable）；该结果由父任务保存并核验，本文件不以转述替代其原输出。真实288批次及所有gzip/独立账务/接受和拒绝重放的运行结果，仍待父任务实际执行后核验。

[杠精审查] 源码范围限定通过：没有以P1读取/登记取代正常赚得前史，没有省略原48×6，没有把未知失败吞成政策，也没有用压缩掩盖缺字段。当前未发现必须阻止首次真实batch的新增重大问题。实际失败仍须保留原输出并在新目录修缮重跑，不能修改已冻结运行源。本结论不标记P2、P3原90关键、完整5b/T17/QX、真人或原PNG缺口完成。
