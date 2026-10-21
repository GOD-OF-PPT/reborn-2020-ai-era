# D10 原树保全与本地提交准备（未执行）

观察时间：2026-10-21T17:48:05.450044+00:00。本轮只读资料/脚本/轻量 Git 身份和差异清单，只新建本报告；没有运行16970重核、封存、stage/commit、测试、浏览器、HTTP或服务动作。R4状态来自根代理，本报告不新增任何游戏/构建通过结果。

当前身份：{"head": "58fee36f9b124ae07d8ccb8559f7c67dff771244", "branch": "main", "origin": "https://github.com/GOD-OF-PPT/reborn-2020-ai-era.git", "repository": {"defaultBranchRef": {"name": "main"}, "nameWithOwner": "GOD-OF-PPT/reborn-2020-ai-era", "url": "https://github.com/GOD-OF-PPT/reborn-2020-ai-era", "visibility": "PUBLIC"}}。

## 最终保全方法

开工 baseline-tracked.json：5520551 B / SHA256 5478cf9dbd979f26a32c36420d447d10ab20a71da0b27903e038d900141346cd；opening-preservation-readback-r1.json：7380 B / SHA256 4d16194e80001335257089d5320fd3634297c8f7eb229bf026b8794bec0e34dc。权威HEAD为58fee36f9b124ae07d8ccb8559f7c67dff771244；16970条（16951普通文件、19 literal links），原blob合计4356004509 B，开工全同。

待最终源/输入及全部必要检查终态稳定后，复用开工内联流式方法，不新建通用工具：逐项重新读取该HEAD实际Git blob并复算Git对象ID/字节/SHA，与baseline交叉核对；每层目录与普通文件O_NOFOLLOW，普通文件逐chunk与磁盘直比，核kind/Git executable mode及读前后physical identity。19条仅readlink原文字节，绝不跟随target。same/authorized/unexpected/missing分别列，授权路径必须由根代理按最终实施范围明确固定，不能把git diff自动当授权。新untracked证据/源码另列，不混入16970旧条目。README/AGENTS、core/application/content/persistence、schema/rules/deps/其他原文档须保持；原master3允许最终完成记录，快照仅断言该次观察。

当前轻量观察到23个tracked变更候选（不是最终授权或已保全结论）：
- goal-1/plan.md
- goal-1/t17-plan.md
- goal-1/tasks.md
- src/ui/CinematicRoom.tsx
- src/ui/LifeReferenceChoice.tsx
- src/ui/MarketSceneChoice.tsx
- src/ui/NarrativeScene.test.tsx
- src/ui/NarrativeScene.tsx
- src/ui/RoomMoment.test.tsx
- src/ui/RoomMoment.tsx
- src/ui/SceneEcho.test.tsx
- src/ui/SceneEcho.tsx
- src/ui/deepseek-scene-progress.test.ts
- src/ui/deepseek-scene-progress.ts
- src/ui/game-text.ts
- src/ui/life-scene-progress.test.ts
- src/ui/life-scene-progress.ts
- src/ui/market-scene-progress.test.tsx
- src/ui/market-scene-progress.ts
- src/ui/scene-domain-results.test.ts
- src/ui/scene-domain-results.ts
- src/ui/scene-encounters.css
- src/ui/scene-result.ts

逐物理枚举以下五旧根，检查精确普通文件/目录/链接/hardlink组/其他kind，再逐文件实读字节/SHA；marker自身须与开工完整字节及SHA同，不能仅信marker宣称。没有额外/缺失/内容/结构异常才记保持：

| 旧根 | 普通文件（不含marker） | 目录 | marker SHA-256 |
| --- | ---: | ---: | --- |
| goal-1/evidence/t17-acceptance-14 | 480 | 73 | 8017926d56f8735832329f6428ff8078f1d50a691f28787ad34177dc7d83074d |
| goal-1/evidence/t17-game-encounters-post-commit-01 | 22 | 0 | b10c8e594f6cbc6b23c84bb670ec24e16c3fd5c453a8fb0c9d87d8f9ebd46c6d |
| goal-1/evidence/t17-acceptance-13 | 270 | 48 | 1b2a7def15bb2d712eb32e7a244b441c298d4f2a0a7a031ad712e06d03dde2da |
| goal-1/evidence/t17-game-clarity-post-commit-01 | 18 | 0 | 0913f2553918a78b8e7382e6a390e819a64d1a0825e644228f97f8735c47cf07 |
| goal-1/evidence/t17-acceptance-12 | 9 | 1 | 246795ce56ac8fe613f1317e74055c9a6722c147e4fae1784a9bb1372288b953 |

最终报告须新wx写root15，所有祖先至/无sealed或符号链接、browser_evidence_guard通过、root未stage/index；完整读取结束再次核HEAD/index与已核对象未并发变化。旧root12仍为paused登记，不转成业务通过。当前仅准备，未据marker替代实读最终复核。

## 已读可复用脚本与接口

