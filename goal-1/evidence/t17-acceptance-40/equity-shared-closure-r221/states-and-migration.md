# 五共享动作与完整停止经历

|原动作|原资格和决定|信息与真实结果|
|---|---|---|
|FundBusiness|原company/正额/个人可花/原保护；原独立确认|本人现金→企业现金，资本转移不记费用/收入；cancel不动钱，原合法收尾恢复资金仍可|
|InterruptJob|原jobId planned/running及原规则|只停止所指job，未开工释放原资金/对应季度占用，已开工费用/AP不退；原约/持股/应收不清|
|RescheduleJob|原jobId/resource/date|保原VIDEO_SCHEDULE_FIXED拒绝，不能因换表单获得固定任务改期；原草稿/拒绝理由完整|
|WindDownBusiness|原businessId/lifecycle和捕获确认|主体全部planned/running停止，未开工取消/进行中中断；本主体员工解聘可中断其它主体正在使用该员工的任务；已用不退、工资维护实际出账，原债/保护/资产保|
|CloseBusiness|原收尾状态、所有扩展closeConstraint及原资产/义务门槛|Deepseek closeConstraint同时禁止个人/企业仍有持股/未收，不能凭通用个人例外关闭；合法company关闭原剩余现金转回个人，不是收入。可以长期保留收尾/持股过生活，无强迫清空|

先行plan第3段关于个人通用close门槛的“允许留下持股”推断不成立：实际campaign还调用DeepseekRuntime.closeConstraint，同时要求无持股/未收。本表先纠正，原plan保留当时调查身份，产品/测试按完整原链，不改规则或拿显示状态放行。

当前允许→比较保留原生活/真正停止整主体→原确认全影响→保存成功的停止纸件与当前目的→同对象原任务/持股/应收分别显选→可选合法关闭或先回生活。closed纸件合起、主物件与主操作同绑回Today；winding_down不再引导关系和新邀请。原book/危险/资金缺口/恢复持续可达；候选失败仍旧物件，原retry成功才换，不把已保存业务失败藏回旧成功。

只读摘要用同捕获view/operations与deepseek.business及唯一账户/finance，不读Controller/hidden facts。缺原jobs/workers/finance明确未知，保完整原册和原命令；摘要只组织阅读，不控执行资格。任务/员工完整行进原分页details，首层保中断人数/跨主体范围/原成本性质和原命令；不缩字/滚动/裁切。
