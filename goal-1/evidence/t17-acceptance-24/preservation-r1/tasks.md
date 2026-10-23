# 任务与交回

- [x] 1 固定输入/允许UI范围，核416及非UI/P3/input/master。
  - 实际：261非UI字节同；18旧UI变化+13新增全在C1清单；P3 26匹配17本轮+1旧source+8旧封存观察。原input61B/SHA20c73同，三master初始prefix同+各854B C1追加。
  - [杠精审查] 通过：没拿HEAD代替P3 WIP；9项缺本轮初始hash明确时期，不称P3功能通过。
- [x] 2 两套旧封存文件集合/字节/已有mode/marker锚与无symlink完整核定。
  - 实际：850+35条/885entry bytesSHA/mode同，2marker与本轮原SHA同，文件集合精确、无symlink；目录/未记mode界限写readback。check实际exit0/wall1457ms，原terminal/stdout完整。
  - [杠精审查] 通过：只核授权两套，不冒称所有历史；marker自身mode/未记录目录不补造。
- [x] 3 结果索引/红档保全、源读回及全面审查交回。
  - 实际：37JSON/56log逐SHA索引，2Create前缀审核另列；红/补跑/副本/汇总不混记，当前R5关键源绑定另列。
  - [杠精审查] 通过：没有新测试/Chrome/Git/兼容/旧证据写入；静态保全与结果索引不当完整体验或最终Create验收。
