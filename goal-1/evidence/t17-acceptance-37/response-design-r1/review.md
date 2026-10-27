# 回应模块静态交回

本代理只新增relay-response-draft.ts、RelayResponseEditor.tsx、RelayResponseEditor.test.tsx；未改现有源/三master/P3/旧记录。Root负责App/game-types/Panel/RecordBook/确认和回响接线。

五种回应全部空初值、显选填全部；canonical key为run/account/business/station/mode/subject kind+ID，source target每次重核，parent路径不切稿。invoice核原customer/source meter或period及target子范围；supplier核本站option/credit身份及原余额；新续签和重报价保全部载荷，不过滤失效人/资源后偷提交。原CommandButton拥有preview/同快照/readonly/candidate/conflict/stale门槛；blockedReason只显示，不把理由字符串当权限。

测试已写10项，含原正常86史的一次单票部分收款经实际Editor→原request(confirm=true)→原Controller保存，原金额/收入/AP/日期与旧binding检查；其余为草稿、公开快照反例和字段/payload保护。当前没有运行tests/type/build/browser/Git，不能记通过。所选原86静态读出2024-11-07、2客户、1张到期meter原单净未收1216分；新测试仅用它作既有正常前史，不冒新Chrome或新Create证据。

[杠精审查] 静态实现通过本组范围：无默认金额/日期/本人/客户，无因新casebook缺失禁止原base足够核的命令，无自动写业务或成功回响，无生命周期一概禁令，原稿取消/分页/重进同组件记忆不清。真实运行及Root全scope审仍待。

注意接线：Editor可children-render {title,body,actions}，缺省自行渲染；p.relayResponseDraftMemory optional由Root添加。application/audience来源明确要求先选客户/账期/本站；供应退回仅business或对应period/meter，若从customer的本站旁账进入，应让玩家明确回本站供应，不能默扩其客户归属。高级requote target为business，subject business ID必须同target。
