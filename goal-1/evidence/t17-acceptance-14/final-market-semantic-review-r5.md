# D09 最终市场语义独立复核 R5

日期：2026-10-21。复核者：game_interaction_research。仅只读复核chrome-final-r11实际PNG、完整AX、11行操作日志、exports、最终原文与原R8保存/重载/独立只读物理原文。实际打开三张PNG目检；没有浏览器操作、游戏重放、测试、几何或兼容检查；没有修改源码、计划、旧报告或旧证据。新报告经父目录guard后wx写入，R3保持原字节。

## P2限定闭合

market-browser-review-r3提出的确定语义问题是：已交收历史首卡当时叫“核对这笔原交收”，实际却打开新交易草稿。R11的market-settled-new-decision-clear-r17.png与同名完整AX实际一致，当前仍选择青棱互联卖款交收、原1244.50元在2020-01-21已经进入原账户；首卡已明确“再写一份新的买卖判断”，说明下一份标的、方向、股数、限价与期限仍由玩家选择，旧记录保留在市场原册。可见CTA是“自己选择，再核对资金与期限”，可访问按钮名“选择一份模拟委托”，不再把写新委托说成检查旧交收。

第二张卡独立写“每一份判断，都保留原来的记录”，显示“资料 · 翻开市场原册”；完整AX含“翻看全部模拟行情、委托与交收”和另一个底部“翻开市场原册”入口。原selector列映河当前持仓、三份原委托、原卖款交收。故本次P2不是删掉旧事项或只换一个泛化标题，而是将“形成新判断”的实际入口与“查旧账”资料入口区分。

实际journal第3行记录点击“选择一份模拟委托”：市场场景17→“给这份判断，留下明确的边界”新Dialog，日期仍1月21日/保存17。第4行独立readback明确account.label为“先选一个账户”、account.value为空字符串。market-new-draft-empty-r17-ax.txt实际显示该空账户选项；六个标的的checkbox均值0，包含停牌与缺资格/无法估值的原公开提示。该页说明只使用截至1月20日公开报价、限价不是成交保证、阅读和返回不提交交易。

因此证据支持“从已交收历史卡明确打开一个未选账户的新独立委托草稿”，没有默认沿用个人账户执行交易。这里只实际读取新Dialog第一页；方向、数量、限价、到期点在后页，本轮没有另读取其具体空值，不能把一句日志not submitted扩大成全部后页字段均已验空，也不声称本轮又执行一次新交易。

第5行实际关闭Dialog后返回市场，同日期/保存17/可花7549.08；第6—9行只翻账本、导出并在“完整存档原文 · 只读”阅读原文。这里“只读”指原文阅读窗口，不是新的一轮写锁readonly标签验证；独立物理只读17由原R8证据承担。最终导出没有新Plan/Place/Advance，R3该语义P2在这次已保存17状态及这条实际点击链上可标限定闭合。

## 最终原档完整保持

以下四份都重新读实际字节，均214997字节、SHA33aa1a1c57907f1b3cdfa832483f62f9aefb5e923e66ec202d717a6d7c1695c2，四份全字节相等：

- chrome-production-r8/normal-market-life-r17-saved.json。
- chrome-production-r8/normal-market-life-r17-after-reload.json。
- chrome-readonly-r8/independent-physical-readonly-r17.json。
- chrome-final-r11/final-production-r11-normal-market-r17-unchanged.json。

实际仍为origin normal、runId life-5fedff3b-eda7-46e6-91cc-2b2959ed0085、revision17、date2020-01-21、17份receipt；末条命令仍为原AdvanceTime，个人真实现金754908分。映河传媒原2000股/本金1792000分/买费1792分，青棱旧卖款124450分的paidAt仍1月21日。全部字节相同也保留原人物承诺/完成、旧订单/撤余量及后续义务；新标题、开草稿、关闭及只读全文没有偷偷改变钱、日期、行动或原记录。

