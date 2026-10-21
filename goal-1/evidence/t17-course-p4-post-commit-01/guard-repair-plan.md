# P4步骤6：实际父封存拒写缺口修复

原feature9b0907c的253条Git blob/mode已核定。四浏览器入口实际抛EVIDENCE_SEALED_USE_NEW_ROOT；首轮报告因错误预期CLI文案把它们记false，原报告保留、独立分类补正。coverage CLI也按父marker拒绝。

通用scripts/evidence-output.ts原来只查目标marker是否入Git，未查父目录封存/已提交任务根。normal-browser audit反而在sealed root10下创建sealed-cli-probe并实际完成一次107命令审核；不是预期拒绝，不能计为门槛成功或额外玩家。原241文件/marker未改，新自有子目录和完整新报告已整体移到本post/unexpected-sealed-child-r1，原根文件集恢复，红证在unexpected-sealed-parent-write-r1.json，旧根不回写。

在同一P4步骤6先修此缺口，再完成任务：通用helper在mkdir及调用者业务之前检查所有封存祖先、目录链接/非目录，并对goal-1/evidence/<task>已有Git登记拒绝新子目录；保留原参数/默认、单目标marker提交检查以及未登记正常目录的行为。复用现有错误约定，Git只读操作走RTK。不变更游戏/经济/codec/随机/日期/AP/权限/UI/CSS/构建/依赖，不做任何页面兼容测试。

验证采用新小Node实际Git/文件系统夹具：正常新兄弟/多层目录、原未提交目录保留、封存父/祖父/悬空marker、目录链接、已有Git任务根与原committed marker、畸形参数。夹具在新自有临时Git仓库，不改项目HEAD/index。实际红后修源码、全套绿、严格CLI与项目类型；实际原两个CLI fresh子目录应在工作前拒绝、原根逐字不变。只涉及输出目的地前置，原122引擎依赖与Create算法未变，不重跑游戏矩阵或UI；原R2 source125中此唯一tool hash的变化另记，不冒充原冻结全同。

修复以新本地提交保留feature和所有失败。仅所有门槛/Git/guard真实完成后才在主tasks完成P4/5b；之后原5c—5f/6及7—15、旧PNG/真人、暂停M01/T18均保留。此post暂不封存，直到补正与Git核定结束。

命名失败产物边界补正：已有但尚未入Git的primary marker、以及调用者显式列入snapshots参数的partial文件（包括0字节/悬空链接）同样不得覆盖；在保留原committed marker错误之后以lstat拒绝。正常未登记目录里的无关文件/不同marker仍可保留。本项已有两个独立小红测。没有通过snapshots参数登记的旧动态快照无法仅由该通用函数识别，不宣称全部36个旧consumer的所有动态partial都受此新增条件保护；原任务fresh目录/各专用writer责任不减。
