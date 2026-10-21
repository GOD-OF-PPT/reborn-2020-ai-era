# P4实际发现：退款前看清这一次决定

当前旧5312生产与5313 DEV的真实确认截图/AX已保留在chrome-dev-r1；Jan16学员1交付前应退999元、Jan28学员2半交付和Feb7学员3全交付的确认仅有新增费用0元，没有应退额。独立源调查见refund-confirmation-review-r1.md。属于同一P4步骤4已明确允许的实际交互修缮，不转入兼容或另开父任务。

只改UI只读退款说明与现有确认费用标签：使用确认时捕获的公开课程投影，在真实RefundCourseLearners命令下显示原课程/班期/企业、选中实际学员人数、应退总额、未交付原预款部分和已交付收入冲减部分。未知、重复、空、错班/主体/产品或已无可退额时明确无法核对，不过滤后补0。保留原规则拒绝与原子提交，不读取隐藏反馈/随机，不重抽、不改变规则/schema/钱数/日期/AP/权限。

新增费用仍0，标签明确学员退款另列。应退不等于已到账，缺现金仍保留应付与保护；不在UI复制账本逐款全付顺序，不虚构现金支出/保护释放或新增应付精确值。通过实际已保存记录回答到账。

最小接线责任：现有CommandDetails已经接收App.request捕获的确认view/features，它们不得重绑当前新view。原CourseCommandDetails只有command/course/workers，故允许仅在现有调用行额外传递captured view、confirm和accountName；退款分支核真实command.runId/expectedRevision、允许预览及原cohort→course→business→account，原StartCourseStage可选参数调用继续兼容。不改App、确认容器、路由或数据保存守卫；规则拒绝时明确请返回核对，不以UI另造许可。

实际后果反馈增量：原生产Chrome83的H004迟更新导致Apr16全20人/1998000分已交付学费按原规则退款收尾，Apr22才刷新；原closed叙事仍统一称承诺已认真收好。保留该实际截图/AX及原源码作红证，只在course-scene-progress.ts的closed分支依据已提交公开students的refundedFen/paidRemainingFen/outcome区分全退、部分退、无报名、无退款且实际helped；显示原人数与退款处理合计，不把refundedFen这项退款义务口径直接说成现金已到账、盈利或完整兑现。保留原班/原账入口和全部操作，不改规则。现有测试增加实际全退/部分退/空班/未退款履约及公开/存档只读不变，旧正常成功断言不删改，不做兼容或长矩阵。

验证沿原UI单worker/原限时和隔离：先定向红证据/公开截图，再before/half/after、奇数分和部分已退、多选/全班同命令、非法映射、不声称付清与实际接线测试。完成后当前适用UI全批、类型和全新独立build R2，当前Chrome窗口验证新确认/取消/返回与原档不变；必要实际退款和导出Create审核补齐。当前引擎122同字节则历史矩阵不重跑，不把R1 UI/build算R2的新结果。

旧源/构建/截图/失败不覆盖，5312旧交付保留，新的生产preview另新端口；所有页面兼容开发测试继续0，book-layout两多宽度用例仍paused。回滚使用新提交边界，全部P4/5b和后续责任未提前勾。

[杠精审查] 计划限定通过：修复实际决策信息缺失，不凭空扩画面或删业务，也不将费用0误写成退款0。不承诺无法由公开投影证明的现金清偿精确值。
