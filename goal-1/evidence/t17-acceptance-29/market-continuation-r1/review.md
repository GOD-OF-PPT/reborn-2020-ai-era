# U2投资续接与本季入口复核

限定实现与定向检查已交回。只改3个纯UI模型及3份对应测试；核心、P3、规则、schema、原金额/日期/AP、OpeningMoment/today-thread/App、masters/Git与旧证据未改。无浏览器、兼容或新全仓矩阵。

1. 显式order以同account原fill.id→settlement.sourceId和symbol定位原应收；原订单ID/账户不变，filled/cancelled尚有交收时phase settlement、active true，nextDate取其原dueAt（已到日只限界当前日）。没有造Collect或提前把钱可花；partial仍可Cancel余量，等待取原撮合/交收较早日期并说明未付原款。
2. playerThread同源查询兼用于carry、已付refs和最近结果日期。只有同主体/原fill的实际paidAt<=当前date才进入settlement resultRef；March31原卖单Apr1实际到账显示Q1原对象的本季反馈，不重算收入、不按余额差猜利润。错source/账户的公开display反例不借用其交收，也不构造正常财务档。
3. 空work入口只选当前quarter原employment，指定旧id保持原历史/工资refs且不续约。原正常S2 Apr1用例在修前本就通过：workbench投影已仅列当前季度；新增显式过滤是防御性收紧。修前第二红的历史rows是明确bounded display变体，不能称正常复现。领过Jan31工资但仍在岗时继续等Feb29的原wait断言已保。
4. seasonFocusAfterSave仍先经过openingFocusAfterSave实际saved+1/receipt/same-run/无候选/非只读门槛；仅明确emptyfree、personal、同一playing季度时跟WorkQuarter/StartLifeWork/ResearchMarket/PlanStockOrder/PlaceStockOrder。未改具体pin/跨主体/AdvanceTime策略，不主动清旧书签。Q2五类真实原命令全部验证跟随；原预览未submit、blocked display与旧具体pin均保原。

证据：red-r1实际1逻辑红+1真S2正常通过；red-r2实际9逻辑红/0超时（原单等待、跨季/partial、bounded工作入口、五类Q2跟随）。修后green-market-r1整文件6/6；green-threads-r1精选19通过/28未执行，合计25个不同定向case，三文件原默认/原20s/30s时限和旧断言保持，没有把跳过项称通过。包括真实normal Create→Q1卖单→Q2交收、真实partial卖出→撤余→交收、S2正常Apr1导入和实际原候选abort/retry。原红、旧源、测试用源与最终源身份均保留。

六源与green运行前后全同。未另起全项目tsc；完整strict与Root并行集成统一，定向绿不代替本U2 Chrome/全Create/全项验收。自审未见该窄源范围新确定阻断，完整跨季叙事/美术与保全仍归本任务Root后续。
