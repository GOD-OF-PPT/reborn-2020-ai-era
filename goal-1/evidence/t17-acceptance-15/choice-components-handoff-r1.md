# D10 选择组件交回 R1

范围：仅src/ui/MarketSceneChoice.tsx、src/ui/LifeReferenceChoice.tsx。开工HEAD58fee36f9b124ae07d8ccb8559f7c67dff771244、main、PUBLIC；root15 input/plan/tasks已先读，文件先于本次代码。沿A长日重启的玩家动词/渐进披露，参考game-ui-frontend skill；用户暂停兼容要求覆盖该skill中的通用移动建议。

## 已实施

- 市场两步标题改为“选择股票与账户”→“填写这次买卖的条件”；下一步直接写选择买卖方向和股数。账户、股票、方向、数量、限价、到期点仍为空或明确选择，不自动填交易值。
- 限价字段按已经选择的side显示“最高买价（元/股）”或“最低卖价（元/股）”；side为空保留中性每股限价。到期字段改为“委托有效至”，实际仍提交原matchingCalendar ID。
- 保留模拟/虚构/非历史实盘、公开报价日期、缺资格/未上市/停牌/null报价、限价范围、交易单位、佣金/最低费、可售与交收日差、可花金额及原确认说明；简化“判断/边界/原撮合点”等步骤用语。当前公开价格仍须单独点击才填入。
- 人物选材先显示公开人名、活动标题、个人费用/AP/日数/预计完成日，以及原person.boundary。材料选项用已公开类型+完成日；同类型同日的重复标签补“第N份”，选择key仍为原kind:id。
- 完整来源列表移至select之外的独立details，保留每份原完整ID、类型/日期及重复显示序号。summary没有选择/提交事件，展开可先查看所有来源而不选择；实际选中仍只有原select.onChange。
- 主动作清楚写核对并安排与该人物的活动。材料不代替对方同意、商业许可或治理权的说明保留；返回人物原册继续通过原onFullRecord。

## 静态核定与边界

仅读取TypeScript AST作语法与开工合同比较，不执行组件/规则：

- 两文件parseDiagnostics均0；不是类型检查或运行测试。
- Market的PlaceStockOrder/PlanStockOrder、Life的StartLifeWork，三份kind/payload/confirm/primary序列与HEAD逐字相同。
- 两文件onClick/onChange/onClose/disabled属性序列与HEAD逐字相同。市场locked/stockUnavailable、payload/quoteChanged、空draft、选材空selected及reference绑定相同；marketDraftPayload函数逐字相同。
- 费用/日期/AP/权限、原preview/确认、只读/候选/冲突、报价更新和revision关闭逻辑未改；公共材料对象原样进入原StartLifeWork payload。新增逻辑仅材料显示标签/去同名歧义和步骤文案。
- 没有新语义化作品名称字段，故材料只用公开kind/date；没有编造作品名、客户、对白或隐藏结果。完整ID仍可查。序号仅区别当前列表同名选项，不充当业务ID。
- 未编辑其他源码、样式、测试或旧sealed证据；未运行测试、类型检查、build、浏览器、几何或兼容检查，兼容开发/测试0。父代理统一核定组件交互、来源展开、草稿/取消/保存与累计验证；不能把本静态比较当成这些检查通过。
- 已通知life/helper并行负责人：其首层摘要可去raw ID，完整references和payload不变，本组件的details负责完整来源。没有覆盖对方文件。

[杠精审查] 本限定实施静态通过：实际改进步骤/动作和材料阅读层次，三条原命令及全部原事件/锁保持；没有删费用、日期或权限边界，没有默认材料/交易值。未对未运行的测试或真人清晰度作通过声明。

## 本次文件物理身份

| 文件 | 字节 | SHA256 |
|---|---:|---|
| src/ui/MarketSceneChoice.tsx | 8523 | 4b0167bcb8286af0f34074ff981940d5d488f713cd0ad2f8c2875658b3eb5b99 |
| src/ui/LifeReferenceChoice.tsx | 3488 | 17b0ab83c34bc9c281f9ee836351fad95f0f4367467be6e770fcf075ce2c6dac |
