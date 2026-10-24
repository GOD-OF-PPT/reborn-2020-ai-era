# U3-C2 R10 独立闭班回响审查

本次仅静态读代码及既有R9 AX，不运行测试、类型、构建、preview、模拟、126审核或浏览器。当前type-r10由根代理执行中，其后测试与Native由根代理负责；本文件不预填终态。R9 independent-wait-review-r9.md保持冻结，不回写。

## 原R9实际故障与来源

根代理在当前自然Chrome窗口实际完成原120/2023-04-30闭班后，观察到闭班回响、line与terms重复挤占首层，可选Clock在实际画面中被挤出。这里按根代理的实际观察记录，不把作者读取AX当作鼠标可见证明，也不推出兼容或几何结论。

- 原图：chrome-main-r9/06-r9-class-actually-closed.png，158842B，SHA256 6dd7517ae25b9706e7f82ee05d8920d071e82eaba4075e54cdcaf162e6905b35。
- 同次AX：chrome-main-r9/06-r9-class-actually-closed.ax.txt，3384B，SHA256 19c0bfe17474ef9baed89e3d8e7dcf71f9f1d717ea5ea3a9fd197adbde3210cf。作者实际读取AX第34、37—39行：结清回响、跨季收尾line、留存/退款窗口/结算fee长terms、累计预款/实退/保护/收入连续重复。第47行仍有May1原Clock节点；节点存在不证明其当时实际可见或可点击。原图、AX与raw不改。

## 审阅身份

以下为3份生产文件及1份相关测试的实际完整SHA；测试仅读，不执行。

| 路径 | 字节 | SHA256 |
| --- | ---: | --- |
| src/ui/OpeningMoment.tsx | 48926 | f2d2f65d414d7dbf388e52e5df0046fcbeb69e8fa9d2f8e1db2d188c6abb91b8 |
| src/ui/SceneEcho.tsx | 4461 | 53ecaf537436de4e1cd6371fe4f674420d4ad6dc90c88d5f3c88758bff4fdd5f |
| src/ui/course-teaching-continuity.ts | 6700 | 4a68e88338be44d232c5cbcbcfe3578bdbec76e8144aea56b1778c199b99760c |
| src/ui/CourseTeachingContinuity.test.tsx | 10485 | 075083f5b7df6221edf850bca9d7401b39e3cbcf714cfa488323fa3538886567 |

## 结论与边界

本次增量未见确定阻断，理由限下列源码事实：

1. course-teaching-continuity.ts:34—37先经原strict target、账户与operations验证；原job历史在PaperFor提前走history，不取得后来的closed标记。只有同班closedAt实际存在、原账可完整核对且totalDueFen严格为0才生成closedCopy。短terms使用实际feePaidFen，不把入账费用称实付，不声明全部企业无债。
2. OpeningMoment.tsx:218—222要求classArt确为closed、非history、saveStatus=saved且无candidate；interrupted/requiresChoice/legacy此前已使classArt不可用。缩短反馈还须是SceneTimeNotice本身、compact=true、date等当前view.date，且去掉当前日期前缀后的完整narrative逐字等该班closure-only originalEcho。不是substring匹配，也不只对比第一句。
3. 多事实由courseTeachingSceneResult按facts.join连接；含教学、退款、更新、支持等附加事实的完整文本不等原closure-only句，故不进入closedEcho。不同结果、不同日期、历史job及候选不因此被替换。未精确匹配时保原feedback，仍显示独立闭班line；这没有宣称所有其它重复文本已解决。
4. SceneEcho.tsx:28—31新增brief仅作用compact首层summary。原text与frame继续原样交给可展开SceneEcho，完整回响与原钱/AP/日期事实没有删除；Opening只在上述精确匹配下去重复moment-line。
5. 原四项money仍由courseTeachingMoneyFor显示：累计预款、正值时实际退款、仍保护、教学收入。留存4/5与实际feePaid短terms保原明细入口；闭班后原学员学习、退款和购买身份保留，没有新班、收入、费用、期限、AP、权限或保存行为。原Action/Clock和主念头—物件binding未被此次copy修复改写。

R10尚未Native验证。本文件不证明当前自然窗口中Clock已经可见/可点，不代替鼠标、键盘、同次画面/AX及重进验证；不增加兼容、多尺寸、缩放、离页或book-layout专项结论，不标本片或全goal完成。原R8失败98与R9修后分支继续分开保留。

文件经实际browser_evidence_guard保护root32及全部祖先后wx新建，写后作者停止writer；没有修改任何src、master或旧证据，也未启动审核。
