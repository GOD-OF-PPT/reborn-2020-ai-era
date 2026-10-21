# T17 / 5c-U1 折叠服务票单结构独立审查 R8

审查者：/root/relay_final_review。结论：该结构增量限定通过，未发现新增确定可触发的代码缺陷。本报告仅审阅轻票签、完整票单Dialog和页脚原册接线，不是实际Chrome画面/页数、游戏、全5c、T17或goal验收。

写前只读核实：GOD-OF-PPT/reborn-2020-ai-era，owner GOD-OF-PPT，PUBLIC；main，HEAD 7f7f0dfcb5d6f86e46ac11585f94c32817f16caa。审阅对象是该HEAD之上的当前冻结工作树。原R2及读信R6报告哈希均保持原值，本报告独立新增，不回写历史。

## 具体核查

1. **同一周期与全部原记录**：RelaySceneChoice.tsx:13的轻票签和:24的RelayServiceRecord都用progress.periodId从同一公开relay.periods取原单。完整记录保留客户数、原供应顺序、28日记录口径、报告用量、不足/停止原因、真实支持状态、已复核/未更正差额及旧余额/应收应付提示；没有改用最新周期的身份。多周期onNext仍由NarrativeScene原periodIds/index循环选择；其ScreenBook key仍含所选periodId，切期会重建该期票单局部打开状态。

2. **Dialog与草稿**：轻票签展开只setOpen(true)，关闭只setOpen(false)；票单本身没有可提交表单或业务写入口。完整记录沿用Dialog，portal仍挂到.game-app，内容沿用Dialog内部ScreenBook，未内联裁切为一页。由完整单进入原册时先关票单，再调用原onFullRecord。审计资源、日期、原payload、日期助手和确认保持原逻辑；票单展开/收起不改这些草稿，ScreenBook本身仍保留children挂载，不因翻页丢草稿。

3. **只读与保存保护**：轻票签、切期、完整记录和页脚只导航或改局部UI状态，不调用request/submit，也不改变款项/日期/权限。实际业务Action、RelayAuditChoice和CommandButton保持原载荷、preview、只读/candidate禁用及保存入口；本轮没有新增读票单即执行的命令。

4. **原册与完整内容保留**：NarrativeScene删除的是重复的原册Choice，保留当前阶段主操作；原册入口迁到原有scene-turn页脚，onClick仍为p.onOpen()，relay的aria-label仍为“翻看全部中转、客户与原安排”，包含关闭阶段在内也保留入口。票签仍有多period切换，完整单仍有原客户/账入口，原RelayPanel经营和历史内容未被这次结构变更替换。重复说明不再占主选择页，不代表删去专业操作。

5. **书页与样式边界**：scene-decisions.css相对HEAD仅追加票签和完整记录样式；没有修改原分页算法、书页数量计算、原children或引入display:none/overflow裁切/固定页数。没有新增视口断点或缩放规则；完整记录正文使用16px，原同类纸页正文为14px。Dialog和ScreenBook沿用现有自动分页与章节/页码入口。这里核实的是代码结构未删漏内容，实际1/1页或主选择可见仍由主控当前Chrome证据证明。

已读取相应测试源：它把轻票签与完整记录分别渲染并继续检查报告用量、中断支持、仅未更正公开差额、多period、只读/candidate禁用和原册存在；没有把显示夹具改称正常游玩。此审查未运行测试，未引用主控R7或尚在运行的R8预期项数作为通过证据。

本次未修改源码、测试或任务文件；未运行测试、类型检查、build、浏览器或任何兼容检查。兼容性开发/测试为0。最终生产包、Chrome业务保存重载与Create原文审核仍由主控分别完成。

[杠精审查] 限定通过：对照原票单逐项检查了移入Dialog后的公开记录、period身份、多period切换、原册和实际命令保留；没有用静态渲染断言冒充交互/视觉验证，也没有引入未触发的尺寸建议。

## 写前后保持不变的 SHA256

| 文件 | SHA256 |
|---|---|
| src/ui/RelaySceneChoice.tsx | 4844dfe15970b062e7a4be84227098bfbee1790ec2fe96f9ee0044b0c1a779e8 |
| src/ui/RelaySceneChoice.test.tsx | a33a063b00cd2d4c1764e56ed3a668558f3dfcb8bab9941ee6231237fce3e640 |
| src/ui/NarrativeScene.tsx | ea9e2a7f5cf88f57a0259393af9a11af11cac7e9f524ffde27ffca0b32bbe55c |
| src/ui/scene-decisions.css | 3772f90ee195d1753bb044a8cb78b2e0fd38e6f51a2a0423d966edb6eb05ca22 |
| src/ui/relay-scene-progress.ts | a559e5f66e0ba33e00312a54cff33ea733bf00c3a2767a4e194a016c4afd52cf |
| src/ui/scene-result.ts | c725d7a2c0e1555ce0cec8e92fcbe24371b00b301b61dee8cd419b1d7c030329 |
| src/ui/relay-audit-dates.ts | f971ec7926a17b4b6ab844179b80acb6a8f4c83147e8d8805a6b6e02ce20ea82 |
| src/ui/Dialog.tsx | c41652816ceeb77a98bf281ee3d5c8bfba243c531e1175fc82fe7f8fff3d8083 |
| src/ui/ScreenBook.tsx | 9ec810b63bc6d67831f145ea0b172ebc427d65ee90b629fc75d1da16d56a48f9 |
| goal-1/evidence/t17-acceptance-11/independent-code-review-r2.md | ee5587c68a0124b47027554b5161aba27d84fe415034b250418baa46a4a6b62f |
| goal-1/evidence/t17-acceptance-11/independent-read-letter-review-r6.md | ec8b4a53fd2f826906d015c37acd2dec21fdfb118d9e0d9c2264b167074329e6 |
