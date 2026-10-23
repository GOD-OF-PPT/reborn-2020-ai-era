# S3-C1 课程近景 UI 交回

新增 CourseSceneChoice / 定向测试 / course-play.css，更新 CoursePreparation。约定 p/target/null/onTarget/onInspect/blockedReason/children(open(intent?)) 已消费；CourseChoiceIntent 导出 fund/outline/activate/define/license/sample/record。

显式选择资金、执笔人/日期，实际旧大纲与营业准备可直接启用；同一堂课选择真实已付案例、形式/主题/受众/同意，再调用原 DefineCourse。许可按business+case独立槽，只有sample槽携courseId；未来/已过日期保持原值，不改今天。当前课程之外的残留许可案例、旧sample、错账户不可提交；已有进行中许可直接查看，完成后显式回关联课程。

原等待沿 playableAdvanceDate/ClockAdvance；停止沿 InterruptJob，已耗成本/行动与原责任保留。所有执行按钮在 Dialog.footer 外于 ScreenBook。只读、候选、冲突、busy、失效、原资格预览同步拦截，不自动招生或下步。原完整册仍可达。

已实际 view_image 查看1536×1024透明低平教案；本地 CSS 只调整course外观的原图/旁签独立两行、接触影、计划虚线/等待/实际记录轮廓，保文本与减少动效原语义。CSS解析40节点、media0。不代表当前Chrome画面或真人理解/趣味性验收。

验证：targeted-r1 两文件7/7；之后仅新文件必要补正，targeted-r2与r3各2/2。新正常用例复用旧正常已挣前史，实际执行资金/大纲/启用/手工案例定义，样课原payload preview通过；不是重新完整Create前史，跨课程许可反例为明确只读显示变体，不导入/不执行。原course-preparation测试源未改。

全项目strict两轮尚红，完整type-r1/r2保留；报错在其他owner并行文件，我方四文件无诊断。最终同源全量type/build与Chrome/完整Create由根收口。未开服务、浏览器、Git、兼容/几何或音频。

[杠精审查] 两次具体补正：历史ready有旧班不再称未招生；残留licenseCase必须属于当前course，进行中许可不重复安排。另已向根报告Narrative外层Action/Wait需同步账户上下文门槛，避免绕过近景校验。此根接线未由我擅改。
