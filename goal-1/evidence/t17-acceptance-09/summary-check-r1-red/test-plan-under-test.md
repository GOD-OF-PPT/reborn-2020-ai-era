# P3 汇总一致性修复与元数据夹具计划

本文件先于测试脚本及测试执行建立。当前只修独立审核汇总一致性，不运行GameRun、共同前史、原90场景、浏览器或任何兼容开发/测试；固定原范围及后续责任不变。只修改verify_course_critical_evidence.ts、新专用course-critical-summary.ts、本计划和summary-check-tests.mjs/新标签输出。criticalSourceNames由根代理另行纳入新helper，避免并发编辑evidence.ts。

## 原缺口与限定修复

旧审核只检查汇总总数及每行rowId/status/accepted/rejected，遗漏其余身份、具体终态、目标数、错误/恢复状态与实际索引/归档引用；未核汇总源/输入、前史索引和通过布尔。修复后应按已实际核定的case-index原bytes/SHA、独立重执行record及固定身份重建每个完整ResultRow，并按已核原前史index原bytes/SHA与archive重建prefixProofs；全部完整对象逐项一致后才报告汇总通过。

1. 将旧inline核对条件原逻辑提取到新专用helper，保留对应原源码片段/哈希。用两个背景×原45ID的完整90行**合成元数据**夹具先执行红测，证明坏身份/索引/归档/终态/错误/目标数/绑定/通过布尔能被旧算法放行。此时绿结果只代表原有效夹具，不代表缺口已修复。
2. 修同一helper并接入真实独立审核：逐完整ResultRow比较所有原字段，核actual case-index FileRef、archive、targetChecks、revision/date、error/recovery、exactAttemptReplay；核全部总数、allOriginal90TargetsVerified、sourceHashes/inputHashes、完整prefixProofs及其实际原索引。真实审核新报告单列summaryAudit；任何缺失、重复、未知或不一致不能绿。
3. 新目录执行同一组正/负夹具，要求有效90行通过，至少错误身份、归档、索引file/bytes/SHA、终态revision/date、目标数、error/recovery、源/输入绑定、prefixProofs及通过布尔各自实际拒绝；另核旧总数/漏行/重复/失败拒绝仍保留。夹具保存完整expected/summary、原45ID输入哈希、被测helper/审核入口/脚本原文及哈希和逐例真实结果。旧红输出不覆盖。

## 验证与边界

新标签输出只在当前root09的新summary-check-*目录，先检查全部祖先封存/链接、mkdir排他、每文件wx/readback哈希；不得追加旧sealed目录。纯helper只依赖JSON规范化与元数据类型，不导入或执行游戏场景。夹具中索引和归档均是明确合成的元数据与字符串bytes/SHA，不能冒充真实游戏XZ、90游戏结果、真人或Chrome证据。

根代理随后串行执行统一严格类型、source绑定/实际完整90和独立审核。本组绿元数据夹具不代替这些责任；若发现失败继续修缮，保留原红源与真实输出。回滚使用新修复提交，不改旧失败、原场景或生产规则。
