# P2批次审计器只读复核

复核对象：goal-1/evidence/t17-acceptance-06/audit_matrix_r2.py，SHA-256为37a2cd2f325e2636439ec1ffa168a9d64660682c1a7f67a22443a6f20732ffd1。

本次仅阅读源码、现行计划及已有R1/R2采集接缝；没有执行审计器、游戏命令、回放、测试、类型检查或浏览器，没有修改冻结collector/scenario/assertion/原policy。本文件wx新建。以下是审计器自身的漏覆盖风险，不表示尚未终态的matrix-r2当前统计已经错误，也不替代运行完成后的真实审计。

## 一、汇总与逐行证据未完全交叉核对

脚本已经逐份读回分支完整JSON并验其record hash，但第82行只对齐status/shape/identity，第95行检查的是summary row.actualClosedShape，未要求record.actualClosedShape和row一致。已算出的statuses没有对照summary.completed/policyRefused。第133—134行两个all48布尔直接从summary复制，未利用已收集的shape_outcomes重算。

具体影响：若汇总误标全48存在正向闭班、或把逐行policy_refused统计为completed，审计器仍可能写出复制的覆盖结论；这部分结论就只有采集器原结论，不能称第二份独立核对。

建议限定补正：逐行对齐actualClosedShape、helpedRetainedStudents和actualRejectedCommands；实际拒绝数量也对齐record.actualAttempts中rejected数量及record.rejectedReplayCount。随后从已验证的逐行记录重算statuses和每shape覆盖，核对summary.completed/policyRefused以及两个all48字段。无需重跑游戏。

来源：goal-1/evidence/t17-acceptance-06/audit_matrix_r2.py:74-105、goal-1/evidence/t17-acceptance-06/audit_matrix_r2.py:133-134。

## 二、边际数量不能独立证明原288组合唯一且完整

脚本比较registration与summary逐行相等，并检查六个身份各48行、48个shape各六行，但未独立限定六身份实际名称、48个参数组合，以及每个identity×shape恰一次。

例如两个身份互换一项重复与缺失时，全局shape出现次数仍可各六次，每身份仍可48条；若registration和summary同步包含这种错误，现有边际检查均不能发现。固定身份检查也有助于避免下方prefix-create-replay直接拼接身份路径时接受非原目录名。

建议按policy中固定两背景×三个seed、三产品×两主题×两edition×四支持直接构建期望键集；把registration及results的(identity, productId, topicId, edition, supportMode)逐一计数，与期望288唯一组合相等。保留现有顺序及登记比较，不用边际数量替代完整键集。

来源：goal-1/evidence/t17-acceptance-06/audit_matrix_r2.py:74-75、goal-1/evidence/t17-acceptance-06/audit_matrix_r2.py:103-109；原登记policy见goal-1/evidence/t17-acceptance-06/policy-r1.md。

## 三、只读引用到的gzip，尚未核全部实际原文文件集

check_gzip_tree正确验证每个引用的gzip存储hash、完整解压hash及字节数，也检查同名描述符一致，但没有把gzip_proofs集合与OUTPUT实际.json.gz文件集比较。未被JSON描述符引用的原文会漏过读回；当前report中的allOriginalBytesAndRecordHashesEqual因此只证明被引用的原文与记录。

建议限定扫描matrix-r2内实际.json.gz文件，通过现有resolve_output拒绝链接/逃逸后，将相对文件名集合与gzip_proofs键集核为相等。若有未引用文件，保留它并报告差异，不删除、不忽略；该检查仍是文件读回，不运行游戏。

来源：goal-1/evidence/t17-acceptance-06/audit_matrix_r2.py:54-71、goal-1/evidence/t17-acceptance-06/audit_matrix_r2.py:129-132。

## 其余已核对范围

ROOT采用本文件parents[3]，与当前goal-1/evidence/root06位置相符。resolve_output对引用的分支记录和gzip拒绝越界、非普通文件及符号链接路径；gzip确实读取并解压所有已遍历描述符，而非只比较旧布尔。P1/source哈希、旧R1 collector转向保留历史源、原goal input固定字节、无覆盖审计结果open(x)均存在。没有发现需要运行兼容任务、修改业务规则或重跑游戏才能修补的上述问题。

[杠精审查] 审计器补正待办：这三个文件与统计交叉核对缺口应在本次审计正式运行前处理；不能把复制采集器汇总称独立覆盖证明。实际批次、原失败输出和冻结运行源继续保持，P3原90关键及完整5b/T17/goal不因此完成。
