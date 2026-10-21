# 退款明细与闭班后果独立复核 R1

结论：限定静态复核通过，未发现仍须修复的确定缺陷。已独立读回主代理当前 20 文件 / 121 项 UI 的真实 exit 0 终态，并核定本报告八份源/测试与该轮冻结逐字相同。此结论不代替新构建、修缮后 Chrome 实际画面、完整 P4 或 5b 收口；这些仍由主代理继续核定。

本报告按 root10 原 input/plan 和原 29/33 合同，只复核退款应退口径、公开投影、确认接线、闭班后果与原责任入口。仅静态读源、原报告、实际测试终态和字节核对；本次未运行任何新 Create、游戏命令、规则测试、矩阵、浏览器或兼容性测试，未修改生产、旧 sealed 证据或主 goal。基线 HEAD `9a01dc6fa5512eb0c55a8b18807faceb66dd137e`，A 长日重启方向及全部兼容工作暂停不变。

## 退款明细

- `CourseRefundDetails.tsx:17–34` 在原 captured runId/revision、allowed 预览、可写且无候选上下文内，唯一核对班期、课程、知识产品、公司和企业账户；必须完整匹配全部原 personIds，空/重复/未知/已全退身份不被过滤成较小或零报价。`CommandDetails.tsx:26` 继续转交原冻结 features/view/confirm/accountName，`CourseCommandDetails.tsx:11` 为原退款命令接线，原教学确认分支保持。
- 应退总额 = 冻结原价 − 已退未交付款 − 已退两段交付款；未交付部分 = 原价 − 两段原交付 − 已退未交付款；已交付收入冲减 = 两段原交付 − 两段已退款。与 `core/course.ts:380–401` 的原退款计算、原支付批次引用和原阶段引用一致。BigInt 汇总后再验证原 MONEY_LIMIT，不以浮点元数改规则或默默截小金额。
- 标题列本次应退学费，另列未交付原预款和已交付收入冲减。`confirmation-money.ts:4` 将原 0 操作费用明确标为“本次新增操作费用（学员退款另列）”，不拿 0 操作费用表示退款 0。当前账户不是选择中的个人账户兜底。
- `CourseRefundDetails.tsx:45` 明确“应退金额，不等于学员已经到账”；未计算或承诺实际到账、保护释放或新应付为零。实际现金、缺款应付/保护继续走原账和保存；视图不执行命令、不改钱/日期/AP/权限/随机。
- 退款显示的交付前/半交付/全交付、奇数分和既退款等变体是测试中的只读显示夹具，不是正常新游戏原文；33 项 SSR 检查的用途没有扩大为三条真实新业务路径。真实三个阶段的退款由下面 Chrome 原文分别提供。

## 闭班后果与责任

- `course-scene-progress.ts:88–94` 先检查真实 0 报名，避免空数组 every 导出“教学成功”；全退无留存显示退款收场，部分退款同时显示留存/退款人数及真实 refundedFen 合计。退款数额含原未交付与已交付的处理记录，称“退款处理合计、实际付款仍看原账”，不冒充到账。
- 仅实际所有 outcome 为 helped、没有退款的闭班使用“承诺认真收好”；其他非 helped 无退款情况使用“原账已经收尾”。该兜底语义经静态核对，本报告不捏造额外正常路径执行结果。部分退款文案所依赖的学习记录仍来自真实学生和原阶段，未推测未揭示学习结果。
- 本代理先前发现的确定缺口已修复：合法空班实际闭班后仍可 WindDownBusiness / CloseBusiness，旧 closed-studio 入口却暗示“曾经认真交付过”。当前 `course-scene-progress.ts:77` 为中性“回看原课程与交付记录”，原 label 与历史入口保留；`course-scene-progress.test.ts:93–96` 在真实空班结清后追加真实停业/关业断言，旧成功 closed-studio 用例保留。
- 原未闭班优先路径 37–74 仍保留更新、结算、补支持、停课、原支持与退款窗口；闭班后和关业后仍保留原课程/交付/退款/历史账本入口。新场景只读公开事实，不自动规划教学、安排补支持、再次招生、扩权或消费随机。

