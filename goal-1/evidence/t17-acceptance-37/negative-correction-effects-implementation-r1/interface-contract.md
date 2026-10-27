# 共享公开后果接口（先于源码）

relayCorrectionEffects(p:Pick<GamePanelProps,'view'|'features'|'accountId'>, target:RelaySceneTarget, correctionId:string):RelayCorrectionEffects。

顶层status known|partial|unavailable，reason string|null，identity含runId/revision/asOf/businessId/accountId/stationId/periodId/meterId/auditId/correctionId/customerId/supplierId|null，summary/lines/sourceRefs readonly。customer/supplier各独立status known|unavailable和reason、summary/lines/sourceRefs；未知的全部该侧金额null，已核0才0。

customer字段incomeDeltaFen/prepaidConsumedFen/receivableAddedFen/receivableReversedFen/refundRegisteredFen/refundInitiallyPaidFen/refundLaterPaidFen/refundPaidFen/refundDueFen/refundProtectedFen，invoices/reversedInvoices/refunds结构原date/due/ref/op/remaining。supplier字段costDeltaFen/expenseAddedFen/cashPaidFen/creditSettledFen/dueFen/reversedFen/reducedUnpaidFen/restoredAssetFen，expenses/reversals/pools结构原引用日期状态。sourceRefs有kind/id/date/accountId/businessId和可选amountFen/customerId。

所有summary为历史中性该更正/累计/当前措辞；函数纯读，不要求lastreceipt，不发成功/改权限。Rootscene-result须另exactcommitted+newcanonical单次保存保护，paper/Reader直接显示顶层summary或各侧summary，partial保已知侧与另一侧unknown理由。多条reverse同reference不能唯一拆时供应侧unknown，不重放min或规则；完整负调整和原引用仍保原records首层/依据。原key/recordId/target/排序/原字段不变。
