# 任务

- [x] 1 独立核登记完整性及五字段/原bytes，冻结原126+输入与139来源。
  - 实际：preflight终态0，8目录/6 journals/21完整raw均登记，36JSON扫描0遗漏；五字段/重复/原bytes/hash均0错。126与139来源同，另代理独立只读确认。2个optional-null另补公开头，原行不改。
  - [杠精审查]：限定通过；不靠工具宽松origin处理漏来源，不把重复内容当重复file，不调用codec或窥隐藏结果来挑输入。
- [x] 2 唯一原工具实际完整Create审核并保原日志/终态。
  - 实际：原唯一命令pid5012 exit0/48410ms；2Create/83独特非Create/21raw全部逐字同。17 saved/1 candidate/3 buffer身份保持。命令、原stdout/stderr/终态齐；仅Node原ExperimentalWarning，无失败/错误覆盖。
  - [杠精审查]：限定通过；计数来自原报告，不预报2Create，不把83称Chrome点击数或buffer/candidate当保存；未改工具/断言/版本/seed/源。
- [x] 3 独立源/输入前后与139绑定比对，optional元数据补充和限界交回；全面检查-debug。
  - 实际：postcheck终态0；report source126/input27集合及hash同独立前像，当前bytes/hash同；原139逐项同，runtime124集合无增删；8目录/36JSON前后同，21 report来源/公开头逐项同，optional两行匹配。
  - [杠精审查]：限定通过；只写本fresh目录，无source/Chrome/Git变更；原工具内置只读Git获明确授权；不代替UI/视觉/真人/P3/62/22/兼容/全goal。
