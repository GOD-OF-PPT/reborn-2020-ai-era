# 6项harness失败的精确补正

原6文件/58case的52pass、6fail和exit1/22081ms原文已复制保留；没有把它改成修后通过。两类有据原因：clearMocks:true在it前清空beforeAll spy；原addDays拒绝负天数。

只改一个新test：陈旧按钮调用前记录spy当前次数，调用后仍断言不增；saveReader与beforeAll完整setup区逐字保持，原真实request一次/原payload读取/confirm true和Controller原保存断言未删。六处前一天反例改用独立UTC上一日helper，原expect null、金额/原单/owner/canonical断言均保。没有改core或任何配置、时限、worker、case。

精确逆变这几处后整文件逐字等R3；15个it标题与全部其余源码相同，vitest配置SHA/mode保持。原setup完整区SHA见repair-readback.json。运行时实际日期和AP规则未受影响，反例仍使用有效但不属于本次操作的另一ISO日期。

[杠精审查] 静态修复通过：保留测试本意，未用松断言/跳case或关clearMocks造绿。修后checks/type/build/Browser/Git均未由本代理运行，仍待Root统一Gate。本文件重新冻结，Root下一consumer新增case另行授权后再解冻。
