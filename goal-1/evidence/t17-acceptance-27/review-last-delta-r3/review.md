# R6最后三文件增量：限定只读结论

未发现本次增量的新确定阻断。结论仅覆盖下面三文件和实际字节差集；不是原生R6、整体R1、主线理解/艺术或整局验收通过。

## 精确范围

相对resume-after-mainline-plan-r2/source-identity.json所列506源/资产/配置，实际lstat/大小/mode/SHA核定503项一致、仅三项变化，当前同src/assets及其所列根配置范围新增0/缺失0。全部mode仍0644：

| 路径 | 字节前→后 | 当前SHA256 |
| --- | --- | --- |
| src/ui/cinematic.css | 31317→31398 | d50c07d109d694196b0d408741eac2e5435fb759f511f711eafc6d7a65dc02a0 |
| src/ui/relay-scene-progress.ts | 33431→33547 | f34d7d2bfe954c3898d6f3c090dff3eaeee02c328641afa0bd8d5bc15318ef26 |
| src/ui/relay-scene-progress.test.ts | 30801→36278 | 6897a1e8ccfcf9f27155af0de4cfb2f26324e02d8b842291100d3e2a5d9e944f |

原R3审查35个UI身份中，33项字节/模式同；变化仅relay-scene-progress.ts和原test。相对Root27开工清单的当前UI差集实际36，增加的是原已存在cinematic.css的本轮变化，不是新建源码文件。closeout-preparation-r3/candidate-final.json绑定的9个候选/输入身份全部同，本审查未改或执行候选。

## 阶段语义

relay-scene-progress.ts:157—159只增加planned支持的显示标签“等这期原支持开工”；其他状态仍为“等这期原支持完成”。反向去掉该新增行并还原三元分支后，整个生产文件逐字等owner前像。原nextDate/completeAt、command、target/recordId、outcome/resultRefs和所有其他字节均保持。

其适用链可直接核：原active支持由:106—108进入support，未来planned仍由原jobNext取startAt，running仍取原completeAt；既有过去日期分支不变，bound只取原progress.nextDate，不改日期。显式历史job由:164—173保留原job标签和独立wait，未被新whole-period标签覆盖。服务停止仍是non-success，未来原支持/已付成本/原预留不被取消，也不会因显示“开工”提前付费或耗点。没有财务、权限、保存、日期/AP或隐藏事实新计算。

新测试添加两个有意义边界：真实normal94原档的未来planned支持及原文字节/预算；独立F04以原命令停止服务，再到开工日world_update仍planned、同日真实running，分别核开工/完成与1500元/1点实际转换。前者不冒充从Create全新执行，后者不冒充正常六年。独立反剔新增imports/两case后原25case及其时限逐字同。本审查没有执行它们，不把owner已有29项/strict记录重复计为本轮通过。

## 警示样式

cinematic.css:10的变化严格只有三个旧room警示selector增加:not(.opening-scene-active)，原:has(.global-alert,.saved-warning,.unsaved-banner,.test-banner)四类条件与全部声明保留。独立将该selector反替换三次，CSS整文件逐字等前像；因此断点、尺寸/字体阈值、其它selector/声明和模式均未变，没有兼容开发或专项检查。

App.tsx:193、301在playing且room时挂opening-scene-active；readonly/候选/当前DEV不因此丢该class。:303的DEV test-banner、:302/305/306的真实错误、只读与候选警示都会被原后代:has覆盖，现被同一opening排除条件挡住旧relative header/run-bar和收窄stage回退。single-screen.css:4—5、48和opening-play.css:85—100原定位规则继续有效；非opening旧规则仍适用。

修缮没有隐藏警示、删除SafetyNotice/重试/导出控件或新增pointer-events兜底；SafetyNotice的持续入口与原Dialog继续存在。这里证明selector适用边界，不声称实际DEV/真实警示的鼠标命中、键盘、视觉间距已复验。Root的新R6生产/当前自然Chrome仍需按原链验证；不拿旧R5红图当现存缺陷，也不把CSS静态反替换当新原生证据。

## 未执行与责任

本次仅读取源码/owner前像与handoff/清单并做字节比较；未运行测试、type/build、游戏、浏览器、兼容或Git，未poll根19536/66105，未改source/master/构建/候选/旧证据。两个diff工具返回1仅表示预期文件不同，不是测试失败。R1原生R6、完整原文审核、必要最终修缮与收口由Root继续，P3/全部原后续及完整goal不因此勾完。