## 与真实 Chrome 原文的绑定

复用本代理已实际完成的 [业务原文读回](browser-business-readback-r1.md) / [完整 JSON](browser-business-readback-r1.json)，不是本次重新操作 Chrome。当前再核该报告绑定的 122 campaign/codec/config 依赖加 1 只读账务 helper 共 123 项，全部字节仍相同；UI 修缮单独列入下表，不声称旧 355/358 全源冻结与当前 UI 全同。

| 原文状态 | bytes / SHA256 | 原角色及业务事实 |
|---|---|---|
| r73 | 872610 / `9ff4d066dd3b617993570e064daf2f0474a204060fdf0ec22822510731c84d75` | 原 P1 字节、输入/物理旧档分角色；没有新 20 人付款。 |
| candidate r74 == retry physical r74 | 896077 / `59d52a2747d55d204d014fe0964418ddc7180e675401bd0a2ac7a2ee8e36cce1` | 同原 20 人 / 1998000 分预款保护；候选未保存期间旧物理仍 r73，重试成功后才为真实 r74。 |
| prod r83 == reload r83 | 1001925 / `a9e1606af8930631bea69228ae697bb158c20460277ce968bbebd7e8a2f1c65a` | 2023-04-16 实际全退 20 人，1998000 分原交付收入冲减，净课程收入/结算费均 0；4 月 22 日才完成的迟更新不撤销原退款。公司现金 902259 分、余 1 AP；不称学习成功。 |
| dev r89 == readonly reload r89 | 1017469 / `f7858d438c6087cffdf1cfb336d3a4df024dd6daf31bf06f82d9d7a9393095d3` | 三位不同学员在 Jan16/Jan28/Feb7 各退 99900 分；未交付/交付冲减分别 99900/0、49950/49950、0/99900。及时更新和实际支持后 17 helped / 3 refunded；净课程收入 1698300、结算费 84915、公司现金 2515644 分、余 2 AP。 |

两分支 closedAt 都为 Apr16，保留各自原支持和补支持实际 Apr1–8 / Apr8–15、每次 300000 分与 1 AP；历史 recovered 数不同，不能拿其曾恢复替代最后退款结果。两分支资金/日期/AP 不跨分支相加。其 11 行公开导出是 2 输入缓冲 / 1 未保存候选 / 8 其他产品读回，不能写成 11 次新提交。实际原款、流水、阶段引用、现金冲减和保护核定详见已绑定 JSON；本报告不重新造结果。

## 实际红绿与当前终态

- 初始闭班修缮：`closed-scene-red-r1.json` 为 3 新目标失败 / 13 旧通过，green-r1 为 16/16；这轮源早于后续中性入口，不把它当最终源的新断言结果。
- 空班关业：`closed-studio-red-r2.json` 真实 1 目标失败 / 15 skipped，绝非其余 15 通过；原源与新测试另存 `closed-studio-red-source-r2`。
- 退款定向：red-r1 原 40 项中 34 失败 / 6 通过、实际 exit 1；green-r1 为 40/40、exit 0。两个文件是 33 退款 SSR + 7 money 标签，原默认时限保留。
- 当前主代理 `checks-r2/active-ui/complete.json` 与 vitest 原文均已读回：真实 terminal、wrapper/driver exit 0、20 文件 / 121 项全部通过，含全部 16 progress、33 refund、7 money；本报告八份当前源/测试均等该轮 source-freeze。maxWorkers=1、原断言/时限/每文件隔离未放宽。没有重复执行这轮测试。
- book-layout 两个多宽度用例 paused，不计本轮通过。新 build、修缮后的 Chrome 退款确认/取消及闭班实际画面仍待主代理；静态/SSR 结果不证明一屏可见、翻页、焦点或真实保存成功，原浏览器业务原文也不代替新画面。

## 字节索引

