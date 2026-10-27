# 最终准入更正：R2当前绑定已过期，先重新冻结

本文件与verdict.json覆盖review.md初稿的“可交GO”准入表述；初稿关于重放逻辑的静态分析保留，但其写入后末次metadata断言发现实际漂移，未形成成功最终verdict。原断言exit1保在final-metadata-failure-r1.json，不改旧初稿掩盖。

唯一漂移为frozen-contract-r2.references中的goal-1/evidence/t17-acceptance-37/tasks.md：预期2728B/SHA56d9a13fc6eaa3fc1ea25f8a2c58368af1c768f58fb53edf3cf76288141ed838/0644，实际5618B/SHA6a6df5f55f853bbee631db0ade7479905443b321c405e1771715f6126bb31bd6/0644。127源、901依赖、P326及其它34引用、候选/合同/原118/manifest/seal与准备目录全树文件身份保持。Root已收到此漂移；这是合法任务进展造成冻结cut过期，不是游戏或重放规则bug，也不能被忽略。

**当前R2暂不准实际GO执行。** initial bindings会在产品导入前按设计拒绝；不能把Root的新tasks恢复成旧字节或放宽比较来造通过。作者需新同级/新版本冻结合同，把当前任务身份重新绑定（或明确冻结一份合法、不可变的任务cut）；配套新候选只改准确合同路径，保本R2原件与全部历史/失败/GO门槛不变。Root在新cut冻结到一次执行终态期间保持这些引用不再变化，之后再进行小范围delta复核/新精确GO。

不需要重新设计1Create+117到118逐字同、101只留内存、公共已审目标和角色/计数逻辑；这些静态分析未见确定缺陷。修的是执行身份的当前一致性，不能直接用旧报告/hash冒新合同已审。本审不代改作者任何文件，不执行语法/codec/replay/工程/Browser/Git，也未生成101。

未来Root仍须实际外层argv/stdout/stderr/进程终态与result.passed/provenance门槛，不能用本review初稿或raw存在充准入；当前positive新分支与旧negative前缀继续分列，U4-B/C-S4-R/整个goal保持未关闭，compat0。
