# U3-V：两入口VideoEncounter代码/TA独立复核

2026-10-24。只读复核新VideoEncounter、视频页NarrativeScene与房间OpeningMoment；重读root30三文件最新补充。写前实际通过父目录browser_evidence_guard。没有改生产/旧报告/master，没有浏览器、游戏命令、Vitest/type/build或重负载Node；Root小批session23860的终态不由本报告预填。没有尺寸、断点、缩放或几何实验。

当前未见新增钱/命令/保护绕过的确定阻断。两入口已经共享业务阶段图层和主动作，仍有两处具体阅读/字号残留，已交Root。此结论仅属所列源码，不是新画面或整U3-V/C-UX03验收。

## 同对象与状态

- [NarrativeScene](../../../src/ui/NarrativeScene.tsx) 第135—138行由同target与当前account生成videoThread；invalid不继续呈原command/wait。第197—199行仅在无原交付屏障/暂停且有效thread时进入VideoEncounter；失效入口仍可显式重选，不默认创建或换账号。房间则由既有关注身份传thread owner账户给近景，两者都保原target。
- [VideoEncounter](../../../src/ui/VideoEncounter.tsx) 第29—45行复用[VideoThreadAction](../../../src/ui/VideoThreadAction.tsx)。主按钮与物件使用同primary.binding的label、disabled、activate；cloneElement仅加原数字键查找class，没有复制命令、自动提交或额外日期。review/submit/collect仍原CommandButton，wait仍原ClockAdvance，结果开next，history回Today；Today/life均只是显式UI导航。
- [videoPaperFor](../../../src/ui/video-continuity.ts)对两入口相同：planned/making/review/delivery/feedback/revision/settlement/result/non-success/history逐阶段读已提交thread。平台观察窗口继续feedback，应收未收或到期待收继续settlement；新层没有金额或假收益。真正carry保业务当前阶段，history才收为旧页。失败层为收起纸件；房间和Encounter均已将non-success类别改letter，前轮失败收据问题在本次读取源中保持闭合。
- 两入口不是每一条短标签完全相同：Encounter对推广/统计actual用portfolio，房间仍按actual用receipt；SVG都为中性result。当前文字没有把播放/询价写为实收，但房间收据式双边与视频页普通边不宜在后续报告笼统称全状态完全一致，实际图须核其是否引起现金联想。本轮没有因此扩大统一组件或改规则。

## readonly、候选及文字模式

[shared-action](../../../src/ui/shared-action.ts)继续在真正stable read_only下允许纯阅读选择；写命令/时间推进仍由原guard拒绝。candidate/unsaved/conflict/busy/陈旧view会锁原binding。Encounter保护只加readonly/unsaved/unavailable旁签，不替换committed phase、不播结果。其直接测试源码的candidate显示反例是有边界的公共状态输入，不能由此冒称真实Native事务故障已核；本审查也没有执行这些测试。

OpeningObject在textOnly时根本不渲艺术span；CSS文字模式仍由原更具体选择器隐藏art，阶段/对象/动作与保护说明均保DOM及原生button。新SVG为aria-hidden，图形不承担独立命令/关键文字。新Encounter关闭局部transform/transition，原减少动效与文本设置继续；未加声音或新PNG。

## 已通知Root的两项确定呈现残留

1. [video-encounter.css](../../../src/ui/video-encounter.css) 第15行确有新增font-size:18px；原通用opening-object-title为23px。因此本版本不能写成“未改字号”。没有发现overflow/clip/line-clamp等藏内容声明，也没有新@media或其他at-rule；但若按本轮不靠缩字解决密度的边界，最小做法是去掉18px覆盖，必要用短displayTitle，完整对象留主幕与AX。代码存在字号覆盖不等于已证明实际文本被裁切。
2. NarrativeScene第159/184行h1使用当前progress.title，Encounter第39行再次输出同thread.title。视频当前公开阶段的两者来自同一progress，普通状态会重复同句大标题。最小去重可保外层h1，Encounter改一次明确对象/操作短题，或省其重复句并保原data-book-chapter定位；费用、日期、thread.detail及主操作不能删。待Root当前窗口实图核阅读，不在本报告称它造成已实见遮挡。

## 当前可继续与待真实图

本轮共享接线可继续统一工程及当前自然Chrome：看同对象planned→making→review→submit→feedback/revision→settlement→实收/退出，主念头和物件各实际点一次；readonly/candidate仍原款原物件，原retry后才发布。再核文字/减少动效、原册/日历往返和next→Today/life。实际图片尚未交给本审查，因此人物接触、手机/纸页落桌、遮挡、底部可操作和材料密度均未获本次视觉结论；原R2六态等旧图不能冒称新Encounter通过。也不以自动操作替代本次有效用户反馈或新的无提示人类理解/趣味复测。

## 读取身份与写后对核

以下为实际阅读时版本；若集成随后改变，只据新版本另行复核，不把此表当全仓冻结：

- src/ui/VideoEncounter.tsx：3538B / be7bac6aa46b610e54eb7a593a4980d7920ecc4b51ad634aa0aa5ee851ccdd71
- src/ui/video-encounter.css：2091B / ecbce2a9e5ee81d44609d74bb77145bc247a3d479c504268922e9a1023f9c6eb
- src/ui/NarrativeScene.tsx：46013B / ecfbebd65b970200a87f4f218e6ac5700e5e3cb713a09b09158ca8d24637b1b5
- src/ui/OpeningMoment.tsx：45675B / 38b39826a641af159a35bf67d6bc983a4e3a047db7ccf46240b542798e76a65d
- src/ui/OpeningObject.tsx：6897B / 1960314693c1b71bb5c41f3b5b02119acd09945a92978c3aadf72201b1fe80b7
- src/ui/VideoThreadAction.tsx：2856B / 57e5b572dff307af2b62ed2832a5a86b78b265e6d25d96786a71a6c8fbfa4797
- src/ui/video-continuity.ts：1270B / 582bea9dbbdbe5ca631acf6059a50a9ce49a1dd3f093bcda0cf725afc52a791c
- src/ui/shared-action.ts：2290B / 5562777df4ccdacbd266f29835571e0c18d1977424cf12816ae39fd2cf6e42b7

末核：上述8份源码与读取身份相同。

仅新增本报告；原video-art-r1报告和冻结艺术三文件未改。不声明Root当前小批、构建、Chrome或C-UX03已通过。
