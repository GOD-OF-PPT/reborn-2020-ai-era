# 同账期原应收到期等待

仅whole-period，无原active服务/支持/复核、已知差额或当前可收决定时，读取同business/customer且source为period或其同客户meter的未清future dueAt。输出pending/nextDate/wait，不新增Collect、不改dueAt或金额。历史job/meter不切换，已到期/复核/差额仍原优先。

先在原progress.test加公开display语义回归并保红，再最小模型修缮；定向progress/target/clock，原strict配置，原限时不改。Narrative由根同步；不用测试证明Chrome/正常Create。只两source，保存前后hash，证据新写并保守卫。
