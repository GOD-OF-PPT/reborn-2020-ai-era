# 任务

- [x] 1 固定完整类型/身份key与绑定run内存。
  - 实际：两新文件；原12字段原类型保留，section不成为新身份，Map仅闭包内存，异run read undefined/write false。
  - [杠精审查]：限定通过；不替调用方校验原游戏对象/资格，不执行或持久化游戏。
- [x] 2 四项有意义纯回归及原默认时限定向运行。
  - 实际：单文件4/4通过，原默认5秒/单worker，native duration363ms；精确命令/原控制台/result完整保留。
  - [杠精审查]：限定通过；覆盖同对象跨section复取、异run及factory隔离、不同账户/所有对象维度、读写拷贝与覆写；不拿helper单测充React生命周期或Chrome草稿验收。
- [x] 3 定向strict、源身份与交接；全面检查-debug。
  - 实际：严格TS0；final-source两个SHA与两检查同源，生产模块1470B/test4057B，冻结交根。
  - [杠精审查]：限定通过；未改其他源码/规则/原证据/时限，未用Git/浏览器/兼容/服务。原册直接打开与App memory实例所有权/重进生命周期仍由根接线实核。
