# D11 最终源与保全只读复核（R6观察）

观察 2026-10-21T21:29:06.210436+00:00—2026-10-21T21:29:09.203973+00:00。HEAD `351f2f588c70aacdf8cd241e9599a81a6e1f6316`，仓库 `GOD-OF-PPT/reborn-2020-ai-era` / `PUBLIC` / 默认 `main`。本轮仅文件/Git对象读回与新建本报告；测试、浏览器、geometry、HTTP、服务、stage、commit操作均0。

## 实际保全

- 当前tracked变化12项，均为D11授权UI/测试、AGENTS/master；异常tracked/untracked均0，index空，HEAD和差异集合前后同。新增源码4项，其他新增均在root16。
- tracked：`AGENTS.md`、`goal-1/plan.md`、`goal-1/tasks.md`、`src/ui/App.tsx`、`src/ui/CoursePanel.tsx`、`src/ui/NarrativeScene.tsx`、`src/ui/VideoPanel.tsx`、`src/ui/course-scene-progress.ts`、`src/ui/game-types.ts`、`src/ui/scene-encounters.css`、`src/ui/video-scene-progress.test.ts`、`src/ui/video-scene-progress.ts`。
- 新源码：`src/ui/App.preparation-save.test.tsx`、`src/ui/CoursePreparation.tsx`、`src/ui/course-preparation.test.tsx`、`src/ui/video-target.test.tsx`。
- 实际读原HEAD的规则/应用/内容/存档/版本/依赖配置blob 211份、1620724 B，逐chunk与磁盘原字节/kind/Git mode直比并重算Git对象ID，异常0。分类：`{"dependencies/config": 10, "src/application": 66, "src/content": 13, "src/core": 103, "src/persistence": 19}`。
- `goal-1/input.md` 61 B，SHA `20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1`，原话保持。root16 input原绝对skill Markdown链接仍属输入原文，未为资料绿改写。
- 最终 `source-freeze-r6.json` SHA `c12dc57e2f233ebf36be9cfb60f9a7e270d9364c7d1eab18f0d8dcad77959282`，实际376项＝372份src TS/TSX/CSS＋4配置/锁文件；当前src精确集合相等、376项前后两次SHA漂移0。不是376份全src，也不冒称所有动态证据冻结。
- R5→R6精确仅 `course-scene-progress.ts` / `course-preparation.test.tsx`：planned“安排已记下尚未开始”、running“写作已经开始”，测试追加两条状态断言。该登记变化单列，不报未知漂移。初次R5审查遇R6替换而保守退出且未写报告；本报告依据R6重读。

七旧marker与prior-seals-opening完整SHA全部同：

| marker | Bytes | SHA-256 |
| --- | ---: | --- |
| `goal-1/evidence/t17-acceptance-12/sealed-evidence.json` | 1691 | `246795ce56ac8fe613f1317e74055c9a6722c147e4fae1784a9bb1372288b953` |
| `goal-1/evidence/t17-acceptance-13/sealed-evidence.json` | 44575 | `1b2a7def15bb2d712eb32e7a244b441c298d4f2a0a7a031ad712e06d03dde2da` |
| `goal-1/evidence/t17-acceptance-14/sealed-evidence.json` | 78895 | `8017926d56f8735832329f6428ff8078f1d50a691f28787ad34177dc7d83074d` |
| `goal-1/evidence/t17-acceptance-15/sealed-evidence.json` | 49877 | `4a6346a31a15b4fa58232a79786d1f5df0fc7e251696d40c5435dd3331d9de81` |
| `goal-1/evidence/t17-game-clarity-post-commit-01/sealed-evidence.json` | 3150 | `0913f2553918a78b8e7382e6a390e819a64d1a0825e644228f97f8735c47cf07` |
| `goal-1/evidence/t17-game-encounters-post-commit-01/sealed-evidence.json` | 3748 | `b10c8e594f6cbc6b23c84bb670ec24e16c3fd5c453a8fb0c9d87d8f9ebd46c6d` |
| `goal-1/evidence/t17-d10-ui-post-commit-01/sealed-evidence.json` | 4099 | `d22f61c20e5270cb2ad37b3fe4594407d5d77e25b873dc4a8919ebea905cfc22` |

本轮按要求实读marker，没有重新逐读七旧目录所有成员/物理集合，不扩大成全目录新验。

## 三条交互链

当前静态没有再发现确定阻断；日期输入/blur/确认一致及完整实际闭环仍由R6当前窗口证据核定。

