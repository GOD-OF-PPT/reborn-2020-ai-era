# C-D10 R6 最小定向复查预登记

状态：仅准备，尚未执行，尚未冻结最终游戏源码。原r1登记、driver、input/plan/tasks及全部源码未修改。R6 driver全文只替换REGISTRATION文件名，原groups/commands/inventory/守卫/依赖/输出与冻结算法保留。

R5实际：108文件/720断言，689通过、4失败、27因beforeAll超时跳过；103文件通过/5失败；实际exit1，518冻结源均同，metadata/validation错误为空。失败原文全部保留。

retry-ui读取两个完整文件，共28例，必须实际28通过、0其他；不会筛掉hook或原断言。

retry-core-timeouts三个原文件共列24例，仅选择R5实际JSON的3个timeout fullName，精确正则从该JSON转义生成，21例明确未选择，不计新通过。原20/60/120秒时限、hook10秒/default5秒及隔离均不调整。

commands模式原driver不会自动解析Vitest断言，根代理必须额外读回实际JSON核对：3原文件、精确3个fullName且全passed、21未选择skip/pending、无其他失败/todo或异常选择。exit0本身不足以宣布用例核验完成。

执行命令（本准备没有运行）：

rtk proxy python3 -B goal-1/evidence/t17-acceptance-15/run-current-check-r6.py retry-ui r6 --serial

只有上条实际成功且其冻结输入仍同，才可按原依赖守卫执行：

rtk proxy python3 -B goal-1/evidence/t17-acceptance-15/run-current-check-r6.py retry-core-timeouts r6 --serial --after r6:retry-ui

不能以失败的r5:all-noncompat作--after依赖。retry-core-timeouts的命令输出只绑定checks-r6/retry-core-timeouts/vitest.json，不可用这个登记启动其他round。

当前游戏UI源码仍由根代理修缮，最终冻结/比对桥接另行完成。R1→R6 driver/reg只是元数据路径替换，不允许因此忽略真实程序源码差异；不得把旧R5结果称新源全量通过。

一次当前load观测：2026-10-21T18:56:04.980Z

 2:56  up 3 days, 18:59, 1 user, load averages: 14.06 16.00 21.42

这是一条主机观测，不证明负载是唯一原因；没有结束或调整任何外部进程。

新文件字节：

{
  "registration": {
    "path": "goal-1/evidence/t17-acceptance-15/regression-registration-r6.json",
    "bytes": 34080,
    "sha256": "ef5530fea4b6fd982f9250645b4fdde6c814ee9873738e4d3513f34fbc095fce"
  },
  "runner": {
    "path": "goal-1/evidence/t17-acceptance-15/run-current-check-r6.py",
    "bytes": 15457,
    "sha256": "79017c6e9489a2cfd67c468455504024bb866a40fff6c0cb87ea911cb015230c"
  }
}

[杠精审查] 仅预登记通过；没有实际重试结果，不把21未选择用例冒充绿，也不改断言/时限/隔离/原红档。
