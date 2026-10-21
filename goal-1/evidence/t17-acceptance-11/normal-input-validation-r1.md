# 5c-U1 单一正常输入 R1 实际核定

当前技术背景 `technical_employee` / `t16-campaign-0` 已从当前 Create 真实完成至 2025-01-27 r92：91条命令、92份完整规范原文；采集与独立审核的 wrapper/driver 均实际 exit0。独立原审核器从一次 Create 重放91条不同完整命令，92/92原文逐字相同，inputBuffers=0、allByteEqual=true、validationErrors=[]。这些是 generated_normal_input，尚未执行 Chrome，不是六前史、288形态或T17通过。

Chrome建议导入 [beforeService.json](normal-input-r1/beforeService.json)：1159691 B，SHA256 `d2a42c34932414c5473d04c5415af88e0604b944ec3bc0d4aabeaeccf85fbea6`，Jan27 r92，真实服务/支持均planned。另有 [sliceInitial.json](normal-input-r1/sliceInitial.json)：1093553 B，SHA256 `8ae7cfb1fb6c856b7ce4137ce894e85b3e77d8adcb90432fec29ecad5eb39ca3`，Jan1 r79、尚未签客，可用于明确核新的签约/充值而不冒充已有安排为新操作。

原runId `normal-relay-technical_employee-ee9cb440`、schema13 / rules-t16-journey-v1 / world-journey-work-v1 / contentHash d2cb24af…保持；没有注入工资、现金、AP、资格、技能或随机。真实helper callback仅run一个参数，onCommitted捕获每次已codec处理的提交；完整回执规范命令与原请求命令分别存 [commands.json](normal-input-r1/commands.json) 和 [requested-commands.json](normal-input-r1/requested-commands.json)，规范原文r0001—r0092及生成输入日志均完整保留。原请求与回执规范载荷的schema默认项分别记录，不声称两种表示逐字同。

Jan27公开事实：6客（4预付各400000分、2后付各500000分信用），公司现金4207742分、保护/预留2050000分、可花2157742分，其中客户预款保护1600000分、收入0；含应计成本418387分/利润-418387分。Q1 spent1/reserved2/available1。服务Jan28—Feb25与guided支持Feb25—Mar4仍planned，0计量。Jan27 activeTerms仍是原low_margin 10分；已经确认的未来条款按自己的effectiveAt生效，不预测新阶段结果。服务完成、支持完成、真实复核/更正/收款与当前Chrome原子保存仍由主代理实际推进。

来源见 [source-index.json](normal-input-r1/source-index.json)：134份执行源/配置真实冻结与结束读回一致。原122路径显式runtime/type/config闭包与C16交集117，三文件实际hash差异是campaign.ts、cash-forecast.ts、core/commands.ts；旧索引缺两个clock模块与三个tsconfig，不声称旧C16全源同。原normal-relay helper仍原字节。对原T16同seed结果实际比较：Create与前91条回执规范命令完全相同，旧记录没有中途raw，不制造旧midpoint原文；C16默认normal-relay-s03-v1为不同seed，原1100081B/4fa8daf9…及尾LF未改，去单LF的字节身份只另列观察，不拿它与本轮seed强求相等。当前保存的规范raw未增加LF。

原 [normal-input-results.json](normal-input-r1/normal-input-results.json) 中“independent pending”是采集结束时的真实快照，未回写；本新报告与 [独立审核](normal-input-audit-r1/normal-browser-export-audit.json) 记录后续完成。最终再次读回全部92原文/精确105个输入文件集合、134冻结源、审核125源与93输入hash全部一致；完整文件索引见 [validation JSON](normal-input-validation-r1.json)。两个会话65622/13575均已实际exit0关闭，无后台采集/审核继续等待。

实际命令：

```sh
rtk proxy node --experimental-transform-types goal-1/evidence/t17-acceptance-11/collect-normal-input-r1.mjs --output-dir goal-1/evidence/t17-acceptance-11/normal-input-r1
rtk proxy env NATIVE_EXPORT_INPUT_DIRECTORY=goal-1/evidence/t17-acceptance-11/normal-input-r1 node --experimental-transform-types scripts/verify_normal_browser_exports.ts --output-dir goal-1/evidence/t17-acceptance-11/normal-input-audit-r1
```

Node实际v22.12.0。启动/完整CLI/原stdout/实际终态分别保留在本root的 normal-input-command/console/running/complete-r1 与 normal-input-audit-command/console/running/complete-r1；首次采集前固定fresh目录、父封存/Git登记/命名文件守卫，写入wx，每次落盘核父守卫。原目录/旧源/规则/浏览器均未改。本轮未运行UI/规则测试、构建、浏览器或兼容检查。所有文件未由本代理提交/封存，交由父任务统一收尾。

[杠精审查] 本单一正常输入与独立原文核定限定通过：金额/日期/AP/许可与源身份真实，未把输入当Chrome游玩、planned当完成、充值当利润或不同seed/LF当同原文。六固定身份、完整5c与后续父项仍保留。
