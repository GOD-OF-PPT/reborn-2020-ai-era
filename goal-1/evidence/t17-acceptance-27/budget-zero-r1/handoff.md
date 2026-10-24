# 显式零供应预算修缮交回

生产只改RelayServiceChoice.tsx：新增本字段私有supplierBudget，严格显式十进制零解析0，其余保原parseMoneyInput；Issue与payload共同使用。空、空白、负值、超两位小数、科学记数、NaN/Infinity仍无命令，不默认为0。没有改通用money、core/application规则、其它费用/日期/AP/默认值。原冻结前像与实际差异见before.txt/change.diff，最新精确源身份source-final.json。

新增真实handler case先以旧parser实际命中red（0预算无原预览控件）；red终态exit1/1失败3未选完整保留。仅补parser后原casegreen exit0/1过3未选（6.92s/7537ms），受影响editor原3+新1均4/4（8.99s/9561ms）。原全部既有断言/时限未改；新case20s从首次red前即固定。Root旧C-R1-A批与本次变化分开归因，不把旧树当新树全验。

用原正常r91真实Controller/codec导入；UI明确草稿经实际budget输入handler分别0和0.00，原preview仍2AP/450000分。原命令保存后period预算0，实际服务/支持任务身份不变；未来安排现金未扣、450000分原费用预留，可花同步扣；原Jan28开始后service running，现金真实减少300000分，支持150000分仍预留。未拿预算0冒称免费服务、利润或整期结清。没有为此跑完整28日/支持/收款；完整小循环与浏览器仍Root负责。

13测试绑定源及两个原输入前后同；本轮开工7源比较仅editor与其test两份变化，通用money、relay-commands/core/validation和原r91字节保持。没有P3/旧sealed/Git/browser/compat/大回放动作。生产重新冻结；请Root统一最终strict/build/受影响累计。
