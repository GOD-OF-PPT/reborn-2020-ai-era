# U3-V R1 实图：视频决定与前景物件

2026-10-24，独立只读。已用view_image实际查看R1与原baseline两张PNG，并完整阅读各同次AX；写前新执行父目录browser_evidence_guard。没有改源码/旧证据，没有浏览器、游戏命令、Node测试/type/build或尺寸/缩放/几何检查。Root R2 build16046尚未终态，不由本报告预填。

## 画面事实

[baseline视频入口](chrome-baseline-r1/baseline-video-entry.png)仍是街角电影背景、左侧一块“准备这一份真实视频尝试”选择卡，主操作只进入账号与准备。暖灯/冷青/纸白成立，背景仍比动作更有生活感；它没有本轮新增前景状态件。

[R1实际入口](chrome-main-r1/r1-video-entry.png)将动作改成“为谁做一份视频，先选一个账号”，比泛化准备更明确；但标题“先选一个具体的账号和受众”在h1、章节入口、决定正文重复出现。一个决定被三层同句包围，阅读没有因此更集中。

R1当前可见为第1/2页，决定仍呈横向长按钮，新视频套件不在这一主动作页。右侧手机/支架是原背景中的拍摄构图，不能当成本轮VideoContinuityPaper已消费到可操作前景的证据。[同次AX](chrome-main-r1/r1-video-entry.ax.txt)也在当前页仅列主按钮、翻页与原底部入口，未列新增物件按钮；本报告没有看第二页图片，不能声称第二页具体接触/遮挡情况。Root已实际定位物件被拆到第二页，该定位与第一页图/AX及样式原因一致。

两图可见日期2020-01-01、个人可花26000、行动4/4/预留0、已保存1一致；这里只记录可见状态，不以图片替代raw/官方账务或保存核验。R1底部原日历/作品与客户/推进入口仍可见；没有据截图声称已经逐个实点。

## 源码接缝与当前补正

旧[single-screen.css](../../../src/ui/single-screen.css)第61行 `.cinema-app .book-flow :is(div,section,...) {display:block}` 会覆盖旧低权重 `.video-encounter.scene-action {display:grid}` 及thought flex。它把本应同一决定的文字和物件排成纵向内容，再被原分页拆开；这是当前真实一屏接缝，不是多尺寸或兼容专项。

现已只读看见Root后续两处源补正，不能倒写成R1图已修：

- [video-encounter.css](../../../src/ui/video-encounter.css)对Encounter和thought精确增加cinema-app/book-flow scope，恢复grid/flex优先级；删除18px标题覆盖，没有加新断点、裁切或缩字声明。
- [VideoEncounter](../../../src/ui/VideoEncounter.tsx)删重复strong，将同名data-book-chapter放现有overline；物件displayTitle为空，AX仍用完整title和actionLabel，费用/阶段/detail/真实动作保留。共享VideoThreadAction/binding路径仍在，没有改成图片自己的命令。

最小修法与本次实际问题对应，不需要换背景、重画整张图、隐藏原账或删确认。空物件标题是否留了无用间距、旁签是否重复过多，以及新的同页纸件是否真正落在桌面，仍须R2实图判断；不能由CSS声明推出。

## R2限定复核点

当前自然窗口的新图须实际看到主句只保必要一处，原章格同名可定位；新增图层与主操作在同一决定页，纸件可辨且不遮主操作/原责任。物件与主按钮分别实点应打开同一决定，不自动建立账号/制作/下单；合上/返回保原存档身份。原文字、减少动效和候选/只读继续分层核。原背景手机不算新的状态件，接触感与人物/背景关系必须看真实加载后的图。

本报告将R1判为该视觉接缝需修，不认为整个视频体验或美术已通过。当前改后源可进入R2实际复核，尚无R2实图结论；自动操作不能替代有效用户反馈或新的无提示理解/趣味复测。

## 身份

- chrome-main-r1/r1-video-entry.png：153997B / ca2de34765bdfa5c00f8e484fb932aeef7a7c13b46e5ddec8db0b468dc39ca31
- chrome-main-r1/r1-video-entry.ax.txt：2592B / e7c17d20301724120ecea4d723659539b4001a771f3c23a198bf7ddf35a4a660
- chrome-baseline-r1/baseline-video-entry.png：148833B / 4a20f8932de9a5b59274c205e607f5008b538221a466156383ef6b9446c0b451
- chrome-baseline-r1/baseline-video-entry.ax.txt：2091B / 6737eba8482604765d01df45cbdd703636ad968c8a59e4782271b9e0db947456
- 图后当前补正源 src/ui/VideoEncounter.tsx：3518B / 7ab8f38ee4be06bbb8aca84704b08b7ea0410ec9ae268ac0dec099042345894c
- 图后当前补正源 src/ui/video-encounter.css：1939B / e978e06aa2fa4152b91e5fe91fed14b1f7dbf94af130ad5967584c48193c9098

仅新增本报告，原R1坏图/AX和前一代码审查保持原字节；R1与未来R2分版。到此停止本报告writer，待新真实图。
