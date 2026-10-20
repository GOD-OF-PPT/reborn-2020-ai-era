# 运行期只读补充：年末报告与资源归因

当前audit-r3未终态，本记录不代表全量通过，也不修改冻结源。

## 已完成两条实例的报告边界

只读case-01/case-03：图像基础录播80报名/76保留helped；视频基础录播88/78。各新班原delegated支持July1—3完成、July11关班和费用入账；新班预款/应收及退款费债remainingFen均0，保护released。fees分别75620/77610分，公司期末现金3014136/3051946分是公司全历史现金，不能标本课利润。

两条年末均monitoringComplete且money日期Dec31；local unresolvedCount0、两个agent事件stage normal/verdict ordinary，但resolvedAt/externalVerifiedAt为null、controlVerified false。两次核查按job.id去重，各10000分/1AP；currentGrant仍cross_flow/externalDelegation true、revokedAt null、expiresAt Dec31，deployment active/stoppedAt null；外部stopRequestedAt/revocationVerifiedAt null。旧approval于Apr22结束是扩权时旧授权结束，不能当当前cross授权撤回。network residual，三组织takeover/residual/controlled。

最终全72须按rowId+实体ID独立统计：监看截止、课程闭环、当前旧责任、局部公开风险、本地停止/外部撤回、独立控制恢复与外部网络状态六项分列。currentLiabilities而非历史liabilities快照；账务/保护按本case的实际ID去重，同ID不同分支不得合并金额。仅两实例不能推广全部72，且“本地未解0/到年末”均不等于全外部恢复。

## 空间元数据的有据限制

独立只读调查仅stat/目录尺寸，没有读日志正文/查询DB/清理。18:30:56—18:32:15 UTC约79秒：Codex thread_history_1.sqlite2561011712B、state_5.sqlite1597440B、logs_2.sqlite82665472B及主要WAL尺寸/allocated无增长（mtime更新）；当前rollout约+65738B、goals WAL+16480B、RTK history约+16384B且allocated不变。RTK最新tee仍Oct14/117755B，未发现本轮大container落tee证据。

.delivery713013492B/4488文件与node_modules172733798B/3955文件在audit启动后0文件修改；root08近期修改文件约28.9MB/console6.3MB。曾按mtime怀疑187266664B Git pack是新增长，随后birth UTC09:32:10早于本审核启动，纠正为旧文件，不能按全size算本次新增；没有tmp pack/gc.pid/gc.log。原首次free428728320B到末526225408B回升约97.5MB。

目前没有足以唯一解释数百MB波动的新增大文件证据；现size稳定也不能证明底层无写入。未识别安全可回收项，不动数据库/日志/用户数据，不清attrs、不重启服务，不扩COW。GC/swap/卷空间保留为观测，不能据此唯一归因或宣称已解决资源问题。全部兼容开发/测试0。
