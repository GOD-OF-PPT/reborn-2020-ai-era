# S1确认动作与前三项修缮复核 r3

结论：**本轮定向范围源码闭合，未发现本次提取footer改变命令或载荷。真实取消/确认尚待新构建重新操作，不能把代码复核记为浏览器通过。** 本轮仅阅读源码并新增此文档；未测试、启动服务、浏览器或Git，也未做几何/兼容检查。行号对应本轮读取版本。

## 确认动作已离开分页inert范围

- `App.tsx:139` 将原“返回调整/就这样决定”提取为 `commandActions`，仅在command modal与confirm存在时生成。返回仍只 `setModal(null)`，没有prepare、submit或AdvanceTime。
- 提交的禁用条件仍为 `!confirm.allowed || state.busy || pendingSubmission!==null`；处理函数仍先捕获原 `modal.intent` 与 `modal.workspace`，保存该commandId/preview后调用 `controller.submit(intent.command)`。交回 `onSubmission` 的runId、screen、label、kind、workspace、`intent.command.payload` 保持原身份；按原commandId关闭modal、finally清pending的逻辑未变。未重建命令、重算载荷、追加收款或时间动作。
- `App.tsx:153` 以 `footer={commandActions}` 传入；`Dialog.tsx:9` 的DOM顺序为heading → `ScreenBook(children)` → footer，footer是ScreenBook的同级后续子节点，不在 `.book-flow` 内。
- `ScreenBook.tsx:20–29` 仅对 `flow.current` 的后代控制项设置tabIndex/inert。因此这两个footer按钮不再属于该分页处理集合。`Dialog.tsx:8` 的焦点收集仍遍历整个dialog，能够包含footer；原关闭/焦点恢复链未修改。
- `opening-play.css:37–38` 直接匹配 `.command-review>.dialog-actions`，以 `flex:none` 在dialog的列布局中保留动作区，正文继续由原ScreenBook分页。这里确认的是DOM与CSS关系，不是实际点击、可见性或焦点回环结果。

此前工具click无效、但AX仍列出按钮的观测，应保留为失败线索；原误命名的cancelled观察不算一次有效取消，也不证明revision/钱/AP未变。新构建须重新执行返回取消与确认，再核真实提交与资源。

## r1/r2项的最终源码状态

| 项目 | 本轮结果 |
|---|---|
| 投资主幕/物件近景不一致 | 单一外包 `MarketSceneChoice` 仍同时供给两处同一个 `openOrder`；近景先关闭再打开，草稿所有者不随物件近景卸载。源码闭合。 |
| portal近景/方向/原册样式 | `.opening-paper` 直接作用域能够命中应用根portal内容；方向与随身册记录规则保留。源码闭合。 |
| 工作首幕重复命令 | 副工作入口仍排除主命令 `WorkQuarter`，不再把同一决定画成01/02。源码闭合。 |
| 直接原生button漏选 | `opening-play.css:34–35` 已把 `.opening-paper button.moment-decision` 及其small，与包装器子按钮纳入同一近景规则。源码闭合。 |
| 意图/物件真实层级 | `OpeningMoment` 仍通过外包render-prop返回Fragment；意图、文字section、前景物件在舞台下并列，未重嵌左栏。未见回退。 |

本次没有形成新的实际画面或操作证据，也未扩大至其他专业页、失败/只读/原重试、完整三条正常链及真人理解度。上述仍由后续构建、真实操作与原文回放分层验收；S1和整体goal不因此完成。
