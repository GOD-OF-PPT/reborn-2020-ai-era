# Final-r4 收口候选独立静态复核

只读R4候选、执行顺序、原root25纯I/O/Git helper、guard与输入锚；没有import/执行候选或任何mode，没有seal/index/commit/probe/test/browser/audit。当前exports仍活，完整Create wrapper保持未执行。输入身份/当前26P3与三master的只读字节核对见同名JSON；R4读取前后SHA未变。

## 确定缺口与已回报的最小修补

**CR4-01：最终record验证漏主证据根。** closeout-final-r4.candidate.mjs第29行verifyRecord仅verifySeal(post)。第28行stageRecord核了root30，但随后Root外部git commit及verifyRecord期间，root30某份新PNG/AX/日志等非源码payload若被改，sourceScope只核src/assets/public/配置，preserve只核开工prior/旧marker/root19/旧两payload/input/master，不覆盖本root30全新证据；verifyRecord仍可给success。execution-order第13/14也没有另明确该主根完整终态读回。必须在最后verifyRecord复核root30整树；Root已接受新R5在开头及返回前两次verifySeal(root)并返回rootSeal，R4保持原字节。

**CR4-02：实际feature提交前缺post guard。** 第25行commitFeature先git commit，再put日志才触发guard(post)。若误序使post已sealed或不可写，会先提交再拒写回执。按当前正确顺序不触发，但保护未在实际变更前裁定。Root已接受R5在实际git commit紧前guard(post)，不另造流程。

## 其余逐段结构

1. 第16—17行每次从原530 baseline重算完整src/assets/public与9根配置的实际集合和UI增改，拒删除与任何非src/ui差异；未把准备时38/547硬编码成门槛。显式final manifest须属于root30，相对路径safe，当前完整路径集合及逐bytes/hash/mode都匹配。stage/commit/record前重复同完整binding，包括之前未改路径，旧名单不能漏后续必要UI修缮。最终manifest由Root选最终实际构建身份，当前Native修缮中的源不是本静态报告的最终冻结。

2. 第18—19行保原26P3与开工prior各字节/模式，root19使用权威完整tree，114旧普通marker保身份、仅lastSealed两套核完整payload；不冒称本轮已逐一审核114套旧payload。P3已跟踪/未跟踪索引分别要求原base HEAD条目/不入索引。源baseline已包含旧P3工作树，feature不是裸HEAD独立构建证明。

3. 三master不在feature清单。原2304B/14LF插入须原offset唯一，baseline去掉它逐字等base HEAD；当前须原baseline前缀+唯一own2090前缀+后续本片记录，mode保原。record以base HEAD内容+当前baseline之后U3后缀重建，intended禁止原P3插入。prepareRecord还要求suffix实际大于2090，再经hash-object/update-index显式cacheinfo，不git add整份工作树，工作树P3留原位置。本次独立只读核三份当前仍各2090后缀、插入唯一、baseline/模式一致；它们尚没有最终完成增量，不可提前prepare-record。

4. 第22—23行prepare在root30未封时先guard共同父链，post须不存在再mkdir并guard(post)；后续所有写put均wx。seal双tree同后写唯一marker，记录确切路径/目录/文件mode/目录mode，拒symlink，marker仅selfExcluded自身；verifySeal逐集合与字节/模式核。root30封存后候选各模式只向独立post写，不能再向root30添日志/截图/文档。

5. 第24—29行feature两阶段：精确NUL清单/暂存集合、逐blob OID/bytes/SHA/Gitmode/stage0；提交核实际parent及diff集合、blob与工作树，post留真实命令/终态。record先冻结意图及最后NUL普通清单，随后停止post writer并seal；stage-record/verify-record只stdout，外部git commit日志必须放两sealed根以外。record核唯一feature父、精确diff集合、每blob/Gitmode和空索引；原master磁盘与intended不同是有意保P3，不得用覆盖磁盘求一致。未改子树由明确parent身份与精确diff集合约束，不能拿单个commit对象存在代替这些核验。

6. 第30—31行13 browser口径为4标准wrapper stub+9真实已绑定native入口，要求guard先拒、delegates0，post写前后root seal；不是13次游戏UI动作。2 CLI用原collector/auditor写新sealed子目标并核exit1/原原因/目标仍不存在；不得提前执行或用语法代替。当前这些实际拒写/Native对象/真实Git终态全由Root后续执行，本子任务没有运行。

7. 旧root25 helper仅导入repo/hash/json/bytes/ident/put/git/tree/verifySeal/blobOid/proof/safe，没有调用它硬编码root25的preserve/uiDelta mutator；旧文件不改。Git写动作仅存在于显式候选mode，当前没执行。外部完整Create审核、最终docs、sourcebinding及所有root30 writer须先完成，prepare→seal-root顺序不能颠倒；prepare-record后不再添post文件，seal-post后结果只保存到外部新根。

## 未验证边界

本静态审查不证明实际索引、完整提交、当前最终生产源、所有旧payload、13/2拒写或磁盘释放成功。没有执行preserve()/sourceScope()/prepare()/seal等函数。实际record commit之后的主根完整读回缺口必须由新R5修补后另静态核，才可交Root按原顺序实际执行。源binding及后缀事实仍需Root冻结最终结果，简单“多了字节”不会证明记录内容真实性；也不关闭P3正式62/22、T17/PNG/真人/M01/T18或goal。兼容开发测试0。

[杠精审查] R4最终核验打回CR4-01，另补CR4-02提交前guard；均已获Root接受按新R5最小修，不改R4或扩流程。其余结构限定未发现新的确定阻断，仍须实际两阶段终态验证。
