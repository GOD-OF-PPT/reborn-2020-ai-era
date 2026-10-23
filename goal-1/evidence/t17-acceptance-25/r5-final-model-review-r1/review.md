# R5共享等待与跨季文案：限定只读通过

当前diff未见新的确定模型/安全问题。R4-W1近景record等待缺口已在源码接缝闭合：主幕与近景调用同一courseStageWaitDate，只有course-stage-needed走原cap/null，其余原planned/running/退款/支持等待没有泛禁。此为静态独审与既有owner回归记录，不称本代理实跑或Chrome已修画面。

## 等待

新course-stage-wait.ts保原Opening helper的全部条件与计算：同cohort/course实际stage、无旧job/历史/已有wait、非季末/原pause/delivery屏障；取playableAdvanceDate与公开latestStart较早者，只返回大于当前日的值。到Jan30返回null，不回退Jan31；日期/阶段身份不符也不回普通safeDate。Opening只import/reexport此函数，Choice的唯一行为差异是phase精确等于course-stage-needed时调用共享函数；非该phase仍原ordinaryDate→playableAdvanceDate。ClockAdvance/CommandButton/原规则未改，不造免费推进或新行动。

## 文案与信息保全

previousFocusNotice必须同时有过去focusQuarter，且focusNotice逐字等于原UI偏好loader生成的已知“来自X、当前Y、不会自动改本季关注”整句。只有此精确冗余句从主幕移入物件Dialog，原状态行补“原书签未变”；其它存储失败/坏原文/未知/权限/自定义notice都不匹配，仍完整主幕显示。对象originQuarter若与偏好record.quarter不同，则保守不压缩原notice，不会把不认识的提示当重复。interrupted仍优先显示“原来的关注仍保留”及原season-return-bookmark，未删除责任提示。

sceneLine仅在非interrupted/requiresChoice/legacy时，从开头剥精确同focusQuarter、同carry/history状态的固定身份前缀；主幕header仍有原季度/对象、stageLabel仍有旧约定/历史标签，真正业务line余文、money/date/期限与moment.detail原样。物件内继续完整moment.line，含旧收支不重记本季收入的原句；未改playerThread、source refs或焦点对象。未知/错误/强制fallback不走此压缩。

feedback保存回响块未变、没有slice/截断/移除；原实际保存后的金额、交付、支持反馈及退款/应付仍沿同一ReactNode显示，不因缩季度通知而伪造或隐去。物件完整原记录入口、同target/recordId、候选/只读与原确认路径未改。

无teachingIntent的受众/班期主选择说明改为只翻同一对象原记录，不声称提交确认；有intent才说核对投入再确认，且用“这次”而非将未开班受众叫成本班。点击仍是原openCourse，没有改命令/日期/AP/钱或授予新权限。

## 证据身份和限制

已读r5-record-wait-fix-r1原红/owner终态：真实92返回record先给Jan31的红保留，后2files8项实际过（11.68s）及strict-owned exit0；机械提取与原断言/时限保留说明可查。当前共享helper/Choice/两原测试/Clock/Command SHA与该次owner终态相同；Opening随后增加本次copy，已不同于该8项执行时Opening源，故不拿旧8项当新copy执行结果。

本复核9文件首末无漂移，源副本/hash和此差异在source-before/source-after/evidence-binding.json。没有本轮Node测试、类型、构建、profile或浏览器动作，没有写production/P3/CSS。Root正在做新copy受影响UI/生产R5与自然窗口实际图109/110后续，未终态本review不预报计数、图齐或遮挡修好。

R4图中长回响遮入口是Root实看发现；只读可确认本次没删责任/错误/实际回响及原对象，不能仅从字更少推实际互盖已消除。R5实际鼠标/显示模式/原文与最后整体接受仍由根单列，不关闭全S3/T17/goal或兼容/真人缺项。