最终画面可花7549.08元、行动1/4、预留0、已保存17，与原文及原R3已核事实一致。该对照是存档保持和本次取消不提交的证据，不是从Create重新执行的证明，也不以“同revision”代替完整字节比较。

## 三张实际图与原末帧错配

1. market-settled-new-decision-clear-r17.png实际可见“这笔原款，已经实际交收。”、青棱原1244.50元、selector卖款交收、首卡新买卖判断和独立原册旁路。与其同名AX完全同一选中事项，本P2闭合的最初画面依据有效。
2. 原final-reviewable-screen-r17.png实际是“持有的是一份判断，浮盈还不是现金。”、selector映河传媒当前持仓、持有/可售2000股，含买费成本17937.92元、当时模拟市值17920元、未实现亏损17.92元；同名旧AX却是青棱原卖款交收。它们同样显示17/1月21日/7549.08，但选中事项不同。本轮发现并立即回报这一真实配对差异；旧文件保持，不能称这一对为同一最终事项，也不能仅据图名推断产品新缺陷。该PNG上的持仓数与真实原position一致，错误在截图/AX帧配对，未证实游戏规则错误。
3. 父采集随后新写final-stable-reviewable-r17.png与其完整AX。本代理又实际打开新PNG并读取AX：两者现在都显示青棱原卖款交收/1月21日/已保存17/可花7549.08/行动1预留0；首卡“再写一份新的买卖判断”、原册旁路、原selector与继续推进1月22日均可见，当前没有打开的Dialog。新稳定配对可作为最后保留可继续画面的依据；不回写旧错配，不声称旧错配不存在，不把只读补拍算一次新游戏命令。

该实际像素层修复提高的是“点进去将做什么”的清晰度：当前事实、玩家新判断和旧账阅读各有位置，画面仍沿A的雨窗/桌面场景与金色主操作，数据对照和原资料入口保留。三张图不是全页面美术验收，也没有证明真人觉得更有趣。原生态时间回响日期重复、长句阅读密度仍留后续精修；本语义闭合不扩展到修它或其他新scope。

## 保留的证据界限

- R3原数字2输入方式的本地文件限制继续存在：旧market-number2-cancel-only-remainder-r16-ax与raw确证原Cancel及同日释放1001元、不增真实现金/AP；但其native-progress没有独立press2动作。父采集原直接CUA调用历史有相应动作来源，由该原历史承担；R11这轮“选择新委托→取消→字节保持”不补生旧press2本地行，也不使这一限制消失。本报告没有重复撤单或用截图文件名充按键事件。
- chrome-final-r11/browser-console-current-r11.json记录当前provider bounded200的warn/error entries为空；仅当前捕获范围，不能说全部历史浏览器无错误。此处不据console代替原文或画面检查。
- 完整Create审核仍待父任务实际执行/交回，本报告没有运行或预判。没有新原子失败/候选重试/全部账户交易或所有市场分支测试；原相应证据与责任保留。不把本P2闭合称整D09/T17/目标完成。
- 真人试玩仍0；旧10月13日原PNG0/3与后来A/B/C样稿3/3分别保持。所有兼容开发/测试0、M01暂停，需用户明确恢复；完整后续范围不变。

[杠精审查] 本P2限定闭合通过：实际核名称、点击目标、空账户、新旧数据与取消效果，逐图目检并主动保留/补核错配；无自动选金额/股数/账户、无新交易、无收益拼接，未掩盖原数字键取证限制或提前宣称完整Create/真人通过。无源码/计划/配置修改，无测试或浏览器动作。REPEAT复用原公开导出、父守卫与新wx证据，不新建Skill、自动化或外部资源。

## 实际读取文件的字节索引

哈希只固定本报告依据；不替代游戏命令审核。旧报告及原失败/错配均保持。

