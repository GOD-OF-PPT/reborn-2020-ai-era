# 非UI旧结果的条件继承资格

结论：旧87份non-UI测试文件在本次静态资格核定中均可**有条件引用原执行结果**。这不是本轮新执行87文件，不将旧86文件552断言和独立agency8拼成一次182/184全绿。逐份case、全292节点/13权威/149额外输入与当前身份见[result.json](result.json)。

## 原图与当前变化

直接复用root34/non-ui-inheritance-r1.json原AST图，不创建或运行新解析器。原292个dependencyNodes.current的bytes/SHA/mode今天全部相同、全部bound，原未知load为0；87闭包引用及所有静态边的目标均绑定。13份权威报告身份全部保持，原149项tool/planning/raw输入和9份config/package/lock也同源；P326保持。首读与末读窗口内的全图身份相同。

本轮baseline579份→R9/当前584份，实际自有差异28总份＝23份既有UI修改＋5份新增UI，而不是28再加5。新增为RoomTableau.tsx、room-tableau.css、scene-meaning.ts、scene-meaning.test.ts及u0r-continuity.test.tsx；全部28路径与旧87闭包均无交叉。非UI、资产及config无变更，无删除。并非因“新源不在图中”就推断不影响：已经逐字节核全部原闭包源保持，原边因此仍有效，原入口没有因改动导入新源。这个结论限原图覆盖的语法，任意运行时fs/network/env/eval仍超出静态资格证明。

## 四份确有UI依赖的应用测试

没有将application目录自动视为不依赖UI。四份闭包均完整纳入292节点核定：

| 原文件 | 闭包节点 | UI路径 | 当前结论 |
| --- | --- | --- | --- |
| src/application/clock-commitments.test.ts | 139 | 14 | 无变更/新增交叉、全部节点同源 |
| src/application/epilogue.test.ts | 149 | 22 | 无变更/新增交叉、全部节点同源 |
| src/application/journey.test.ts | 143 | 15 | 无变更/新增交叉、全部节点同源 |
| src/application/life-atomic.test.ts | 143 | 16 | 无变更/新增交叉、全部节点同源 |

这些UI依赖包括Navigation/RouteMark、目标/草稿/进度/金额等；epilogue还含EndingStage、CommandButton、Dialog、ScreenBook、book-layout及ending.css，journey含JourneyPanel，life-atomic含intent-account/confirmation-money。它们不是本轮改动的28份UI，且真实bytes/SHA/mode全部核同；不能省略为“应用层自然不受影响”。原2份P3脚本case仍保留已解释的new URL('../', import.meta.url)仓库目录锚，不当作加载整个目录或假定目录内容不变。

## 当前scope与原执行层次

当前vitest.config.ts仍为src/**/*.test.{ts,tsx}和scripts/relay-critical-*.test.ts；静态枚举185个包含文件，其中98个UI，整book-layout.test.ts按当前暂停要求不启动后为97适用UI。当前non-UI仍精确87，与旧cases逐路径相同，未新增/遗漏。原scripts/relay-critical-audit.test.ts和scripts/relay-critical-run.test.ts两份均在，不将P3脚本作用域从原87中去掉。没有调用Vitest做发现或执行。

原182全套中86份non-UI已通过552断言；story-agency在该原套beforeAll原60000毫秒门槛超时，8项skipped，原失败保留。它之后在同578源/149extra身份下独立按原60000毫秒hooks/it和maxWorkers1通过8项，属于独立证据，不能追溯改写原全套。当前配置maxWorkers2的原文保持，历史执行命令显式maxWorkers1覆盖；本次没有改配置、时限、隔离或实际重新执行。

历史Node binary、node_modules全字节及完整进程环境没有snapshot。条件继承仅证明当前登记的闭包源/配置/锁/输入保持，并保原会话给定的环境假设；不能宣称已排除未记录环境变化。因此不能将本资格报告合并成本轮新测试绿、整体玩法/真人/兼容通过或goal完成。

[杠精审查] 通过本次限定资格：292全节点、13权威、149extra、4份UI-dependent及2份P3脚本均实际核定，87逐份无变化交叉/未知/不绑定。未运行tests/type/build/http/browser/Git，不改产品/主任务/旧报告。需要新的运行时或环境证据时仍须独立验证，不能拿本报告替代。
