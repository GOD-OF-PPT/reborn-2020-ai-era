# U3-C1 选择性收口候选

本目录只准备候选，未执行任何 mode、seal、Git 写入/提交、拒写 probe 或完整Create审核；新的 t17-u3c1-course-post-commit-01 尚未创建。执行只由 Root 在最终 writer/验证冻结后决定。

唯一 CLI 候选：closeout-final-r1.candidate.mjs，18820B，SHA256 67c931170338b5a9b4e7699427ec795affcb40e131a42018d8452f5082003a7f。纯浏览器模块 browser-probes.mjs，2429B，SHA256 84492ea639f57017a515668e5e42d78a15b30908fbe37f7a7e507c1f9c662654。两者原字节前后相同，实际 node --check 均 exit0；这是语法检查，不是收口执行或 Native 验证。

未来命令/先后依赖以 execution-order-final-r1.md 为准：prepare <实际最终build manifest> → seal-root → stage-feature → commit-feature；post未封时做原13浏览器入口/2CLI拒写、独立读回、空白原日志分类和最终 master 追加；prepare-record → 停全部post writer → seal-post → stage-record → Root显式record commit → verify-record <实际SHA>。最终build文件列表必须完整逐bytes/SHA/mode匹配当前源；当前观察23UI/556仅准备时身份，不写死计数。

feature范围为动态UI差集 + docs36允许增量 + root31精确payload/marker；3master只在record选d778原blob＋本轮1513B起完整后缀，唯一原P3插入2304B/14LF保持工作树且不进blob。当前AGENTS不在候选白名单，如Root决定本轮也需更新它，先另出有据新候选，不静默stage。

准备末次读回：26P3原工作字节/SHA/mode同；116旧普通marker身份同；2marker symlink类型/原target字面同，mode仅能证本准备前后，不补称开工已采；3master基线/唯一P3/1513起后缀核同。root19和lastSealed精确tree由未来每个相关mode再次实核。原input61B/SHA20c73…保持。preparation-final-readback.json与dependency-identities.json保各具体来源；index仅只读，未修改。

Cua仅可import独立 browser-probes.mjs，必须传当前实际已绑定root31的Native helper（封后不能重新bind）；不得import带CLI入口的候选。4个wrapper为显式stub且delegations必须0，9个为实际Native受保护入口；不能写成13次真实UI操作。原JSON换行疑点经逐字节排除，未修改候选。static-contract-checks.json的单条false为过宽检查器把23误命中P3常量2304；r2限sourceScope复核，原false保留，非产品或candidate逻辑失败。

独立纯文本复核已请求interaction agent，若其后发现确定问题另交新候选，原r1不覆盖。准备不证明原生、完整Create、人类理解、整个U3-C1/T17/goal或旧P3正式62/22完成；兼容开发测试仍0。
