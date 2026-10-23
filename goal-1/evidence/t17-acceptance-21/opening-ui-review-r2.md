# S1接线定向复核 r2

本轮只读复核r1的三项，以及已采集的 `chrome-dev-r1/first-order-stable.png`、`wish-grid-final.png`；未启动浏览器、测试、服务或Git，不做几何/兼容检查。源码结论与截图结论分别记载，以下行号对应本轮读取时。

| r1项 | r2判断 | 当前依据与边界 |
|---|---|---|
| 投资物件近景与主操作不同 | **源码闭合** | `OpeningMoment.tsx:71–96` 只保留一个外包 `MarketSceneChoice`，主幕 `:80` 和近景 `:89` 都传同一个 `openOrder` 给 `originalAction`；`:64` 先关物件近景再开该委托选择，草稿所有者不随物件近景关闭而卸载。实际填写、返回、确认取消后草稿一致仍须浏览器核验。 |
| portal近景/随身册样式缺失 | **部分闭合，剩1处必要修正** | `opening-play.css:23–36` 已直接使用 `.opening-paper`，可命中被 `Dialog` portal 到应用根的内容；方向选择、随身册记录及命令包装器新增了近景样式。但直接原生按钮的主操作仍漏选，见下。 |
| 工作首幕重复WorkQuarter | **源码闭合** | `OpeningMoment.tsx:83` 增加 `moment.command?.kind!=='WorkQuarter'`，主命令已是季度工作时不再生成同一副命令；改走生活/查看旁路。没有自动接受工作。 |

**[P2] 剩余选择器缺口：近景的直接按钮仍落旧宽金块。** `OpeningMoment.tsx:61` 的 `action()` 返回 `button.moment-decision.moment-primary`；投资选择、paid后续与普通原记录主操作均使用此形状。`opening-play.css:34` 只匹配 `.opening-paper .moment-decision>button`，不会命中按钮自身；其正文/副说明继续落到 `game-clarity.css:6–8` 的旧100%宽主按钮。应将 `.opening-paper button.moment-decision` 与包装器子按钮一起纳入近景规则，并给其 `small`、主态/聚焦一致样式。保持portal、ScreenBook与原动作不变，不必调整页面尺寸或全局专业页。

本次截图支持的画面事实：

- **手工单当前首幕：** 顶部仅一组现金/四点/保存状态；左侧有愿望与本季意图、同对象标题、报价/期限/成本、01接单与02工作及探索；右侧显示真实文件夹前景及DOM旁签，底部有随身册和牵挂日历。首幕已呈现细行念头，未再使用原横贯场景的大金卡。日期为1月1日、保存第1次；此图不证明已经接单、制作或到账。
- **层级：** 外包 `MarketSceneChoice` 本身返回Fragment，`OpeningMoment` 子内容仍为意图、文字section、物件的同级DOM；`CinematicRoom` 的stage直属物件选择器继续成立。文件夹没有回到左侧文字栏。是否每个后续状态的内容都完整可读，仍待实际小循环。
- **愿望独立一幕：** `Home.tsx:24–30` 已分 identity→wish→approach；`wish-grid-final.png` 明确显示四个愿望以2×2展开、当前选中生活自主、费用/行动不增加的说明与前后步骤按钮。该图是独立问题修缮后的证据；本轮未引用早两张旧愿望状态图来证明新源。

本次未发现这三处修正新增规则命令、成功状态或失败后物件更新逻辑。未重新执行只读/候选重试、完整三路径、原记录往返或实际交互；r1对这些项目的源码边界与后续验收责任保持。当前尚不能将S1或整体体验标为完成。
