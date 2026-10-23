# R8 阅读修缮交回

仅三生产 UI 源与两既有测试改变，相对 R7 完整425源无新增/删除、其余420份完全相同。CommandButton 仅加纯展示可选 reasonText prop，默认仍原 formatter，原 preview/disabled/request 逐段不变；视频 submit 对原 INSUFFICIENT_ACTION_POINTS 首错误替换指定文案，不包装预览。显式 settled 直接读原 acceptedAt/prepayment、settledAt/price-prepayment；feeBps 沿原 BigInt 整数除法，feePosted=false 不称已登记，paidCase=false 保留未付费用。legacy 分支逐段不变，无净利润/累计指标、规则/schema/application/core变动。

真实 raw12：223793B/SHA b3f070983efc2771235cdf566db9bf956020f79c306a929b1147e49b61aadda3，2020-01-08预款+90000分，2020-01-31余款+210000分、费用-15000分。raw70：803880B/SHA 51cf79fd0ec17294a947c6d518284f6a7178c24e22bb733de66e465045ae5250，2022-08-29预款+90000分，2022-10-22余款+210000分、费用-15000分。逐笔 sourceEventId 对原合同，两单 feePosted=true，原费用义务 remainingFen=0。actual-raw-accounting.json 留原文件/exports 来源和白名单字段；未查隐藏facts、无导入/重放/DB、未用余额差算收益。

红：两既有测试加强后2 failed/14 passed（10.95s），各为旧免费提示、未分列预/余款；原红保留。纯展示注入接缝先作等价改动、formatter仍旧 reasonText 后才跑红。绿：指定 progress14 + Choice2 + reselect1 + draft4 = 4文件21/21（Vitest8.17s/进程10436ms）；原默认/每项时限未改。

R8原 tsc -b && vite build 终态0（123634ms），完整425源 before/after/final完全相同，45资源已hash。原R7的45资源也完全相同。资源保全helper首轮将旧manifest的file误作path而失败、未写入；改读实际file字段后通过，失败原因另存build-r8/resource-preservation-helper-repair.json，非测试或构建失败。原Vite包体>500kB告警保留，未改配置。

新目录 .delivery/t17-s3-v1-r8；build-r8/resources.json字段为files[].path/bytes/mode/sha256。HTTP尚待根统一换服后逐字核对。观察5340 PID90310、DEV5341 PID94259，均未由本项停换；DEV仍原进程HMR随新源变化，不能称冻结R8。未做浏览器/Git/DB/兼容；P3保留。静态/SSR/测试/构建不冒充实图、真人或整个S3/goal完成。根继续R8实际重进/画面/完整Create审核。
