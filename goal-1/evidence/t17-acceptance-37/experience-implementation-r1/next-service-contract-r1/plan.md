# 新期先核合同覆盖

只改RelaySceneChoice.tsx；新增relay-next-service-contract.ts纯公开helper与relay-next-service-contract.test.tsx。原ServiceChoice/ResponseEditor/主pin/草稿实现不动。先决屏仅解释合同是否覆盖最早窗口，不宣称已通过资格/资金/AP/供应/原preview。

helper精确重核同run/account/business/station；addDays(today,1)为最早from，addDays(from,catalog.serviceDays)为原to边界，to<=addDays(termEnd,1)为合同最早覆盖；用原playableThrough限制from，未知日期/重复customer/source明确unknown不补0。稳定原全客户ID/序号，不默认勾选。

当前全部不覆盖则先显示6位合同/窗口与显选续签；有任一覆盖即原ServiceChoice仍可显选服务，不强制续签。当前有效价/源引用、预款保护/应收/企业可花/供应资产/AP仍原口径可读。显选一位同站原customer后用原RelayResponseEditor renew，仍原request/preview/confirm；取消只局部return不改主target，不清原service/renew草稿。原册调用原inspect business,service，无新pin或命令；任何已提交新期才换原generation。

有意义测试原115真实Controller producer＋实际SceneChoice/新条件consumer：全short最早Apr10—May8/原termEnd，显选客户renew的空草稿/原payload、取消/原册同稿/主pin不变，有covers反例原ServiceChoice可用、unknown/stale/readonly/candidate/conflict保护。固定setup20s、it原5s；0工程/Browser，Root统一后验R9。

回滚仅本单UI+新helper/test，保R8编译617旧身份与新源分别。