| 文件（相对本目录） | 字节 | SHA256 |
|---|---:|---|
| [market-browser-review-r3.md](market-browser-review-r3.md) | 18867 | edf569e0d3174c1dbb1264f5235aa24d391bcddf0fc9b778a15e922665f836ea |
| [chrome-production-r8/normal-market-life-r17-saved.json](chrome-production-r8/normal-market-life-r17-saved.json) | 214997 | 33aa1a1c57907f1b3cdfa832483f62f9aefb5e923e66ec202d717a6d7c1695c2 |
| [chrome-production-r8/normal-market-life-r17-after-reload.json](chrome-production-r8/normal-market-life-r17-after-reload.json) | 214997 | 33aa1a1c57907f1b3cdfa832483f62f9aefb5e923e66ec202d717a6d7c1695c2 |
| [chrome-readonly-r8/independent-physical-readonly-r17.json](chrome-readonly-r8/independent-physical-readonly-r17.json) | 214997 | 33aa1a1c57907f1b3cdfa832483f62f9aefb5e923e66ec202d717a6d7c1695c2 |
| [chrome-final-r11/final-production-r11-normal-market-r17-unchanged.json](chrome-final-r11/final-production-r11-normal-market-r17-unchanged.json) | 214997 | 33aa1a1c57907f1b3cdfa832483f62f9aefb5e923e66ec202d717a6d7c1695c2 |
| [chrome-final-r11/market-settled-new-decision-clear-r17.png](chrome-final-r11/market-settled-new-decision-clear-r17.png) | 144363 | 1de2119d06b669c81412a8f46c8fbbe194991559eea5022b8c860d13403014ea |
| [chrome-final-r11/market-settled-new-decision-clear-r17-ax.txt](chrome-final-r11/market-settled-new-decision-clear-r17-ax.txt) | 2865 | 16856b9f8f2f6bc8f4a381b2dfe58f0215533c74b6153950f80774f2d8a77eee |
| [chrome-final-r11/market-new-draft-empty-r17-ax.txt](chrome-final-r11/market-new-draft-empty-r17-ax.txt) | 2528 | b114d5e5d6b1eebde0df2e53af9ab5d3cde8c8671f5ebfe07fb2e88579c74cb4 |
| [chrome-final-r11/final-reviewable-screen-r17.png](chrome-final-r11/final-reviewable-screen-r17.png) | 112430 | 534f67cde969db01c7b5c8a253c265205f99138ae33afc03951e5ade9462ec89 |
| [chrome-final-r11/final-reviewable-screen-r17-ax.txt](chrome-final-r11/final-reviewable-screen-r17-ax.txt) | 2865 | 157520209505e08f82be834bd5c0129eeb008e762a7a22a314a49ec3faaa659d |
| [chrome-final-r11/final-stable-reviewable-r17.png](chrome-final-r11/final-stable-reviewable-r17.png) | 144363 | 1de2119d06b669c81412a8f46c8fbbe194991559eea5022b8c860d13403014ea |
| [chrome-final-r11/final-stable-reviewable-r17-ax.txt](chrome-final-r11/final-stable-reviewable-r17-ax.txt) | 2865 | 157520209505e08f82be834bd5c0129eeb008e762a7a22a314a49ec3faaa659d |
| [chrome-final-r11/native-progress.jsonl](chrome-final-r11/native-progress.jsonl) | 6466 | 238a69145401a5b35180e3876d47125f01c0443ba7962741dcc4ccd44d13b32c |
| [chrome-final-r11/exports.jsonl](chrome-final-r11/exports.jsonl) | 518 | 054533b73ac11accd1ff6e5965d496028393e4607322ee7b045fbd6b9098e570 |
| [chrome-final-r11/browser-console-current-r11.json](chrome-final-r11/browser-console-current-r11.json) | 178 | ef4a8bf415e6cb403f5ab1259f61caa22836a26e01e3f0000e1731e19c536fd2 |
