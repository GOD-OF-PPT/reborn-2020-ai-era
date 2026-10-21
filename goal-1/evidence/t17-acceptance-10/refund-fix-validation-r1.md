# P4退款确认修缮限定结果 r1

范围：同一P4实际交互修缮。只新增公开退款明细组件和定向测试，最小接入现有确认；不改App、core、规则、schema、codec、钱数、日期、权限、依赖或确认容器。主代理独占的闭班progress修缮分列，不计入本组40项。全部页面兼容开发/测试0，book-layout原用例未改未执行。

## 实际红绿

先保存当前真实Jan16确认PNG/AX、半交付与全交付AX及旧源到refund-fix-before-r1，manifest SHA256 ffdf6a363417fe2b56c49374657c9b3f482f7a331e9bb34eadba421b1ab16ac3；旧截图确实只有新增费用0，没有学员应退额。原截图与物理导出未改变。

原实现实际定向red：refund-fix-red-r1/complete.json记录npm exit1，40项中34失败/6通过；失败包括原组件空明细、实际CommandDetails无退款内容、错误通用费用标签。完整vitest.json、console.txt、command.json、source-freeze保留。外层Python仅保存实际子进程退出值，不能把其shell正常退出当成红测通过。

新实现实际同组green：refund-fix-green-r1/complete.json记录npm exit0，2文件40/40通过（33退款SSR/7原money），原单worker、默认用例时限、每文件隔离不改。命令为npm run test:unit -- --maxWorkers=1 --reporter=default --reporter=json --outputFile.json=该新目录/vitest.json src/ui/CourseRefundDetails.test.tsx src/ui/confirmation-money.test.ts，前缀rtk proxy。实际elapsed4.811860799789429秒为本轮工具wall，不称游戏性能。定向git diff --check exit0。

## 玩家看到的结果

原RefundCourseLearners两个入口共用同一说明：原课程名/开班日期/企业账户、实际所选人数、完整应退额、尚未交付原预款与已交付收入冲减。原新增操作费用仍沿preview为0，标签明确学员退款另列。

说明只读取确认时captured公开course/view，核原runId/expectedRevision、允许预览及可写/无候选上下文；原cohort→course→business→account逐级唯一核对，绝不回退个人账户。逐个personId核完整选择、同班/课程/产品/冻结单价、原阶段交付和已退字段与公开paidRemaining/refundedFen。未知、重复、空、已退尽、主体不明、负数/非整数/不一致/溢出整体返回明确核对提示，不过滤出较小金额或补0。BigInt仅用于既有退款义务的有界汇总，不复制ledger逐款现金结算算法。

金额说明明确“本次应退金额，不等于学员已经到账”；缺款继续保留应付和保护，不推算实际支付/新增应付/保护释放。原StartCourseStage分支与原提交/保存守卫保留。

## 测试证据身份与边界

测试通过原campaign codec严格导入当前正常r74物理原档，仅projectRun/projectCourse/public runtime投影获得真实课程/学员/企业身份，不执行游戏命令、不提取隐藏roll/profile。before/half/after、奇数分/部分已退、现金短缺和非法映射是明确只读显示变体，绝不编码或保存为正常历史。实际CommandDetails SSR验证捕获接线；每组核公开对象与原codec导出未变。

覆盖前/半/全交付999元、原奇数分99901/已退49950、多人及全20人与已退1人后19人；25类错误集合/主体/钱数/旧revision/只读/候选/拒绝预览及聚合越界。现金短缺只检义务与严谨提示，不声称实际付清。

当前未自行执行项目typecheck、全适用UI、build或新Chrome验收；它们由主代理串行接续。SSR绿不充浏览器画面/保存/付款证据，不重跑长矩阵，也不称P4/5b/T17/goal完成。所有源已交根代理冻结，本代理不提交。

[杠精审查] 限定通过：修复真实决策金额遗漏、没有把费用0当退款0；非法投影不能只显示已知子集。没有更改经济规则或以显示fixture冒充正常执行；最终类型/当前Chrome和整体P4仍由主代理完成。REPEAT复用项目定向取证/原字节冻结，没有新增通用框架或依赖。

## 最终源码（与green冻结逐字同）

- src/ui/CourseRefundDetails.tsx: 4964B / SHA256 e288e449678a129f4b7a002631e6e2baa3ba4e833b264105bafa2a65aa61b294
- src/ui/CourseRefundDetails.test.tsx: 8175B / SHA256 642a2de9e98c72d079f2fd6b6e2581ca53a805e4a6ccfa575ae17d78132766c8
- src/ui/confirmation-money.test.ts: 2485B / SHA256 44e272736b63a4af0b151b5d1f26f2cdf926a0178a86e8882acd6b5ed6028a54
- src/ui/CourseCommandDetails.tsx: 2336B / SHA256 254acbfc88f801633d47a8bfa2f95e8561f1a26c3d34609ac865c68d3535f98a
- src/ui/CommandDetails.tsx: 12595B / SHA256 402db899c74ec087cbb99ef546f861c643e1491f2f85d6cb58f48ed1cbae4b47
- src/ui/confirmation-money.ts: 3191B / SHA256 f28da85d40ea6720a2387235289374981c676f206bd3641ecb8b2ad5c2fd2bef
