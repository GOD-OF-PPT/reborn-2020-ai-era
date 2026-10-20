# P2-S2 后续提交字节核验工具准备

当前仅准备独立工具，不执行真实仓库的 staged/commit 验收，不创建封存标记、不暂存、不提交。当前独立 audit-r3 尚在执行；必须由根代理确认全72终态及原全部接收条件之后，再决定实际核验和提交。兼容性、UI、COW及游戏执行不在本任务内。

写前身份：PUBLIC GOD-OF-PPT/reborn-2020-ai-era，分支 main，HEAD 7975ae73526b8c17e185012518a2724bfd04308f。当前已有改动与 root08 活审核均保留。本目录此前不存在；先落此计划，再新建 verify_task_bytes.py。不得修改427冻结源、root08或任何旧 marker、旧 post 工具、当前 index/HEAD。

## 范围与复用

复用 t17-course-shape-post-commit-01/verify_git_bytes.py 的精确文件集合、流式 Git blob、原字节/SHA 核验；复用 t17-risk-scene-post-commit-01/verify_feature.py 的 staged/commit 元数据获取方式。旧脚本保持原文，只在本目录新增最小实现。

manifest 为 JSON 对象，恰有 repo-relative 的 files、symlinks 两表。普通文件条目含 bytes、sha256，可显式给 gitMode=100644/100755；未给模式时根据当前普通文件的 owner-executable 位核对。symlink 条目含 target、bytes、sha256、gitMode=120000，哈希针对原始 readlink 字节，不加换行、不跟随目标；包括目录符号链接。

CLI 使用 --repo-root（默认本项目）、--manifest、--mode staged|commit、commit 模式的完整 --commit SHA、--output-report 新文件。可重复的 --tree-root 指定必须完整纳入 manifest 的目录；遍历只用 lstat/scandir、不递归符号链接，以发现未暂存但被漏列的证据。实际核 root08 时应传其目录，报告必须放在其树外。staged 要求所有 index 项均 stage0；staged 或单父/初始 commit 的完整变更集合必须精确等于 manifest 两表并集，不接受删除或未合并条目。Git 模式与文件类型分别核对，不能以同 blob 原文掩盖 120000→100644。

文件系统读取拒绝 symlink 父目录和非普通/非链接叶子；普通文件用 O_NOFOLLOW 的已核 FD 与 Git blob 按至多1MiB块逐字比较，链接只读 readlink 原文。Git 对象使用一个 cat-file --batch 进程逐对象读取，不把整批 blob 存内存。校验前后记录 HEAD/index、manifest 和输入对象身份/文件集合，检测并发变化。输出只使用 exclusive create，并检查所有祖先封存标记、符号链接及输出位于新 post 目录；不覆盖任何旧证据。

## 必要验证与资源

只用 /private/tmp 中全新自有小 Git fixture，全部总量低于1MiB。fixture 使用空模板、独立本地身份与 hooks，禁系统/全局配置、签名、凭据提示及网络协议，不改当前仓库保护。验证 staged/commit 正向、普通文件错字节、错链接、Git链接模式错误、漏项/多项、未合并 stage、完整树漏列未暂存文件；包含目录链接，证明不会跟随。

原始命令、返回码、stdout/stderr、逐次报告和资源占用保存在本目录；失败保留，不删红结果。准备结束复核当前项目 HEAD/index 未变。测试结果仅证明这个小工具的对应边界，不证明真实 root08 已核验或可提交。不会扩展大 payload、性能实验、依赖或网络任务。

## 风险与回滚

主要风险是把链接目标当文件读、忽略 Git mode、漏列目录链接、只核所列子集、未合并条目或读到混合 index。以上均须失败退出。源/目标的 atime 自然读取变化不伪称不变；本工具不显式写入输入元数据。当前真实仓库仅做身份读取，实际 staged/commit 全量核验由根代理在审核终态后执行。

准备是新增文件，回滚无需改旧内容；保留已产生结果。真实使用报告只写新文件，失败不能覆盖重试。REPEAT 采用扩展既有项目核验形式，不创建 Skill、自动化或通用框架。

验证记录：待实际小 fixture 完成后仅在本文件追加实际命令、结果、未覆盖范围和杠精审查；在此之前不标工具验证通过。

## 空间恢复后的接续登记

上一轮唯一 fixture 启动在 zsh 创建 here-document 临时文件时因真实 ENOSPC 退出1，Python/Git均未启动；当时连小型错误记录也未成功落盘，本轮补存原始错误到 fixture-launch-r1.json，不改写为用例失败或通过。主 audit-r3 随后已部分终态封存；本工具不得触碰它，也不把旧部分审核当全量完成。

根代理现已实际核定5916827648字节空间与小文件wx/fsync/readback，并授权接续本计划的小 fixture。新建 run_fixture_validation.py 后使用 rtk proxy python3 -B 直接运行，避免 here-document。仍只修改本 post 目录或全新自有系统 tmp 仓库，不执行当前真实仓库 staged/commit 验收、stage/commit/seal或任何UI/兼容/COW操作。每轮标签、报告和失败独立新建，不覆盖旧结果。

## 本轮实际验证

实际命令：`rtk proxy python3 -B goal-1/evidence/t17-course-delegated-post-commit-01/run_fixture_validation.py --label r1 --expected-sha256 4945b9e7ca31078d7a96e4af468a979268fd7d7fe0bcd5f1a5201d4106149a75`，终态exit0，无活句柄/PID。原始外层输出在 fixture-run-r1.txt；全部fixture Git命令、输入、返回码、stdout/stderr与每项报告引用在 fixture-results-r1.json。此前未启动的here-document ENOSPC另存fixture-launch-r1.json，原失败身份不改。

新自有fixture为 /private/tmp/course-byte-fixture-9phe779_。最大逻辑27062字节、实际分配118784字节，低于1MiB；只串行运行，无大payload/性能试验，未删除或清理原仓库数据。该临时仓库只有虚构本地身份、空模板/hooks、签名和网络禁用的配置，所有Git写操作均在它内部。

十项实际结果全部符合预期：staged与commit正向各1；错普通文件字节、错链接原文、同blob但错误120000模式、漏index项、多index项、非stage0、完整树漏列未暂存文件、输出路径混入manifest输入共8项均按相应原因拒绝。正向同时核普通文件100644/可执行100755、文件链接与目录链接120000，并用完整叶子集合确认不跟随目录链接。输出/输入重叠用相同源码的独立fixture副本核定，原报告目标未创建。

核验器本轮原字节未修改，SHA256仍为4945b9e7ca31078d7a96e4af468a979268fd7d7fe0bcd5f1a5201d4106149a75。当前真实项目HEAD/index的哈希及纳秒mtime/ctime前后相同；未执行其staged/commit核验、Git写入或root08改动。所有新报告使用独占创建，原始正/负结果均保留。

准备工具在上述小fixture范围已验证；真实root08/427源/任务提交的全部字节、封存与提交仍须由根代理在主审核实际全量终态后独立执行。没有验证完整真实证据体量、故意卡死子进程或所有外部并发情形，不将静态deadline/保护逻辑或本轮小fixture当作这些实测通过。

[杠精审查] 本准备子范围通过：链接原文与Git模式分别核验，stage0和完整集合有实际反例，代码未用测试结果替代真实仓库核定；原ENOSPC与当前八项预期拒绝完整保留。REPEAT只扩展旧项目post工具，不新增Skill、自动化、依赖或业务规则；不代根代理commit。
