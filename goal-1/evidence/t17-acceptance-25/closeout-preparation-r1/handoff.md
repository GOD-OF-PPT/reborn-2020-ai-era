# C2收尾候选：尚未执行Git、封存或拒写探针

复用root24/post已执行流程，当前只完成文件系统只读调查、脚本候选和语法/纯blob辅助检查。不要把候选result或本文当作本轮封存、stage、commit、guard实证。所有真实动作/日志由Root在最终输入、Chrome exports、审核和写入者停止后执行。

## 当前范围（不是最终计数）

- 开工HEAD来自原git-baseline：ccde29aa9caac43624be3a1855c5f443ef8ac731；本次未调用Git确认当前HEAD/owner，候选prepare将重新核HEAD/main/origin及空index。
- 429开工src→本次444文件：18旧UI改变、15新UI，共33个C2 UI路径，全部枚举current-c2-ui-paths.txt；非UI源差异0。新root25在清点时866普通文件/28个.log（随后仍新增本准备文件和Root证据，不能当最终stage分母）。
- 三master各完整开工prefix逐字同，当前C2追加各2339B；baseline中原P3是唯一2304B/14换行插入块，SHA d6d2ae77cb0e8dadcee47df146d712a82dbfa4a278a2de9cec3a3a5564610655。不能把HEAD长度当插入offset，也不能把磁盘全文git add。feature候选使用当前HEAD blob＋currentDisk去完整baseline.text后的C2 suffix，工作树全文不改。
- P3指定26路径全部同原开工/先前sealed锚，excluded-p3-paths.txt完整列出，Root19本轮1197文件/110目录存在且存当前准备锚；这是准备时身份，不补造C2开工Root19全树历史证明。候选后续逐字/mode检查该锚且禁止其入index。
- 原input61B/SHA20c73…保持。root24 marker4a8df0ad…/post marker c7aa1ec9…同开工锚；候选会再核其完整453/21文件与50/1目录集合/文件mode。旧marker和目录历史mode未索引的事实不补造，候选仅新C2 seal额外记录directoryModes。
- src之外的本C2资产/AGENTS/README/docs差异未通过Git清点，本次不能声称没有。Root须在独立post写extra-owned-paths.json（明确数组；无额外路径填[]）。候选只许assets/、docs/、README.md/AGENTS.md额外白名单，遇未知dirty路径或source越界就停，不默带。

## 工具与停点

closeout-lib.candidate.mjs提供纯扫描/身份、精确seal验证、批量Git blob读回。seal-root25.candidate.mjs只有显式create旗标才写一个新marker；verify只读。feature-stage.candidate.mjs的prepare只读Git＋写独立post；stage才显式写对象库/index，绝不commit/reset。record-masters.candidate.mjs独立处理完成记录，防重复加C2 suffix。cli-guards.candidate.mjs和browser-guard.snippet.js.txt均是Root将来实际拒写用，当前未运行。

先由Root按既有guard建立fresh goal-1/evidence/t17-s3-course-teaching-post-commit-01及input/plan/tasks，写真实阶段与待Git状态，别预勾完成；最好在root25封存前建立。该post不放在root25子目录。完成root25当前全部文档/本准备文件，确认所有源与exports已停止变动后才运行：

```sh
rtk proxy node goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/seal-root25.candidate.mjs --create-after-writers-stopped
rtk proxy node goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/seal-root25.candidate.mjs --verify
rtk proxy node goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/cli-guards.candidate.mjs goal-1/evidence/t17-s3-course-teaching-post-commit-01
```

另在当前实际browser harness上下文执行browser-guard.snippet.js.txt（若post名不同只在执行文本替换变量，不回改sealed文件）；四入口journal/click/exportRaw/importText必须在delegate前报EVIDENCE_SEALED_USE_NEW_ROOT、delegate0。两CLI也必须exit1/seal错误/输出目录仍不存在；候选再次核原root25集合/字节/mode与marker一致，结果只写独立post。不要在普通Node运行替代browser-context实际证据，也不要制造真实UI动作。

Root已审extra-owned-paths.json、post仍可写且index本来为空，执行feature：

```sh
rtk proxy node goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/feature-stage.candidate.mjs prepare goal-1/evidence/t17-s3-course-teaching-post-commit-01
rtk proxy node goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/feature-stage.candidate.mjs stage goal-1/evidence/t17-s3-course-teaching-post-commit-01
rtk proxy git diff --cached --check
```

prepare生成精确ordinary名单stage-paths.nul（含全部seal成员＋marker＋UI变化＋显式extras，不含post/P3/root19），及3个HEAD+C2 suffix intended。stage用git add -f --pathspec-from-file/--pathspec-file-nul仅纳入该名单，故*.log不会被漏掉；三master用hash-object/update-index单独选择性blob，磁盘全文原样。阶段逐批cat-file --batch核全部blob字节/SHA/OID与Git mode，检查changed path集合恰相等；现有index不空、头/源/名单变动即停，绝不自动reset。whitespace若因原console/AX/diff非0须保红原文后逐路径分类，不删原日志或宽免source。

Root实际审stage结果后本地commit（脚本不自动提交、无push/deploy）；用实际SHA替换以下FEATURE_SHA，不猜：

```sh
rtk proxy node goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/feature-stage.candidate.mjs verify-commit goal-1/evidence/t17-s3-course-teaching-post-commit-01 FEATURE_SHA
```

verify-commit核父commit、精确改动集合、全部commit blob/Git mode、ordinary磁盘同、三master磁盘仍含原P3、index空；证明写尚未封存post。Root再把真实完成记录**追加**三master，更新post任务/summary（root25已sealed不改其提交前快照），运行：

```sh
rtk proxy node goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/record-masters.candidate.mjs prepare goal-1/evidence/t17-s3-course-teaching-post-commit-01
rtk proxy node goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/seal-root25.candidate.mjs --create-post-after-writers-stopped goal-1/evidence/t17-s3-course-teaching-post-commit-01
rtk proxy node goal-1/evidence/t17-acceptance-25/closeout-preparation-r1/record-masters.candidate.mjs stage goal-1/evidence/t17-s3-course-teaching-post-commit-01
```

record prepare以feature时保存的working-before-feature为完整prefix，只将**新完成记录**接到feature HEAD，不能重用开工baseline再加一遍C2。post封存后stage/verify只stdout，绝不回写post。Root审精确post＋3master stage后独立本地记录commit，再以实际RECORD_SHA执行record-masters.candidate.mjs verify-commit POST RECORD_SHA。若要持久化最后阶段输出/新status/远端只读身份，先guard建立另一个fresh sibling readback，不能追加root25或sealed post。最后Root实际查状态、远端引用/公开性与mode，分清本地提交与远端；未push。

## 保留与未验

P3 26路径、root19整树、vitest.config.ts的既有WIP、原input、旧sealed与所有旧红/超时/中间帧保留。M01全部兼容仍0，P3正式62/22、S4/S5、旧PNG0/3/真人0、T18与完整goal不因本C2收尾自动完成。当前全部脚本仅候选，真实Git/index/封存/四browser两CLI均未执行；语法和空blob辅助检查不是上述验收。

补充精确边界：record阶段使用git add -f --后独立argv，不是feature阶段的NUL pathspec。两者都不用shell拼接路径。独立只读候选审查未见新增确定缺陷；失败后的既有index/输出由Root实查，脚本不会reset或覆盖旧证据。候选从未在Git执行过，正式动作仍须逐阶段读实际终态。
