# R4名单/等待接线及R3实际纸签复核

本次实际view_image三PNG并读同次DOM；当前8源与6图/DOM逐身份读回，详inputs-source.json/final-source-readback.json。未写production，未执行Node/游戏单测、类型、构建、浏览器、兼容/尺寸/几何或CPU诊断。源是Root应用后的R4；图片是R3，不能冒称新R4名单/等待已经实际消费。

## 确定问题与最小修法

1. R4源码的超额旧稿恢复顺序：CourseTeachingChoice.tsx:199默认enroll会对所有draft.personIds渲染移除按钮；显式全选167后返回便笺仍保全部167正确，但“逐位翻全部…”和“明确清除本稿名单”排在该长块之后。这是确定的源码顺序，存在恢复入口再次落入长分页末尾的风险，本轮未执行R4 UI，不捏造实际页数。最小把这两个已有控制前移到选中名单块之前；不删逐位移除、不隐藏旧IDs、不默筛/截短、也不改变原payload。已报Root，未自行改。

2. R3实际r3-06-stage1-planned93左下“环顾房间…”与“普通出租屋·2023-01-24”地点行互盖。AP不足提示、退款/教学期限与保护4995本身仍完整可读，不能扩大称盖掉原责任。对应.opening-room .room-current-moment .moment-explore与.opening-room .room-caption；R4等待补丁只加stage-needed的Clock，不改变这个已有moment.wait的planned幕，不能假定该画面已修。最小可避免等待幕继续铺不可执行Work+长理由而提供同对象只读旁路（工作仍原册/书签可达）；若保原灰Work，应让探索与地点有共同保留底带，勿以z-index/缩字/裁切互遮。当前窗口实际阅读修复后仍要根重新截图/实点，不开展尺寸或几何专项。

## R4代码已核事实

- 名单：courseEnrollmentBatch按paidRemainingFen>0的实际留存学员算班额余席；保既有顺序，显式补当前availablePeople。重复/失效/超额返回issue，旧稿不自动过滤或截为5。默认显示草稿及拟保护预款；批次和逐位移除函数setter读最新共享稿，不调用request/onTarget。详细enroll-people仍同enroll槽，完整167人checkbox与明确“不按班额截短”的全选保留；过量仍交原preview拒绝。
- 确认：default和详细页都沿同CommandButton原preview/confirm；拟预款仅取allowed preview的receivedPrepaymentFen/protectedIncreaseFen，明确未实际收款。scope/guard/request/submit仍原合同；候选、只读、错账户、busy、stale revision仍同步锁提交，不把本次草稿当保存。
- 等待：OpeningMoment.tsx:64—68仅有效同cohort的course-stage-needed、无旧job/无已有wait、未季末/未pause/delivery屏障时给可选Clock；取原playableAdvanceDate与公开latestStart的较早日期，只返回大于当前日的值。:134—136对stage-needed的continueDate强制optionalCourseDate；null时即使0AP也不退回safeDate，因此到latestStart或之后没有“借0AP走更远”的回退。原主选择资源/日期保留；02变原Clock，工作仍全入口/书签/原册可达。
- 锁：新Clock仍经ClockAdvance/CommandButton，原可核支出/Advancetime预览和日期屏障不变；readOnly/候选禁执行，unknown/interrupted/legacy不露新旁路。没有自动推进日期/AP或额外免费行动。
- 新waittest按真实saved92和physical95导入帧写了两项：原Jan30/Feb10边界、0/1AP到latestStart无回退、quarterTarget/barrier/错目标/unknown/只读候选及原raw不变。显式字段override已标只UI边界，不冒充引擎接受。这里只读其内容，执行数0，不能预报测试绿。

## R3三图实际可见

- r3-04保存92：实际5名学员、保护预款4995可见，纸签两段都“待安排”，主动作明确第1段资源/日期，期限Jan30开工/Feb9完成与退款May4在正文；没有把预款画成教学已交付。
- r3-06保存93：Jan26—Feb5教学已安排/尚未开工，HUD1可用/1预留；纸签第一段“已安排”、第二段“待安排”，保护仍4995；说明¥0/1点/10日为预留，主等待到Jan26。除上列底部互盖，未见保护或责任词被道具遮掉。
- r3-08独立物理只读95：Feb5、只读标识/处理入口/说明可见，主线接第2段，纸签第1段“已交付”、第2段“待安排”，保护为2497.50；原退款/第二段截止日期仍在正文，不画成整班结束。这里的可点“选择”只是打开近景，不能据其按钮存在说只读能提交；代码守卫仍在。该图不含新的可写保存回响。

这三张没有独立“进行中/running”画面；源码纸签可读原running job，但不补称running已经实图通过，也不从日期跨度代造中间帧。图片的资金/保存事实由Root对应原档链负责，本次不新运行codec/命令或重演。

## 非阻断艺术残留与边界

短“这一班的约定”、两段纸签和保护条带已在实际画面消费，文字/虚实轮廓共同区分待安排/已安排/已交付；没有预画人物教学或收益。教案与桌面仍有叠加/悬浮感，贴人物右臂的轮廓仍略黏连；标题/状态/保存句/右签重复同状态仍耗注意力。右侧物件未遮头像或这几张可见关键文本；不是美术完美或接触问题全闭。

本次2项已报Root，由根决定修后针对性检查和新R4构建/当前Chrome。R3不能替代R4名单便笺/新Clock视觉验证；组件测试、静态漂亮和AI操作都不能冒充正式人类理解/趣味性通过。
