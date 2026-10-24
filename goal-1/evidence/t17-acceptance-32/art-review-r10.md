# R10 当前窗口内容层次与TA图审

实际view_image看4张R10原PNG及原R9闭班红图，读各同名完整AX；本报告绑定.delivery/t17-u3c2-r10、5376、build-r10.source-after正式564输入。**R9闭班重复内容挤掉操作的问题，在R10闭班帧已实际关闭；Today导航帧仍有一项确定TA可读问题。** 不修改源/旧review/主记录，不做浏览器动作、HTTP、测试、尺寸/几何/兼容检查。

1. [01：闭班且回响未收起](chrome-main-r10/01-r10-closure-full-actions-before-dismiss.png)中的短回响仅“本班于2023-04-30实际结清”，重复sceneLine已去；留存4/5人、结算费实付¥39.80与原记录边界可见。01下一选择、02只读原班、2023-05-01原Clock、个人已知待付¥4,000均在实际图上可读，四项钱款仍为累计预款¥995/已实际退¥199/仍保护¥0/教学收入¥796。HUD企业可花¥875.56、AP0/4、预留0；AX已保存120。对比[R9红图](chrome-main-r9/06-r9-class-actually-closed.png)，本次不是收起回响后才显示操作；旧R9失败身份保留。画面可见不单独证明各按钮都已实点，实际点击由Root原journal另证。
2. [02：完整原回响已打开](chrome-main-r10/02-r10-complete-original-echo.png)仍展示原课程/班日期/实际结清与学习退款记录、不自动开新班的完整句子；短摘要没有覆写原Frame。实际图为第1/2页，展示Apr29→Apr30与AP未变；同次AX还包含已用行动、个人/企业资金等原项，不能把AX所含全部分页都称此页肉眼可见或本轮已逐页审过。收入¥796没有被描述为新增现金或净利润。
3. [03：回Today](chrome-main-r10/03-r10-return-today-no-command.png)与[04：生活导航](chrome-main-r10/04-r10-life-navigation-no-command.png)的同次AX均保2023-04-30、保存120、AP0/预留0。Today保企业¥875.56，生活明确切个人¥58,450；这是查看账户变化，不是学费到账。生活图为第1/2页，01生活投入与后续操作仍按原分页，不能声称本轮见面安排已执行。

**仍待修的确定P2：** 03的Today原生日历周围出现大浅底矩形，深色旁签文字又落在深绿底上，实际图中阶段/日期/动作文字很难辨；AX保持全文不能消除此问题。当前R10静态层叠可解释：styles.css第6行button:hover铺#e8dfd0，opening-play.css第337—338行通用hover/focus将copy改深绿，today-scene.css第21行只恢复transform；C2教学物件已有background:none修复，Today[data-day-kind=today]尚无同类底色/纸白copy覆盖。已即时通知Root；最小候选是仅该Today scope的hover/focus-visible/active清button背景、保持原纸白copy与深色文字/焦点边线，不改图/字号/布局或规则。本agent未实施，故此项不能标通过。

非阻断美术边界：闭班folio与课页状态比旧通用徽章更具体，但桌面承托和人物接触仍可改善，右侧两次“结清”标签也仍重复；不因本次内容预算修复称U9/完整美术认可。四幅不覆盖所有C2阶段、只读/候选/支持/退款分支；R9等待越过更新期限的问题也不能由这4幅闭班/导航图推定修复。Root另告SaveExit→Continue已回闭班，本报告尚未读最终raw/重进图，不新增物理保存通过结论。实际图/AX及AI操作不等于结构化无提示真人理解度或趣味性测试。

读取时间：2026-10-24T19:21:44.211Z。来源SHA如下；新报告以wx写，原图片/AX/build与R9旧文件均只读。

| 文件 | bytes | SHA256 |
| --- | ---: | --- |
| chrome-main-r10/01-r10-closure-full-actions-before-dismiss.png | 148995 | c330dc70207b725992b13300fd9dd8fd6bbdf8e275f9f9ecd58056dfea5f1b4d |
| chrome-main-r10/01-r10-closure-full-actions-before-dismiss.ax.txt | 3002 | b71b9041acc4d2111d6dd9e044ebae5def4cceb6a88b9e49f7193b8b40a692de |
| chrome-main-r10/02-r10-complete-original-echo.png | 50791 | 88730d6623035f6c0e0fb703a949acd223173a3ed61225bbad60d1120819a8c2 |
| chrome-main-r10/02-r10-complete-original-echo.ax.txt | 1726 | fd1e166bc9bc5a1d4ba8fa8dd543b62d42c4e9272e2b694a4dd10ba5d63d12b5 |
| chrome-main-r10/03-r10-return-today-no-command.png | 139023 | 674860a8dde26cfab3d066711f4e60af0e14becd390a8307e6158f11407f69c5 |
| chrome-main-r10/03-r10-return-today-no-command.ax.txt | 2757 | 25371794af273673b9af29f50571f9cef5ad4e2ff8f6299ea2805f114ec8ae99 |
| chrome-main-r10/04-r10-life-navigation-no-command.png | 141155 | b155cc2bda7868d45183ac1d32bd0bfd09d081a7c9dd258077d72d7e4605c61b |
| chrome-main-r10/04-r10-life-navigation-no-command.ax.txt | 3270 | 88da4d731da5d17cd01fd4f4aef5771ea91cbc9d304e0eac5ff043726705e8f6 |
| chrome-main-r9/06-r9-class-actually-closed.png | 158842 | 6dd7517ae25b9706e7f82ee05d8920d071e82eaba4075e54cdcaf162e6905b35 |
| chrome-main-r9/06-r9-class-actually-closed.ax.txt | 3384 | 19c0bfe17474ef9baed89e3d8e7dcf71f9f1d717ea5ea3a9fd197adbde3210cf |
| build-r10.result.json | 311 | 9139503e1e2ec2cd39f21927154664e4c89acb229dde4237e4ed0a03ab803527 |
| build-r10.source-after.json | 104545 | ec359a2fe55d0687cd845314a1c6206650cd31fc619d197ffeefe1ee5e6def25 |