1. 准备：资金卡仍走原确认，首卡¥2,100明确大纲后留¥2,000，资本不记收入/费用；资源显选，大纲¥100/1点/7日与原定义一致。日期onChange/onBlur同字段捕获，原预览仍校验真实日期/产能/AP/资金。business.prepared且同业务completed outline才显示完成；planned/running本次已分开。等待仍走原playableAdvanceDate、暂停/交付/季度及AdvanceTime结算屏障。准备书本key按同run/business/phase稳定，清回响不再卸载草稿。
2. 同对象：video progress携带channel/work/contract/section，经App传到VideoPanel；解析验证归属/互指，缺失目标明确提示，定位只复用ScreenBook锚点。账号/全部记录继续可达，没有导航代执行命令。
3. 保草稿：例外白名单只有LicenseCourseMaterials真实saved；核同run/course、原册原本已开且仍开、同account/epoch、账户存在、非只读与committedEcho，保留CoursePanel实例并在原册呈现真实回响。其他命令、跨上下文、关闭后重开、失败/冲突/只读与原候选重试不自动复活旧册或接受后续课程/招生/扩权。

## 原红档与结果范围

- [R5原红档](affected-tests-r5.txt)：exit1，beforeAll原20000ms超时，5 skipped，不计通过。
- [R6原红档](affected-tests-r6.txt)：exit1，4 passed/1 failed；原显示夹具缺view.features，journeyIntent读journey报TypeError。
- [R7既有结果](affected-tests-r7.txt)：exit0、单文件5/5；显示用例改用真实正常GameController公开view，beforeAll仍20000ms。早于最终两条状态断言，不冒称新执行。
- R8最终准备测试：已实读终态：{"command": ["rtk", "proxy", "npm", "run", "test:unit", "--", "src/ui/course-preparation.test.tsx", "src/ui/course-scene-progress.test.ts", "--maxWorkers=1"], "exitCode": 1, "scope": "R6 final preparation phase wording and R7 actual public controller fixture. Original tests, assertions, limits retained."}
- [R5构建](build-r5.json)与[最终R6构建](build-r6.json)均实际exit0（原npm build含tsc）；不等于新全suite或浏览器通过。
- [R4日期错配原件](chrome-production-r4/outline-date-mismatch.txt)及原course-funded-r60.json身份保持。原错配未提交；本报告只核原件和onBlur源，不操作5328、DB或替根代理确认画面日期。

关键证据身份：

| root16文件 | Bytes | SHA-256 |
| --- | ---: | --- |
| `affected-tests-r5.json` | 176 | `ff1694c57731229014fa5dba73a751b223b2199c4f43785b064a4938f3233107` |
| `affected-tests-r5.txt` | 1054 | `e56b09bb37368e3fc1231214b17aa780b901f772eac0ad16b466780c8d01d12a` |
| `affected-tests-r6.json` | 314 | `986bea6d193eabf0c4a9b47f3324ebf6f265a30ebbaeaa4ac28053f3e8448bc4` |
| `affected-tests-r6.txt` | 2216 | `9ba7aec788dffa07337544fb259f200246637a85e3d780cb7918a0cbae5f8b5c` |
| `affected-tests-r7.json` | 338 | `0f46e720b51d8ee23ef52aa878e224ac6f74c2933e32f681a375a6b33cc72cef` |
| `affected-tests-r7.txt` | 317 | `0502486a7df9d33d3d4e286ef8f975e06f5043797438b72a628883354fdb6720` |
| `affected-tests-r8.json` | 355 | `39593bc48b3deaa2bdc6686e0d965184dbcc8404c2e8308e694b81bd6f5d7d54` |
| `affected-tests-r8.txt` | 1115 | `9fba405e89b4d851130428a9c5d88e5448ea4f03e5c2a43e38e72063232cc07e` |
| `build-r5.json` | 471 | `77e4669f1744bf4e40a00f28e81294be0ec98566e3f616893419bed1f90d6cb1` |
| `build-r5.txt` | 4751 | `4be30dd41da7a42f1357f1c1d4b97db145211ee6e998a06a5b2dfbb271c815fc` |
| `build-r6.json` | 384 | `a74611449041936757a3afef4dc2bb0e7d2c6dd9b2cec2ea9573237662fed8bd` |
| `build-r6.txt` | 4751 | `f100827ab31f6785f79b6a83f84541addccf0ec479bc3f2c73fedc5cae3e3401` |
| `chrome-production-r4/outline-date-mismatch.txt` | 4124 | `ae2ce8eb47e88c7495a2491714b0d2e071678a58e12daafd14b131485b055114` |
| `chrome-production-r4/course-funded-r60.json` | 785667 | `fbad670717fe4adabe01f8f66058b237461ff94184ae1a75166396794bf362fc` |

边界：旧矩阵、真人理解/趣味性、原PNG、完整T17/goal、M01/T18均未由本报告完成，兼容开发/测试0。所有祖先至/物理目录/无链接/无sealed已核，原browser_evidence_guard通过，root16未tracked/未index；本报告wx，源/旧sealed/旧报告/plan/tasks均0写。
