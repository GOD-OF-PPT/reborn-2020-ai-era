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

## 实际限定结果

- 红测实际命令：`rtk proxy node --experimental-strip-types --experimental-transform-types goal-1/evidence/t17-acceptance-09/summary-check-tests.mjs --label r1-red`，exit1。32项中7项符合期望、25个坏汇总实际被旧算法放行；有效夹具通过且原6个已有拒绝仍拒绝。`legacyInlineExactCopy=true`证明红helper条件块逐字等于当时真实审核inline块。原helper、审核入口、脚本、计划和完整合成90夹具均保存，不覆盖。
- 修复后的新绿命令同一脚本、标签`r2-green`，实际exit0：32/32，31个错误变体全部实际拒绝。helper只读取元数据，未执行GameRun/原前史/原90/浏览器/兼容。真实审核接线已改为完整ResultRow与原prefix/case-index物理bytes/SHA重建，不依赖collector自身宣称的通过布尔。
- 实际逐报告及所引用5个源/夹具副本回读字节/SHA均同。红results.json：17224字节，SHA256 `51ca871ed2718ddb2b4c898a44d8688697e9e9c7d7e9eaaa83e8ebac04983691`；绿：14904字节，SHA256 `8be51c078005c4dbd9a1fd2dd4bdb8065d0601b9d51221e56e46d0d85a1a9c1c`。
- 新helper为5252字节/SHA256 `a92588824f8395c941bfd1fe1e4f53098069840414679ae32ca308745d57351d`，已通知根代理纳入criticalSourceNames；本组不编辑evidence.ts。统一类型与全90仍由根代理执行，本记录不把元数据绿当作实际游戏通过。

[杠精审查] 本限定缺口修复通过：已证明旧错确能通过，并以相同夹具实际拒绝，不删原校验、不省完整ResultRow或物理索引引用；所有红源与输出保留。REPEAT只扩展本项目实际证据工具，未建全局Skill、自动化或外部资源；未独立提交或推送。
