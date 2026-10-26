# U0-R限定源审结论

审查基线为ccb14ddde3907cc48869930074c0a023a1559ef7。实际读取18份tracked UI差异与5份新增源，共23份；18份原UI基线bytes/SHA逐项等root36开工记录，所有当前UI差异均已覆盖。原relay-records.ts字节不变，src其它文件未发现对该模块的import引用；P326字节/模式保持。Git只用diff/show读取，无索引、提交、分支或远端变更。

## 发现与处置

发现1项P2：样课实际ready后，PauseBusiness/WindDownBusiness/StopCourseSales仍保该样课；新的courseMeaning此前只核样课完成，会用获客问题覆盖已保存暂停/收尾整幕，而原主动作走停止/恢复选择。已先交Root。Root在声明没有检查运行时登记course-stopped-meaning-fix-r1.intent.json并修正两文件。现course-only meaning要求课程未paused且原企业operating，否则返回null保原阶段文案。

已完整重读修后的scene-meaning.ts与CoursePreparationInteraction.test.tsx：两个既有实际保存case增加空meaning断言，新增真实StopCourseSales case核ready+paused、原result处理器、无audience意图和无新增命令；未删除既有规则断言或放宽门槛。源码层缺陷已解决，本审未运行这些断言。最终限定源码范围没有未交回的确定P1/P2；不是整体验收。

原两项先行P2也核到修复：记录弹层中断/legacy回已有inspect分派，不再把财务责任误导旧教案；Today到期款明确打开同customer/企业原册，customerId专用due锚对准原CollectRelayDue控件，不再只回泛next。

## 关键接缝

- App持有唯一受控Today视角，CinematicRoom读取同值；HUD Today显示个人，返回原focus恢复原账户。UI阅读位置与季度书签、游戏档和原业务主体分离。原App request/preview/confirm/submit和发布链未改。
- RoomTableau只接ReactNode槽和状态数据标记；无命令、预览、业务状态、时钟或保存owner。原物件与主念头仍用同binding，局部材质按现状态表达。CSS不建立规则，责任文字/金额仍有DOM去处；实际整幅画面、焦点与长回响另由Root当前Chrome核。
- audience是纯UI意图，OpeningMoment/Narrative完整转发，ThreadAction核原focus/progress/账户/历史/强制责任后才直达原TeachingChoice。原业务cmd/payload、同身份草稿与preview/confirm/save/retry不另造；6000费及差额、匹配来源读公开事实，未默认报价/人选/资源。
- 新scene事实只读当前已提交view/features，未把候选当结果；原makeSharedAction和命令preview继续挡候选、冲突、保存中、旧实例以及只读写入。只读仍可阅读，不获得业务权限。
- RelayPanel仅新增同customerId到期锚及定位优先，完整run/account/business/station/customer解析先行；CollectRelayDue的payload、request、label及confirm行为逐字保原，仍收该客户全部到期原单，不增逐单或部分收款。未来/零到期回原customer锚，失效拒绝且不换人。
- firstOrderFacts按原阶段分报价/预留/实付/收入/实收，去重字段迁入分行事实、原纸签、记录弹层及完整原册。全局到期责任、独立风险和候选处理不因普通信息预算被删。

## 版本时间线与范围

早期源读取经历Root的受控两文件修复，不能说全程源不变。Root修复intent在08:10:47；正式scope.json在08:11:08捕获，已经是修后版本。最终23份全部等该修后正式快照；旧版本身份来自原intent，不能把它伪作scope.json的前像。详见controlled-update.json、scope.json与final-scope.json。初始/最终diff均以其实际捕获时间留存。

本审没有运行测试、类型、构建、Native、投影或新业务命令。旧146绿测不替新源全验；Root定向及97UI验证独立记录。人类理解/趣味、美术认可、兼容、P3正式62/22及整个goal保持原边界。
