# 新期先决条件独立静审：一项P1，当前待修

审作者freeze三源RelaySceneChoice28768B/c2357d8d…、relay-next-service-contract3635B/aeca4d02…与新test15862B/28ec1192…，连同原core期限/日历、ServiceChoice、ResponseEditor、draft/共享binding及旧NextServiceJourney。0产品写/工程/type/tests/codec/Browser/R5候选执行；不是实际运行红。

P1｜最早服务窗口在所有正常日期都被误判未知。helper第31行minimumTermEnd:addDays(to,-1)，而core/calendar.ts第25行原addDays要求count>=0。故即使真实115 Apr9/date有效、serviceDays28、fromApr10/toMay8全部正确，这一步仍必抛INVALID_DAY_COUNT，外围catch返回window:null/customers:[]。近景same=false且canDraft=false，既无最早窗口/客户续签选择，也不能进入原ServiceChoice，新入口整体被阻断。新首例期望Apr10—May8/minMay7和6short，与当前源码确定矛盾，但本审未执行它，不能称正式测试失败。

最小修复：minimumTermEnd:addDays(from,v.catalog.serviceDays-1)。serviceDays已经正safeinteger校验，该非负等价式保原core to<=addDays(termEnd,1)，不需修改addDays、core规则、合同门槛或日期上限。serviceDays1时为from+0，同原边界仍正确。修后再核当前source身份并由Root统一执行原14case/受影响旧consumer。

其余已追链未发现确定业务P1/P2：

- 原core真实含from>today/signedAt<=from/to=from+serviceDays/to<=termEnd+1；所以Apr10起28日的结束边界May8、最低termEndMay7是正确含尾日换算。helper不填draft开工日/续签日，日期非法/期限非法/重复原客户/缺原当前价源均unknown，serviceDays未知不默认28；from超过playableThrough时明确不可新安排，不新增尾声经营资格。
- helper严格resolve同run/account/business/station，实际客户按本站原全序号。activeTerms由正式core projectRelay.runtime.terms(c,today)提供当前有效版；当前已谈但未生效报价不会换当前价。helper不读未来quote响应/隐藏实计，不改账/预款/原款/供应资产。此审不将任意未验证stub当正式来源。
- 覆盖只用于新近景的先决分步；有任一真实covers就保原ServiceChoice显选，不强制给所有客户续签，也不替选客户/线路/预算/资源/支持。期限覆盖不冒现金/AP/供应许可/重叠服务全通过，原服务预览确认仍权威。低资源允许先核0费续签，服务照原资金/行动门槛拒绝，不发免费行动或资金。
- 新radio和进入续签read均makeSharedAction(allowReadOnly:true)，当前精确snapshot、busy/unsaved/candidate/conflict/stale拒；readonly仅能看和填UI草稿。RelayResponseEditor按同business target+customer原subject+renew，原context重新核客户源/账户/获客身份、空稿、日期/模式/信用，再原CommandButton.preview/confirm/request。没有新业务command或新默认条件。
- scope/run/target稳定时本地selected/renewing保留；客户失效不换人。取消只清局部renewing或合上dialog；原service draft memory与renew memory各自同run/account/business/station/subject隔离，原册inspect传business,service，不choose/onTargetChange/改旧period pin。只有真正保存新period才换原service generation；原续签不收款/清旧余额。已保存rev变更按原wrapper close，再显选重读新条件，不发布未保存候选结果。

测试界限与必要原consumer适配：作者新14case仍not_run，含真实115/helper窗口/显选Renew原payload/取消两稿/原册/onecovers夹具/readonly-candidate-conflict-stale/未知/失效客户，setup20s与原5s门槛保。现旧RelayNextServiceJourney第1case仍在真实115打开后直接找RelayServiceChoice，而新先决组件应先显示6short/续签；旧elements也不展开新RelayNextServiceConditions，故该case需Root按真实新体验适配，不可删掉原资金/日期/草稿/无pin变化断言或用绿fixture冒真实续签。此处是旧测试期望/驱动需接新组件，不是允许删原能力。

限定结论：先修唯一负日数调用，Root按新源统一工程与R9实际窗口/同客续签/取消/旧期pin重进；此审不发GO或关闭U4B。其它Owner不同UI仍可变，只声明列明文件身份窗。
