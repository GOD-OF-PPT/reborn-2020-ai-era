# R1最终收尾候选（尚未执行）

截至本次只读核，HEAD为5aec3f3b2f463486ccfdcfbf04ef1f14f3286f3e/main，origin为GOD-OF-PPT/reborn-2020-ai-era，PUBLIC，索引空。Root仍在5362/5363完成原生证据；本目录的35个UI/1新PNG及3master各4528B后缀都是活树读回，不是最终冻结或暂存数量。

候选复用已sealed root25的纯IO/tree/hash/逐Git blob工具，原工具不改。新代码只写本目录。语法检查不是Git流程已执行、游戏测试或原生验收。

## 源与排除界限

允许：全部实际src/ui差集、新root27精确证据集合（含忽略的.log须-f）、AGENTS.md、docs37和唯一relay-service-kit-v1.png。禁止夹入：原26P3路径/全部root19、配置、核心/内容/资产旧文件、原input及任何其他旧证据。feature prepare逐项核当前差集/全status，未知路径直接停；不给“git add .”或重置索引的兜底。

保全当前实核：开工priorFiles的1217个非master、26P3、8配置、53旧marker字节/模式、原input61B/SHA20c73…同；Root19按sealed C2原树精确核1197文件/110目录/110模式。Root27开工priorFiles仅列Root19的1191项，另6条.log由sealed C2锚覆盖；首次错误地要求全部在priorFiles的红档及修正诊断保留。另与Root原preservation-r1相同口径，候选复核root25/root26两套完整payload；不声称逐一重审全部53历史seal的payload。

三个master必须保留当前工作树完整开工prefix；其HEAD与prefix仅唯一P3插入2304B/14LF/SHAd6d2ae…，不从HEAD覆盖P3。feature-intended=开工HEAD原blob+开工working长度后的R1后缀；record-intended=feature原blob+feature-time完整workingSnapshot之后的新完成后缀，不能再次拼完整R1。两个stage都用NUL列表，三master用显式blob/index写入；提交后逐路径OID/原blob字节/SHA/Gitmode与空索引核对，P3工作树不变。

## Root未来执行顺序

以下均为候选命令，不是已执行记录。Root只有在全部原生/game candidate/物理旧新/原retry/有限停止/完整Create审计结束、所有exports及本root文件停写、最终明确冻结且审查结果成立后才用；create标志仅记录Root声明，不会探测后台writer。所有新post必须先经祖先guard创建三文件，建议t17-s4-relay-r1-post-commit-01（存在则新编号），在其中显式写extra-owned-paths.json，内容见本目录example。

1. Root核owner/PUBLIC/main/HEAD与当前index，完成root27最终tasks/源输入快照和文案。之后本root永不再追加。
2. 封存：

    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r2/seal-root27.candidate.mjs --create-after-writers-stopped
    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r2/seal-root27.candidate.mjs --verify

3. 在独立post记录四Browser入口拒写（browser-guard.snippet.js.txt，Root当前原生harness执行，delegate0，不做业务动作）及两CLI原入口拒写：

    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r2/cli-guards.candidate.mjs goal-1/evidence/t17-s4-relay-r1-post-commit-01

   collector保留原collect_course_evidence入口，仅核封存父保护，不声称采集课程或中转成果。两CLI预期exit1+EVIDENCE_SEALED_USE_NEW_ROOT、目标未创建；stdout/stderr与封存前后精确读回写post。失败停，不更改旧marker。
4. 生成精确名单和三个master预期文本，Root审查后才执行stage：

    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r2/feature-stage.candidate.mjs prepare goal-1/evidence/t17-s4-relay-r1-post-commit-01
    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r2/feature-stage.candidate.mjs stage goal-1/evidence/t17-s4-relay-r1-post-commit-01

   prepare无index写；stage才有Git add/hash-object -w/update-index。Root独立本地feature commit（不push）后，显式传实际commit：

    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r2/feature-stage.candidate.mjs verify-commit goal-1/evidence/t17-s4-relay-r1-post-commit-01 ACTUAL_FEATURE_COMMIT

5. Root只向三个master追加实际feature提交/验证与剩余责任，不写sealed root27；完成独立post所有证据后准备record：

    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r2/record-masters.candidate.mjs prepare goal-1/evidence/t17-s4-relay-r1-post-commit-01
    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r2/seal-root27.candidate.mjs --create-post-after-writers-stopped goal-1/evidence/t17-s4-relay-r1-post-commit-01
    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r2/record-masters.candidate.mjs stage goal-1/evidence/t17-s4-relay-r1-post-commit-01

   record stage输出仅stdout，不写sealed post；Root需持久化可先在另一个fresh sibling经guard创建输出，不能shell重定向回sealed post。Root独立record commit后显式读回：

    rtk proxy node goal-1/evidence/t17-acceptance-27/closeout-preparation-r2/record-masters.candidate.mjs verify-commit goal-1/evidence/t17-s4-relay-r1-post-commit-01 ACTUAL_RECORD_COMMIT

## 当前未执行

未create任何seal、未进行四Browser/两CLI拒写试验、未prepare最终stage名单、未Git add/hash-object-write/update-index/commit/push、未改生产/masters/旧证据/配置、未重跑已过游戏测试。当前Root19与P3保全不等于P3 formal62/22通过。原PNG/真人、R2/R3/C-S4-R及后续整个goal仍由原plan保留。
