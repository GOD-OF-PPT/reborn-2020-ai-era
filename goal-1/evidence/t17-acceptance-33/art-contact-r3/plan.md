# R3真实镜头接触修正

实际view_image已看chrome-main-r1/r3-01-opening-reentered.jpg：暖纸签已去panel，但kit及短签组落至椅旁。静态根因是room仍top/bottom撑满、首行minmax(0,1fr)且art align-self:end；签组变短后空余首行拉长，把图推下。

仅relay-service-paper.css：将当前room relay舞台锚为160艺术行＋自然纸签，align-content:start/bottom:auto，按当前木桌落点固定构图；纸签接入图底缘与夹扣。保全部文字/AX/actionHint/原绑定与其它route。无整个button hover位移/旋转；textOnly/根text-mode明确取消无图艺术行。无新图、字号/裁切/滚动/断点/几何/兼容测试。

仅CSS解析/选择器静态复核；纯样式不添镜像用例、不重跑type/build。Root后续R4当前自然图才判断接触效果。回滚只此CSS前像。
