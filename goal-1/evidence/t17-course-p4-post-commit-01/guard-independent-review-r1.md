# P4 步骤6：证据输出守卫独立审查 R1

结论：最终限定守卫修复审查通过，未发现本次合同内仍须修复的确定缺陷。静态读源、真实红绿/类型/CLI终态和原文件字节的核对均已完成。本报告没有运行测试、CLI探针、游戏命令、Create、长矩阵、UI、构建或兼容检查，也没有修改源码、原feature或root10封存物；只在本post新增本报告。

## 实现与消费者

当前 `scripts/evidence-output.ts` 为 2700 B / `f16d0d209946822daa44340307eb4fd5766a9b82b1548ef535346b202e01697d`；测试为 5864 B / `e654e4684511a61b3391ca6f5be7ef50f3dc1719b7bae626e6d53d268cb8222d`。两者与最终 guard-green-r2 来源、最终CLI/项目类型来源相同。

- 参数形状、默认 `goal-1/evidence`、返回目录与 marker/snapshots 调用签名保留。非法参数与换行路径先拒绝，Git未知/非blob非missing仍拒绝，没有把查询失败当作安全。
- 在 mkdir 之前，从目标向祖先检查 lstat：目录符号链接或普通文件充作父目录均拒绝；任一 `sealed-evidence.json` 存在即拒绝，包括悬空标记链接，不读取其目标内容或以空/无效JSON绕过。对不存在的多层输出继续上溯，能命中封存父/祖父。
- `goal-1/evidence/<task>` 已有 Git index 登记即拒绝其新后代；这是显式登记规则，包含已暂存但尚未提交的文件。原 evidence 容器的 committed marker 检查仍保留，读 Git 走 `rtk proxy git`。
- 在保留原 committed marker 错误之后，对 primary marker 和调用者明确列入 snapshots 的每个目标再 lstat；存在则拒绝，含0字节失败输出或悬空链接。不会因为尚未入Git或总结尚未写成而重写这些命名partial。mkdir 在所有上述检查之后。
- 36个直接消费者的静态检查未发现允许覆盖同一 primary marker/显式snapshot的有效合同、force参数或需要保留的业务。新同级合法目录、未登记目录中的无关文件/不同marker仍可使用；没有将有无关文件的未登记目录一概清空或拒绝。既有marker/snapshot的默认writeFile覆盖是旧保护缺口，不是合法覆盖要求。
- 当前实际出错消费者 `verify_normal_browser_exports.ts:21` 在创建 codec、正常 Create 和命令循环之前调用守卫；已封存目标会在业务前抛错。其他调用方保留自己的 fresh/wx/空目录条件。旧固定root08/root09工具已有专用父封存保护，旧已封存根原本也不能继续写，不能把拒绝旧根描述为新游戏规则回归。

必须保留的具体边界：未通过 snapshots 参数登记的动态文件，通用helper无法识别。例如 `collect_course_evidence.ts:11` 的动态快照和部分旧视频采集器使用默认 writeFileSync；若只产生动态partial、primary尚不存在，新增“命名产物存在”条件不等于覆盖了所有动态partial。此点已反馈主代理并追加到修复计划；各原任务的新目录/专用writer和旧失败保护责任继续保留。本次不能声称36个消费者所有动态文件都已逐运行验证或得到全面写入保护。当前正常浏览器审核有明确primary及wx，相关父封存拒写修复不依赖上述动态识别。

## 真实红绿、类型与拒写

- 原父封存缺口是**实际红事件**：normal-browser audit在root10封存父下创建子目录并完成一次107命令审核。审核计算自身成功不等于拒写门槛成功；没有把它增加到业务验收或玩家数。完整新子目录整体移至本post `unexpected-sealed-child-r1`，原错误报告和来源保留。
- guard-red-r1 实际只执行1个目标、exit1 / Missing expected exception；旧helper1504 B / `b70695b15e7cf4f615ad263a9e2f361b847edb6203d844e8c73e3c940e486026` 和原测试已保全。第一阶段9项green exit0仅证明该阶段源，未拿它替代后续partial条件。
- guard-red-r2 的两个新增目标实际 tests2 / fail2 / pass0 / exit1，源为2493 B / `07cef01effae2d13027b2de54e3488ce77cce0cb68f3cd113b976f64f51b9065`，快照保存在 guard-red-source-r2；最终 guard-green-r2 TAP明确11/11通过、fail/skipped/cancelled均0、exit0。check包装正确向helper转交 snapshots，两个新断言并非未触达分支。
- 11项是小型自有临时Git/文件系统夹具：新多层同级、已有无关文件、未登记封存祖先、悬空标记、目录链接、非目录父、已登记根、原提交marker、非法参数、0字节marker、partial snapshot。它们不冒充游戏、Chrome、历史长矩阵或恶意并发目录替换测试。
- 项目 guard-project-types-r1 已真实exit0。独立CLI types-r1 真实exit2，因 --ignoreConfig 未显式开启已安装Node类型而不可见node:* / process / NodeJS；原失败未覆盖。types-r2仅加 `--types node`、同最终源码实际exit0，没有修改依赖、实现、断言或放宽严格选项。
- `immutable-parent-guard-results-r2.json` 已读回：coverage与normal-browser两实际CLI都exit1，命中各自明确父封存错误、targetCreated=false、gameCommandsExecuted=0；不是超时/任意错误误作拒写。四浏览器入口的初轮错误文案分类和补正另保留，不改旧false；本报告未重新操作浏览器。

