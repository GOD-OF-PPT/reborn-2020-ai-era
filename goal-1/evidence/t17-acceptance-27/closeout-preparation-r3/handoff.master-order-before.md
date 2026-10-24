# R3候选：保留已提交P0，只纳入原R1

当前实际HEAD为51a794d49a80fc8c3db59ad8f3bf3b2936ffbd33/main，origin原PUBLIC仓库，index空。已完整分段重读当前input1行、plan565行、tasks773行，原目标/五路线/24季/四AP/兼容暂停与P3全部后续不减。当前只收原S4-R1必要正确性，下一轮才U1；不继续R2/R3业务扩张。

## 本次关键修正

三master实际working=原root27开工working（含P3）+4528B旧R1+2335B已提交P0。HEAD51a原blob=5aec原blob+该P0，P0三处均SHA9ad16f8de6780a7f5058085ee150fca74189dab4c3d2a282b0fa106c58025579且仅一次。

R3的masters()绑定r3-opening.json当前完整working前缀，未来只接受append；intended=HEAD51a+P0前的未提交R1+P0后的新增R1尾部。它校验原开工prefix/SHA/mode、原P3唯一插入2304B/14LF/SHAd6d2ae…、HEAD中的P0原字节及working唯一位置；P0不重复、不丢失，P3完整保留磁盘且不进新blob。若Root要修改开工前缀，必须停下另作可审绑定，不能让脚本猜切分。

AGENTS也由P0选择性提交了新方案章节；当前对HEAD只剩原第18条517B/2LF。p0-committed-files.json绑定其当前整字节/原18和已提交HEAD哈希；未来普通暂存其完整磁盘即可，不能用旧AGENTS覆盖P0。P0其余34个非master路径（docs36与独立review）均核当前==提交blob，并作为保全输入；不再纳入R1 stage。

原r2候选只读hash/mode全同，未改、未执行。R3仅读其文本作模板，5个新candidate实际导入本目录lib；lib的纯IO/tree/blob工具继续复用sealed root25，不导入r2运行。不要直接执行旧r2。

## 当前只读结果与范围

见read-only-result-r1.json：语法5/5实际0；当前35个src/ui增量、唯一新增relay-service-kit-v1.png、AGENTS原18、docs37和未来root27精确文件集合，另3个选择性master；非UI/旧资产/未知status路径拒绝。原1217非master/26P3/8配置/53旧marker、原input61B/SHA20c73保持；Root19实际1197文件/110目录/模式精确同sealed C2锚（1191项另有R1开工锚，6条.log仅C2锚，不编缺失hash）；root25/root26两完整payload实际verify。这里不冒称全部历史seal payload重审、P3正式62/22或游戏验收通过。

本目录开工错误原样留存：guard对不存在子目录先调用导致ENOENT（创建0，改为先guard现父再mkdir）；P0路径误假定不含AGENTS，遇实际AGENTS立即停止（候选创建0），随后明确原18的范围。

当前root27仍有writer。本次树/数量/预期masterSHA只是活树读回，不是最终freeze或stage名单。Root完成全部原生/有限停止/全原文审核并明确停止writers后，必须再调用候选重算。所有输出先经祖先guard，拒symlink，marker精确集合/bytes/SHA/mode与目录模式，仅根sealed-evidence.json自排。

## 未来Root最小顺序（本次均未执行）

先核HEAD/main/origin/owner PUBLIC与空index，完成root27最终tasks、源/输入/导出终态，所有writers停写。另建fresh同级post三文件，建议goal-1/evidence/t17-s4-relay-r1-post-commit-01，存在则换编号；extra-owned-paths.json显式写本目录example的3条。选定post编号若不同，Browser snippet的post路径也须按实际使用。

1. Root最终明确冻结后封存/读回：

    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r3/seal-root27.candidate.mjs --create-after-writers-stopped
    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r3/seal-root27.candidate.mjs --verify

   该flag是Root声明，不探测writer。封后不再向root27写tasks或日志，实际提交结果写独立post和master追加。
2. 四Browser封存入口在Root当前harness用browser-guard.snippet.js.txt实际拒写/delegate0；两原CLI父保护如下，结果只写独立post：

    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r3/cli-guards.candidate.mjs goal-1/evidence/t17-s4-relay-r1-post-commit-01

   原collect_course_evidence只作既有CLI守卫入口，不称业务采集。两CLI须原exit1/封存原因/目标未建，before/after精确同；原错误保留，不能改marker兜底。
3. 重算并审阅最终名单/3master文本，然后才显式stage：

    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r3/feature-stage.candidate.mjs prepare goal-1/evidence/t17-s4-relay-r1-post-commit-01
    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r3/feature-stage.candidate.mjs stage goal-1/evidence/t17-s4-relay-r1-post-commit-01

   prepare不写index；stage才执行NUL git add -f及选择性master hash-object -w/update-index。Root独立本地feature commit，不push，之后显式传实际SHA：

    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r3/feature-stage.candidate.mjs verify-commit goal-1/evidence/t17-s4-relay-r1-post-commit-01 ACTUAL_FEATURE_COMMIT

4. 只向3master append实际feature/剩余责任；post文件完成后准备record。record只取feature-time完整workingSnapshot以后的新增尾部接feature原blob，不重拼P0或原R1：

    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r3/record-masters.candidate.mjs prepare goal-1/evidence/t17-s4-relay-r1-post-commit-01
    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r3/seal-root27.candidate.mjs --create-post-after-writers-stopped goal-1/evidence/t17-s4-relay-r1-post-commit-01
    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r3/record-masters.candidate.mjs stage goal-1/evidence/t17-s4-relay-r1-post-commit-01

   record也用NUL stdin名单，stage/verify只stdout，不回写sealed post。Root本地record commit后：

    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r3/record-masters.candidate.mjs verify-commit goal-1/evidence/t17-s4-relay-r1-post-commit-01 ACTUAL_RECORD_COMMIT

   需要落盘stdout时只能另fresh sibling经guard；不重定向到已封post。两次均核stage0/OID/逐blob完整bytes/SHA/Gitmode、父commit/精确路径集合、master磁盘P3及空index；不reset或扩大git add。

本次未seal、未final prepare、未Git add/hash-object-write/update-index/commit、未Browser/CLI拒写或旧测试重跑，source/master/旧证据修改0。原生全部终态及R1是否完成由Root负责，本候选不作体验或整体T17/goal结项。