- root14/seal-evidence.py：2302 B，SHA 0379c61c0eddd20cc757b65192c5f8bfdf953605df006f6863346f0d7107154a。无CLI参数，root=脚本所在目录；枚举普通文件/原文链接/目录/hardlink，wx写sealed-evidence.json。必须在新的root15副本把scope改成D10准确范围，旧副本不动；调用者仍先做实际browser guard及root/index保护。marker不计自己，不预报最终文件数。
- D09 post/verify_task_bytes.py：22815 B，SHA 4945b9e7ca31078d7a96e4af468a979268fd7d7fe0bcd5f1a5201d4106149a75。原样复制到新未sealed sibling post即可复用，不从旧sealed post直接运行：其output-report必须位于脚本自身POST_ROOT。支持--repo-root、--manifest、--mode staged|commit、--commit（仅commit模式且必须完整真实SHA）、重复--tree-root、--output-report（绝对新路径）。manifest严格为files/symlinks两表，普通条目bytes/sha256/可选gitMode，链接target/bytes/sha256/gitMode120000。
- verifier要求manifest恰好等于本次A/M/T变更集合，不接受删除/未合并或额外路径；--tree-root逐项核完整物理集合，逐Git blob/磁盘原字节/mode直比、前后HEAD/index原字节同。它用于本次任务提交清单，不能把16970全旧树baseline直接当它的manifest。输出不得在完整被核树内部；failure返回1，报告passed=false。只读核验不stage/commit。

## 最小正确顺序及命令建议

以下均为根代理后续建议，本轮未执行。建议fresh sibling为goal-1/evidence/t17-d10-ui-post-commit-01；先完成该目录与原样verifier副本、feature-manifest.json和同集合feature-paths.nul。manifest只含最终明确D10 tracked改动/新增源码及完整root15（含marker），不含post自身；pathspec文件由manifest精确NUL生成，不能git add -A/广泛src/强加无关ignored。

1. 完成当前必要检查与原始红档说明、当前原树/旧seal/源输入/导出审核/资源/独立审查；没有仍运行的producer。每个依赖命令真正exit0且报告passed后才进行下一步；任何非0当场停止后续封存/stage/commit。原docs历史非0保留，不暗中当0或用脚本顺序继续。根目录index须空、HEAD须仍匹配开工；最终master3实施记录按事实先写，最终commit SHA写后续post/完成记录，不能写回已sealed root15。
2. 实际guard root15后单独封存；立即在新post实读精确物理集合与marker，不能只看seal进程0：

```sh
rtk proxy python3 -B goal-1/evidence/t17-acceptance-15/seal-evidence.py
```

3. manifest/原树授权清单确认精确后，仅stage该集合；以下每条必须单独等待真实终态0。stage输出写新post，不能写回root15：

```sh
rtk proxy git add --pathspec-from-file=goal-1/evidence/t17-d10-ui-post-commit-01/feature-paths.nul --pathspec-file-nul
rtk proxy python3 -B goal-1/evidence/t17-d10-ui-post-commit-01/verify_task_bytes.py --repo-root /Users/gordon/githome/reborn-2020-ai-era --manifest /Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-d10-ui-post-commit-01/feature-manifest.json --mode staged --tree-root goal-1/evidence/t17-acceptance-15 --output-report /Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-d10-ui-post-commit-01/feature-staged-bytes.json
rtk proxy git diff --cached --check
```

4. strict staged报告passed且exit0、diff-check0，才本地提交；随后单独读真实完整SHA和其父，不预设成功或远端推进：

```sh
rtk proxy git commit -m "feat(ui): clarify choices and saved resource changes"
rtk proxy git rev-parse HEAD
rtk proxy git rev-parse HEAD^
```

5. 把上一条实读完整SHA替换下方ACTUAL_FULL_COMMIT_SHA；父须等于开工HEAD，mode commit再次同manifest核完整root15/blob/disk/mode和精确changed集合，passed且exit0才记该本地feature提交完成：

```sh
rtk proxy python3 -B goal-1/evidence/t17-d10-ui-post-commit-01/verify_task_bytes.py --repo-root /Users/gordon/githome/reborn-2020-ai-era --manifest /Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-d10-ui-post-commit-01/feature-manifest.json --mode commit --commit ACTUAL_FULL_COMMIT_SHA --tree-root goal-1/evidence/t17-acceptance-15 --output-report /Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-d10-ui-post-commit-01/feature-commit-bytes.json
```

6. 新post保留实际commit/guards/全字节结果后再封存。若另做完成记录提交，使用它自己的精确manifest；核验输出放另一新未sealed根，不能向root15或已sealed post追加。最终重读本地HEAD/status和远端owner/visibility/main/README；没有push/deploy授权，不推进远端。Git本地提交不代表T17/goal或业务/兼容全部完成。

写入保护：本报告父祖先实际8层至/已逐lstat核无链接/封存，原browser guard通过，root15未tracked/未index；本文件wx创建。冻结input/plan/tasks/runner及src/config/所有旧证据0写。未测HTTP、不查或控制服务。