当前源码和测试（与 active-ui R2 原冻结逐字同）：

| 文件 | bytes | SHA256 |
|---|---:|---|
| `src/ui/CourseRefundDetails.tsx` | 4964 | `e288e449678a129f4b7a002631e6e2baa3ba4e833b264105bafa2a65aa61b294` |
| `src/ui/CourseCommandDetails.tsx` | 2336 | `254acbfc88f801633d47a8bfa2f95e8561f1a26c3d34609ac865c68d3535f98a` |
| `src/ui/CommandDetails.tsx` | 12595 | `402db899c74ec087cbb99ef546f861c643e1491f2f85d6cb58f48ed1cbae4b47` |
| `src/ui/confirmation-money.ts` | 3191 | `f28da85d40ea6720a2387235289374981c676f206bd3641ecb8b2ad5c2fd2bef` |
| `src/ui/course-scene-progress.ts` | 13060 | `78af8caf330148f483b627fc5932ed54550527ac82bb2da49068ceaf758f4cc9` |
| `src/ui/course-scene-progress.test.ts` | 15767 | `953d22d1239f4b49440768eed9b762776e2dc4302b3b60f6cfcb843cdb5e0188` |
| `src/ui/CourseRefundDetails.test.tsx` | 8175 | `642a2de9e98c72d079f2fd6b6e2581ca53a805e4a6ccfa575ae17d78132766c8` |
| `src/ui/confirmation-money.test.ts` | 2485 | `44e272736b63a4af0b151b5d1f26f2cdf926a0178a86e8882acd6b5ed6028a54` |

本报告实际读回的终态/原文索引：

| root10 相对文件 | bytes | SHA256 |
|---|---:|---|
| `browser-business-readback-r1.json` | 124325 | `7a4bac84dfac9b028fbb6a245c1e0c743a1e939bc71460fd533938a89cc37b7e` |
| `checks-r2/active-ui/complete.json` | 1639 | `716034fdeca96ede61f378f62f78dc17ea9a3fc9971a55cbbef8700e001f5e48` |
| `checks-r2/active-ui/vitest.json` | 45294 | `8266068505eb95816f3160b18172877540f6fa6b2720a3382753d2da8e6ca40f` |
| `closed-scene-red-r1.json` | 9394 | `60c95208989628c78d9cc1f718dc1d25a0e6cf5278fbd486382fb70481eeb98a` |
| `closed-scene-green-r1.json` | 6172 | `18cfc85bf966fc111663f40b19e9561aee97151f0f2707ac7fe8756db2b44448` |
| `closed-studio-red-r2.json` | 6855 | `dd801e17d9aa45d1257a56123b3280b1550cceae5de70b878f4b20e07e3fc153` |
| `refund-fix-red-r1/complete.json` | 190 | `65acc3ffe12e5998121c1ecef653bf9f71dde701623088b1ebb24c81bea728b6` |
| `refund-fix-red-r1/vitest.json` | 51279 | `0bf46d49d1987b82a9356cc6e4ad7a3d805e11f24da31ab0f46629019e8bb559` |
| `refund-fix-green-r1/complete.json` | 190 | `89431328006e9e24e9f2c34ecb3f340e049f7c39813f932008b4fe77f8409ce2` |
| `refund-fix-green-r1/vitest.json` | 14748 | `48a7215325cee4805c546c939aa97e7eb31d723f153b56792b0d69b0cdf7dc1b` |

[杠精审查] 限定静态及所读实际 UI 终态范围通过：原款/阶段/退款/闭班真实后果和原责任未删，空班关业确定缺口已经有针对性旧红与当前全绿。未把被跳过用例、只读夹具、Node/SSR、旧 Chrome 或历史同源长矩阵冒充新 C 端验收。完整 P4/5b/后续玩法美术、原 PNG/真人、暂停的 M01/T18 和 goal 均不由此结项；最终画面与整体验收仍待主代理。REPEAT 只复用现有项目证据，没有通用框架/新 Skill/自动化。
