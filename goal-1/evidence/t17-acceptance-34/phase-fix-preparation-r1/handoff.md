# 未应用补丁交回

仅准备3源：course-teaching-continuity.ts、course-preparation-paper.css、CoursePreparationInteraction.test.tsx。changes.unapplied.patch可供逐行审阅；.before.txt为准确原字节，.proposed.txt为未应用提议，完整SHA见preimage-and-proposal.json。实际src初末均同；未应用/测试/type/build/浏览器。

F01：helper只接真实audience/cohort，删除course-ready→audience/choice。OpeningObject原绘制优先prep本来正确，不改其通用优先级。OpeningMoment将回落stageLabel中“样课已经完成·招生仍另行决定”；courseDisplayTitle仅针对audience/cohort，对course准备无新重复标题。CourseEncounter将自动回到“这一份教学准备的决定”/“眼前这份教案·由你决定”和“样课已经完成”。MoneyFor/ClosureFor只处理cohort，原学费保护/收入/结清不改。

F02：仅准备物件根普通与hover/focus-visible/active/disabled背景透明；原transform/transition无位移保持。不碰全局button、视口/断点、尺寸、字体、copy底色字色、保护标记或focus outline。透明根仍允许copy原hover反馈与可见焦点。

测试全盘静态搜索：现有test没有直接courseTeachingPaperFor调用或对“course-ready生成未来audience/choice”的断言，亦没有data-teaching-phase/这次受众与报价/学员标题的绑定回归。CoursePreparationInteraction现有同正常86/shared-binding用例只核sample-ready和同handler/textOnly，现提议复用它额外核0audience/0cohort、无teachingPaper、准确stageLabel与近景准备标题；原断言和时限全保，无新fixture或昂贵Create链。原CourseTeachingPaper的装饰性phase/status矩阵仍保留，包括audience/choice图层能力；它不证明准备course已有真实受众，不应为凑补丁删阶段。原TeachingContinuity真实audience90/cohort92/历史job/退款/closed与原MoneyFor/ClosureFor断言不需改期望。

解冻后建议主控应用3源，再按原门槛统一相关准备Interaction/Paper、TeachingContinuity/Paper与类型/构建；不将当前182红或隔离重跑改成全绿。实际材质必须用当前自然窗口同86回响未收起的物件hover+键盘focus核同次图片/DOM；文本/减少动效与candidate/readonly保护仍保留，不新增兼容/几何矩阵。

本目录是未应用准备，不标CUX-F01/F02已修，不提前关闭checkpoint。收到主控明确source解冻前停止所有源写入；本准备writer现在停止。
