# Today 零行动：日历仍在继续
上一597/05ba11bf为progress。新组三项第2片，第3片时间回响后累计。A长日重启电影叙事、原住处/日历材质，玩家清楚下一步是等待或翻阅。

3 owned UI：TodayScene.tsx、新TodayIdleAction.tsx、today-no-actions.test.tsx。原Today同run/revision/date/quarter、playing/saved、4点预算available0且spent+reserved4、非季末/强制/短缺/到期应付/待邀请或未兑现，且无todayReadingGroups.continuing原事项、有原wait时，显示“这季的行动，已经用完/排进日历”，解释仍可翻阅、原费用照常。真实结果事实和持仓仍可见，不抹成本/旧约。

原ClockAdvance按原date/label/room/showReason/confirm/renderAction直接复用，主念头与日历物件共用同binding，main/review节点各一份。不得另做AdvanceTime、自创下一事件分类、跳费用或屏障；等候仍可原先核对及取消。原第二Clock位置换轻入口“翻阅今天的选择”，打开已有8方向，不执行新命令。非该条件完整保原Today，包括所有原工作/业务/款项/邀请/季末/防护原因。当前状态只解释四点，不表示所有可能零费行为都被禁用。

原日期主锚/完成事实/资金责任/持仓保留；物件签“今天·先不新增”且动作绑定原时间，不再写仍可安排。无新位图/声音/依赖/CSS/规则。原8方向仍可显选，原资格与费用继续原确认。

验证：正常内存休整+住处+见面+兑现用完4点，原Today零点主Clock与物件同回调，review/原requestWait日期/确认同、8方向可读不发命令；有余点/旧工作/邀请/强制/季末/财务保原，预留vs已用用明确公开UI例不冒正常预留实玩。完整相关纯UI、类型/构建与原源码/前封存保护。Chrome沿自有5764原Jan21住处完成/22500/AP0，回Today主等待/阅读材料/8方向/原确认取消，再按原等待先到真实反馈（Jan22事件等实际为准），保原费用与义务。存读档/codec/replay/import/export/fault、兼容/尺寸/缩放/几何测试全0。

回滚仅3 UI及Main入口，原资产/混合WIP/旧封存/用户主人生不动；精确owned本地提交不push。完整U6/T17/P3/PNG/真人/后续/goal ACTIVE。

[杠精预审] AP0不等于没有可操作事项；只对无继续事项的非强制Today换焦点，所有阅读/零费原动作仍可达。不能隐藏真实完成或钱，更不能用装饰日历自己造推进请求。

598原52/53：新测试将Scene的伪hook槽复用于独立CommandButton渲染，导致null ref，另新测试RoomTableau import未使用引类型红；599仅移除未用import并给独立根清空hook槽，产品源不变。原598失败保持，修后重核相同7完整纯UI及类型/构建，不冒前批全绿。

599 Chrome01发现新阅读按钮继承全局暗字且与“想想今天”重复。600仅给该按钮已有moment-explore轻阅读class、idle时收掉同义record按钮，原status/calendarStatus依旧可见；原其他buttons classname默认undefined保持。无新CSS或字号/窗口变化，最终图单验并重核相关完整UI/类型/构建。
