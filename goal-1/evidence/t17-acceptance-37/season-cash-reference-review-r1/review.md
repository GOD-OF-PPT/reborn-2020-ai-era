# Season现金引用定向复核

结论：未发现把Nov7的6.08元挪到Nov17的财务事实缺陷。Nov17原CollectRelayDue确有一条自己的608fen流水，另有720fen原单流水，合计1328fen。Season按单条原流水呈现，未声称该金额是CollectDue命令合计；“本次”一词有阅读歧义，但目前证据不支持修改历史日期或把608强改1328。

## 原链证据

同run normal-relay-technical_employee-ee9cb440；公司账户ops:ef38539ec47df2b4efab6763c0c5bdf8；business ops:bb7f1c37abbfc1d51a6ca6ca76da18b5；原客户2 rly:1fa39660348987364a58485031f01d8e。固定103/107是同当前分支；107的前103份receipt与103原文完整相等，本项三流水在两份原文均相等。

| 实际命令 | 原日期 | 原交易 | 金额fen | 原单 |
|---|---|---|---:|---|
| rev87 CollectRelayReceivable，command-ca1b977b-8d70-4c60-8f7c-a72c993a98d3 | 2024-11-07 | rly:a7e69decc8890eda7442b4951b257d1d | 608 | rly:a258aded1a35adb514cc71781b991437 |
| rev92 CollectRelayDue，command-293ac077-f48c-4447-a4a1-5408e30338ea | 2024-11-17 | rly:123eab1a96afa89da94e3f4095fa9625 | 608 | 同上，是该1216fen原单剩余半款 |
| 同rev92命令 | 2024-11-17 | rly:209e88ab55dd14af962c5a6d604bebac | 720 | rly:26fafc4431c01d61357e398bfe54d47b |

每条tx均为world负数/本公司账户同额正数，两腿相抵；receipt.transactionIds、visible operations cause.id/date/commandId/sourceEventId、relay.collection.operationId/date/amount/receivableId完整对应。两条608不是同一条tx、不是复用同一collection。Nov17确认n15 AX第28行及保存结果n16 AX第34/55行分别保原13.28的确认与实际回响。

## 实际消费者来源

1. workbench-projection.ts:45把原tx.id、tx.date和该账户deltaFen一起输出，没有从客户首条collection另取金额。
2. season-thread.ts:232遍历当前企业的原客户正现金流水，node.id=relay-cash:tx.id、date=tx.date、line=tx.amountFen，payment sourceRef仍同tx.id/date。此处不存在按cause日期另配首条collection金额的路径。
3. :271—274按日期降序/节点ID升序，再在主三节点预算中优先取不同source kind。若payment类入选，当前Q4最新同日三笔是608、720、10000fen；其中ID最前的确是Nov17的rly:123…608fen。10000是另一原客户充值，不能与该次CollectDue相加。11月7日原608在完整留页保持自己的Nov7日期。
4. SeasonRecollection.tsx:36并列渲染同node.date/node.line；来源展开保同tx ID/date。:38保本季allNodes全部原节点，720fen那张与Nov7原608并未被合并或删除。
5. 当前这三份source的bytes/SHA/mode与R4 build的before/after manifest均相同，实际R4/source-binding.json明确绑定该build；不是拿后改helper解释旧R4。

## 建议与限制

无必须修复的日期/金额错误。若Root希望消除“本次”被理解为整次按钮命令合计的歧义，最小可选改法是把单流水文案写为“这条原流水实际流入¥6.08”，继续显示完整原tx引用；不改日期、金额、主节点预算、原收款规则或保护。若未来要显示整命令1328，应严格按同receipt.transactionIds和同账户/company/原客户归属汇总，不按同日/同客户随意聚合，免将充值混入。此为可选呈现建议，本轮没有改源。

59条具名expected/actual字段核对全部一致，详financial-facts.json；这是JSON算术/元数据与静态消费者追链，不是新unit或投影运行。原Season AX文案仅来自Root观察线索：本轮只读扫描R4目录27份现有AX，未恢复到包含“本次现金流入”的原Season AX，因此不声称独立重现那一幅画面。已存确认/结果AX只支持Nov17合计13.28，主回响选择由同R4源码静态追得。

权限边界：未运行产品/投影/helper/codec/syntax/replay/工程/Browser/Git；Node22只执行项目JS guard；未读取未审实计、随机、队列或未来结果。此前写过U4B回应UI/consumer测试，本次原账读回与被测投影执行分离，但非全项目作者隔离、非真人试玩。兼容开发测试0，U4B及完整goal仍未完成。

早期只读摘录命令误用不存在state.clock，实际KeyError exit1后已改读公开economy.asOf；未写产品、未运行引擎、未改原文，不把此摘录错误计作产品缺陷。