## 原feature、封存与同源引用

本代理读取 feature-manifest 并逐项重新核253条物理 bytes/SHA/mode：合计50197124 B，无变化；原feature为 `9b0907ccf47b2c4dcecffbde6c2b9c9b34d6b3c3`，其原Git blob/mode核定见 feature-commit-bytes。root10目前正好241个原文件加自身排除marker，共242；unexpected/missing均0，marker SHA256仍 `950c7ae0bd44a50d01a6c7856e131990caa713d0a1bf293d1d1f7368e1ea30cf`。本代理未重做Git提交/索引操作，也未把记录报告当作新功能提交。

原current-chrome-audit-r2的125个sourceHashes，目前恰1个预期漂移：`scripts/evidence-output.ts` 从原 b70695b… 改为 f16d0d20…；其余124个仍逐字同。原coverage绑定的122个实际 runtime/core/content/codec/config依赖再次读回全部逐字同，Create/命令/钱/日期/AP/随机/权限/版本/前台源未由本修复改变。原同源业务证据、当前UI/构建与正常Create审核仍保持原执行身份；不能改写旧125冻结称当前全同，也无须把目的地守卫工具变化当作引擎变化重做游戏矩阵/UI/build。

本次独立报告的通过范围只到已登记守卫修复和读取的实际终态。主代理后续仍需单独提交两脚本、核准确Git blob/mode、完成post和主记录的保护/封存/record提交，再按原范围收口同一P4步骤6；旧root10不追加。原107意外执行、首次类型失败、两次红测、旧分类false和全部未完成父责任不得删去。T17/goal、其余路线、旧PNG/真人、暂停M01与T18均不由本修复自动通过。

## 读回索引

以下除两个scripts最终源外均为本post相对路径；只是读取现有文件，不重新执行其命令。

| 文件 | bytes | SHA256 |
|---|---:|---|
| `scripts/evidence-output.ts`（仓库相对） | 2700 | `f16d0d209946822daa44340307eb4fd5766a9b82b1548ef535346b202e01697d` |
| `scripts/evidence-output.test.mjs`（仓库相对） | 5864 | `e654e4684511a61b3391ca6f5be7ef50f3dc1719b7bae626e6d53d268cb8222d` |
| `guard-repair-plan.md` | 2674 | `4cc78ab6afac37fa74c7e7dd550b32885f478512d087e8d53210c3a115b893f7` |
| `guard-red-r1.json` | 1025 | `7bf17841d42a97a7a21ca9ab5cb69c0e58ffaa77040534bda4c0381d94c8848a` |
| `guard-red-r2.json` | 736 | `d9c9ad67d12b618e6ca5c82ebda369979002e83e7ca3121e0a1875e911e423d3` |
| `guard-green-r1.json` | 705 | `ea0619c527727abd2314c2332384b536c6d8e36ebc03ee34a8515bc7ac07f652` |
| `guard-green-r2.json` | 684 | `4dbe91431182ef2edc99c82b0b726e09fc578cccd211f76754dbdbc93c74edc3` |
| `guard-cli-types-r1.json` | 523 | `f0e98d7971b2c7dfa1d0887c95a218811579b52e786c6bad309917da0518048a` |
| `guard-cli-types-r2.json` | 749 | `edefc55440403aa629c0ff9a4ffc0da348c392a02097eb048b2c5503f1749f9c` |
| `guard-project-types-r1.json` | 227 | `7bea968225da3d3b988b410e04177aff24eb0ed825533b3b2378ef04585a2865` |
| `immutable-parent-guard-results-r2.json` | 977 | `030b21fb131c9ecec64f8b7e6eac6d98b00e4444b51b8deb265b11eaf2b13dcc` |
| `unexpected-sealed-parent-write-r1.json` | 1066 | `ca03270106a144b81d0e44222762279eb22311f586b9b6bea77c7226b69c7b25` |
| `unexpected-sealed-child-r1/normal-browser-export-audit.json` | 24970 | `d94d0ae1f4aaebfd8b2c9811263ee172c89cad34d5e969b29ffcd957f4b940f9` |
| `feature-manifest.json` | 55195 | `3f24d5b6b17f19a0ff18dfb63f672e4086a252d3a88dec89a26f34e67332068f` |
| `feature-commit-bytes.json` | 81388 | `883affbf1901daccc887b566da6e08ca0170b48ea90c41090b30a18941a4fa07` |
| `guard-red-source-r1/evidence-output.test.mjs` | 4976 | `0f07c93da25a8a82333103a4c883f2bef7847abe6114c657e8e716c64bb1affc` |
| `guard-red-source-r1/evidence-output.ts` | 1504 | `b70695b15e7cf4f615ad263a9e2f361b847edb6203d844e8c73e3c940e486026` |
| `guard-red-source-r2/evidence-output.test.mjs` | 5864 | `e654e4684511a61b3391ca6f5be7ef50f3dc1719b7bae626e6d53d268cb8222d` |
| `guard-red-source-r2/evidence-output.ts` | 2493 | `07cef01effae2d13027b2de54e3488ce77cce0cb68f3cd113b976f64f51b9065` |

[杠精审查] 限定守卫修复通过：真实父封存漏洞及命名partial漏洞均有旧红/新绿，实际拒写不委派游戏；未删除失败、改旧sealed、把1个tool源漂移混作引擎变化或夸大动态partial覆盖。主代理的提交和最终record封存责任继续执行，不用此报告代替。
