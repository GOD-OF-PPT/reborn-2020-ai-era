# U3-C2 审核wrapper已准备

唯一新wrapper run-audit.mjs，12846B/SHA1db134797dc1b06a365f2b118a1d1e939b18d23308691867c082007e31e94a2a。仅root31→32/U3C1→U3C2/Root31→32机械替换，逆补后逐字等原root31；原helper未改。node --check实际0/前后同，未import/扫描preflight/审核/重放。

Root明确captures done且raw/manifest停止写后才另获执行：

~~~sh
rtk proxy node goal-1/evidence/t17-acceptance-32/audit-preparation-r1/run-audit.mjs --output-dir goal-1/evidence/t17-acceptance-32/normal-export-audit-r1
~~~

每次新report目录，失败保原终态。5必填字段file/origin/source/bytes/sha256与ASCII basename、bytes/SHA/optional header及全部codec-shaped原文覆盖仍严格；只扫描真实chrome-*目录、跳过非目录同名文件。角色按显式SAVED_UI:/PHYSICAL_READONLY:/IMPORT_BUFFER:/UNSAVED_CANDIDATE:，origin必须是对应小写角色，不能靠origin推断；缓冲、候选、物理只读和重进不算新保存成果。126官方源/P3开工working字节初末、全部输入和report逐源hash保持原规则。126仅审核实际依赖闭包，不替代最终完整产品源/Native/美术或真人。当前normal-export-audit-r1不存在，执行和实际计数均未预填。
