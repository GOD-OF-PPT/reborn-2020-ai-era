# R9安排页局部排版交回

已view R3实际第2页：今天开工按钮与主体说明孤立，其余大片空白。当前新源仍将资源、日期、今天按钮顺序串排；本次只将资源/日期并列同组，并把今天按钮留在日期列，保字段与其文字/handler，缩短泛泛提示，不缩字号。成本估算、已选客户/方式/素材、付款主体、资源冲突/四点/资格/完成日、失效资源和过期日期提示全部保留。

仅VideoSceneChoice JSX显示块和video-play.css；准确diff见local-layout.diff。scope-check证根新增import/scope/readDraft/edit/chooseTarget及全部JSX前逻辑逐字一致；将排版块和一句提示逆回后全组件即还原原像，原parser/回调/guard/footer保持。CSS语法/TSX语法通过，无新media/断点/视口单位、字号缩小、裁切或隐藏。

此变更使资源与日期靠近，日期/今天按钮作为一组阅读，目标是减少孤页。没有运行normal/strict/浏览器或兼容/几何专项；不保证所有状态一页，长警告与完整责任仍允许分页。根R4同当前窗口实际截图/点选继续核，本静态检查不替代实际效果。源码冻结见final-source.json。
