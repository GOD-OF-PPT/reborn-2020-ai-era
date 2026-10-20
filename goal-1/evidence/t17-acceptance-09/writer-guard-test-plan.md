# P3 writer I/O 守卫修复验证计划

此计划先于新小FS测试与源码修复。只允许修改 scripts/course-critical-evidence.ts，新增本计划、writer-guard-tests.mjs 和全新自有测试输出；不修改前史/run/collector/verifier、旧XZ helper、旧sealed证据、COW、生产规则或忽略规则。不执行任何游戏命令、场景、浏览器、兼容性工作或大矩阵。

先在现有旧源码运行同一测试 r1，所有失败与自有小fixture原样保留；然后最小修复，再在全新r2目录重测，不覆盖红档。夹具仅当前root09下matrix-r9001起/r9101起的全新目录，附独立writer-guard-r1/r2报告；每次写wx拒覆盖。报告原source SHA、每项实际异常/断言/目标前后bytes/SHA、实际退出码。

必要目标：祖先和叶子都使用lstat识别普通/悬空符号链接，不以existsSync漏掉悬空链接；sealed marker任何叶子类型都拒绝。append只允许本writer以wx新建的普通单链接文件，保存创建dev/ino。append以O_NOFOLLOW|O_APPEND|O_NONBLOCK且无O_CREAT打开，核fstat普通/nlink=1/创建dev、ino，并核当前叶子仍同一inode。拒绝缺失、非本writer创建、替换普通文件及新增硬链接，不创建缺失叶子；普通新文本仍wx。unpackArchive必须在解包前核encoding=xz、descriptor.file等于实际输入basename。

小测试依次包括：正常text+append；缺失append；非本writer普通文件；普通/悬空叶子链接；普通/悬空目录祖先链接；普通/悬空sealed marker；非普通叶子；已创建文件被新普通inode替换；已创建文件新增硬链接；text重复wx不覆盖；路径逃逸拒绝；小真实XZ完整Unicode/换行往返与错误encoding/filename拒绝。所有链接/外部目标都在本轮自有fixture目录内，不触旧树。失败保全只指这些实际测试的自有原文，不声称注入全部磁盘/进程/并发故障。

静态限制：lstat及FD核定能拒绝实际观测的链接/替换/多链接状态，但不是跨整个目录链的原子openat沙箱；不把未注入的并发祖先换件、检查后新增硬链接、ENOSPC/大256MiB/主矩阵当本小测试已通过。源类型与全90由根代理后续统一核定；测试本身不产生P3关键分支通过数。
