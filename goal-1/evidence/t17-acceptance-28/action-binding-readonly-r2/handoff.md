# 稳定只读UI绑定修缮：冻结交回

仅src/ui/shared-action.ts变化，2290B / SHA256 5562777df4ccdacbd266f29835571e0c18d1977424cf12816ae39fd2cf6e42b7。先保busy/candidate/conflict门槛及同run/revision/当前snapshot身份，再给command正确的只读阻拦原因；只有allowReadOnly且双方readOnly=true、saveStatus=read_only才加入稳定可读。其它非saved状态（包括closed）仍拒。

Root原C-U1-A-R3 47/48中真实readonly UI逻辑红已完整保副本。原测试/expect/源码时限完全未改，单文件串行CLI --testTimeout=60000 --hookTimeout=60000实际9/9 exit0、14.00s。60秒是本次真实controller/store链等候上限，不是性能通过；没有再跑默认时限或新全套/typecheck。

其它6跟踪文件（含test、CommandButton、ClockAdvance、Session与配置）bytes/SHA/mode同。原R1源码冻结记录保旧身份，此修缮以本r2身份为准；Root继续当前键盘/原生与最终构建/整合，本项未使用浏览器/构建/Git，不宣称整U1完成。此后不再写production。
