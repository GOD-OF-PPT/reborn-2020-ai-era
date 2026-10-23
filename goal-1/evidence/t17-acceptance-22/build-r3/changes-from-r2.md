# 与build-r2源差异

同一415份冻结集合，新增0、删除0、变化2、其余413份bytes/SHA完全相同。逐文件完整数据见source-before.json及changes-from-r2.json。未用Git计算。

| 文件 | bytes | R2 SHA-256 | R3 SHA-256 |
| --- | --- | --- | --- |
| src/ui/player-thread.ts | 37728 → 38499 | 86aebb80798ff824b4dcfa1bbc3294d46699b76105d49904ce2965b24a7f234f | 03b78ee3bb52b0910e48d1981f8f01a3b9c11e1cdce03487ae10b4bc859657ab |
| src/ui/season-thread.test.ts | 22884 → 24221 | ecc49610c9b2324cff3952dd81865d07c2dfeff1a4eb86ce46d6dbcb01f1e665 | 36da6837d578ff467839747a652bf98116ac76b84555e7483f028d1c05b3d0d1 |

player-thread.ts仅workScene：同原period positive salary实际汇总、截至日期与最近一笔日期/金额；当前季末写日历已结算/下季工作另定，旧季保持原period历史口径。原wait/commands/resultRefs不改。

season-thread.test.ts仅moneyText导入与既有正常工资/跨季case中Jan31的8000、Mar31的24000/最近8000、三次来源日期、季末detail及Apr1旧Q1历史口径断言。没有新case或时限变化，未重跑长链。该精确case先前通过及strict0的原文在payroll-copy-r1。

R2原日志/源码索引不改；R3独立strict/build终态与生产资源索引随后记录。
