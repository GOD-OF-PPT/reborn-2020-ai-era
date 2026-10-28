# 原候选重试与剩余等候

R6 Native真实第二步abort/原retry/物理旧新/重进通过，但失败点正好是原targetApr11，不能据此声称已单独证明提前无意义日期失败后的剩余等待不自动继续。补真实fake-IDB第一步Apr10的head.put后abort：原saved19/candidate20，retry仅保存20 Apr10，原rest仍未完成，scope目标Apr11保留且重复原scope不再执行。

当前区间回响对这类retry前于target且没有意义反馈的情况会写成“这次真实反馈”，需要明确区分“原候选已保存，余下等候由你重新选择”；不给原retry继续授权。先保原失败测试，再最小改说明及UI-only reason code，不改权威命令或原candidate。兼容0。
