# S4-R1 焦点与物件交回

已冻结本目录source-final.json的8个生产与2个测试文件；root拥有App/Narrative/game-types/SceneJournal，book拥有RelaySceneChoice/Panel/共享稿，model拥有target/progress/clock，均未覆盖。

## 行为

- relayFocusFor/resolveRelayFocus委托严格公开target解析；relaySceneContext要求实际run/account/operations。空入口只personal；完整目标含run/account/business/station及kind子身份，不填缺失身份。
- relayFocusFromSaved(previous,current,kind,body,existing?)只认同run、saved、+1 revision、无候选/只读、末原回执同kind；StartService唯一实际新增period才发布新ID。复核/更正/原收款/停止保同period原引用；多期复核不拿第一期；AdvanceTime不抢pin。
- season候选含原企业/申请/获客/客户/账期及原service/support/audit job；同audit job不同period保不同候选。责任清单保客户余额/应收和实际任务；季度留页只读原安排、实际任务/复核、更正与现金流水，充值现金不称利润或本期收入。实际收款日期只由原receivable来源tx确定，不猜余额差。
- prefs同UI v1增严格relay variant，保旧raw与失效解释。Opening保持对象真实来源季度，bookmarkQuarter独立判断“原书签未变”；Q3对象/Q4书签已同SSR核。
- 主幕/物件/原册用同target、thread owner账户和候选/未知门槛。低AP或只读候选的02旁路只看同对象，主Clock与探索保留。旧job需明确回本期，不自动换成新安排。
- 已view_image查看根原创relay-service-kit-v1.png并真实import；低平3:2全图，局部接触影与独立DOM短签，relay work标识为端口而非视频三角。原8px间距/底部入口分离保留；无新字号、裁切、滚动、断点或z-index变更；纯文本隐藏图保全文本/原生button，减少动效沿原语义。

## 实际检查与红档

- focus-result-r5：新增2项/2过，原30秒时限未改。来源r0091完整正常原文（1,143,084B，SHAfbb353ba…）经官方importSave；实际head.put abort→物理旧档/候选不发布period→原retry成功→新period→Jan28开工→原停止仍保future support。含实际asset/短签/低AP旁路与两种季度的SSR，不是Chrome。第二项用原normal r105（2,856,590B，SHA478f312b…）核旧audit与各类失效目标及只读raw不变。
- preference-all-result：完整本模块13/13，同当前偏好生产/测试SHA；新relay身份1项包含跨run/account/biz/漏station/混job+meter/额外字段保原raw。
- room-result-r1：原7/7（早于最终低AP/书签显示收口，保历史身份）；target-result-r4：受影响4/4、另5未选（早于书签季度修）。最终focus-r5重新覆盖新季度及低AP/asset。Root统一受影响集可据当前source-final重验，不能将历史7项冒称同最终全部源。CSS PostCSS语法解析成功。
- focus-result-r1红：新测试误用create导revision91，被原store正确拒INVALID_NEW_RUN；已改官方importSave，不改生产/时限。target-result-r3红：新SSR driver漏onFocus，按原uncontrolled契约未选relay；补与Root同受控callback后原断言通过。原JSON/console/terminal与说明完整保留。
- type-r1为开发中原红exit2，含当时wrapper/Panel未落及owned索引返回undefined；后者已局部const收窄，接口已接。按根指令不再重复全项目tsc，最终全局type/build由根统一，未在此声称0。

## 边界与复核

对照root27交付，未改P3/规则/金额/权限/日期/AP、原命令或财务辅助白名单；完整原册/责任和原预览仍在。新图是本地资产实看，当前房间接触/人物叠盖/完整动作需根自然窗口实际Chrome核，未宣称美术完美或真人理解/乐趣。无兼容/几何/resize/zoom、浏览器/服务、imagegen/Git写。R1完整实际循环/原生候选/全Create/最终类型构建仍由根汇总，不关闭R2/R3或整个goal。
