# 权益回响的公开字段与原动作迁移

只读数据源：deepseek-schema.ts的已保存记录，经projectDeepseek去除私有factId；sceneCommands v1仅公开commandId/kind/date/revisionAfter/identifiers，view.receipts仅commandId/kind/revisionAfter/summary（没有日期或payload）。不能读取隐藏队列/事实、重放未来或把不存在的receipt.date当来源。Scene命令用同run+committedRevision、唯一command/原receipt metadata、同identifier和原effect ID核定；日期再与有日期的原业务/现金记录核，转让原命令是其原日期来源，不以dueAt倒推。

|节点|实际终态来源|金额和状态|同对象原入口|
|---|---|---|---|
|关系/资格准备|preparation+同job completed/completeAt或真实停止/releasedAt|equityDirectCosts同job原cost operation+负现金配对；未知费用不补0；完成不发股|preparation完整target|
|邀请报告/拒绝/中间服务费|invitation.reportAt与job实际完成/原Reject命令/原brokerPayment现金|授权与融资意愿仅已公开布尔；报告不发股。中间费是实费，不是本金|invitation完整target|
|谈判回应/收起|negotiation.respondedAt/accepted/同job及原Decline命令|拟议本金与已付谈判费分开；收到答复本身不签署发股，不能用当前已签状态否认同日独立签署|negotiation完整target|
|首次签署|原Sign命令→a.id；初轮deepseekId(round1,a.id)，initialShares/initialCostFen/原lot与负现金|原取得2500与原本金20000，不用当前2812/22496倒算；new_capital与secondary分别说钱给项目还是原卖方|agreement完整target|
|追加/明确0/到期默认|a.followAt/followDecision/原唯一后续round；正额原Follow命令与follow-acquire lot/cash，0显选有原命令，默认是原world事件round|原已付2496/新增312/原新股本，0元0新股仍列实际稀释。默认不能写玩家明确选0；估值/新资本不当现金。历史增量读原lot.shares，不能用当前持股或逆推已售份额|同agreement，原round/command/operation refs|
|治理回应/停止|governance.resolvedAt/approved和同job/actual release|原已付会议费；通过/拒绝分开，不给单方控制，未完成不披露结果|governance完整target|
|买方回应/停止|exit.responseAt/buyerWilling/同job实际状态|原询价费；愿意报价不等于成交，拒绝保成本/未售份额，过期不抹真实旧回应|exit完整target|
|实际转让|原Accept命令/e.operationId、已核原receivable/soldShares|只形成净应收与原到期，不称收到现金；同日实收另列，不否认别的已发生后果。费用不在UI重算|同exit|
|每笔原款收取|每个collectionOperationId对应唯一原Collect命令及同account/exit/date现金正额|单笔实收不重复确认收益；能核完整原序列才列当次后余款，多笔同日按原revision排，不合成一笔或拿当前余款冒历史|同exit，逐原operation/command refs|

全部目标先resolveEquitySceneTarget，以真实account/business/job/parent/asset关联核身份，未给写权限。只追加已发生且date<=view.date节点，再沿原seasonRecollection季度from/through去重/近3+全部分页；不新增存档字段或季度。历史节点用原原始量，原任务/本金/现金不同性质分开。全部仍能回原记录，不因missing/duplicate/foreign/stale读成另一条。原准备/报告/非成功/0默认/治理/转让收款合法结果需分别验证；无来源不编金额/时间，原完整册仍保。只增加UI可选sequence用于同日新权益命令的真实顺序，旧节点没有该字段时保原排序。

R176真实原命令签名已核：122 Follow，123 Life workspace，124 Advance Sep8，125 Sep10，126 Sep15，127 Sep20，128 Sep30；没有猜测的Sep29。七条为本轮Native实际新core命令，不把PublicWait一次点击当一条命令，也不把主局前史称Native自2020。
