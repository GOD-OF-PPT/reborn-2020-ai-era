# 当前 Chrome 独立原文与画面复核 R2

结论：本次限定复核未发现新的确定业务缺陷。五条新导出均与日志 bytes/SHA/revision 一致；新生产 r83 与 reload 原文逐字相同，当前导入读回 r89 仍等原 R1 r89。七张现有截图已实际目检，包括后补稳定全退图。半交付金额拆分的证据明确限于 AX/原账，不把第一页旧截图当作详情画面。新完整 Create 审核的实际 exit 0 终态已独立读回；整体 P4 的最终封存、Git/旧树/远端保护和父项收口仍由主代理执行。

本报告仅只读既有原文、AX、PNG、源绑定与实际终态，用 Python 标准库核对 JSON 原款/引用/整数账务；没有执行新的 Codec/GameRun/Create、游戏命令、长矩阵、测试或浏览器动作，没有尺寸/缩放/兼容检查，没有修改生产或旧封存证据。主代理已执行的 Create 审核和真实 Chrome 动作分别归其原执行身份，不能计作本代理重跑。

## 五条新导出的身份

| 目录/状态 | 原角色 | 独立核定 |
|---|---|---|
| current-r2 r74 | import_buffer | 896077 B / `59d52a2747d55d204d014fe0964418ddc7180e675401bd0a2ac7a2ee8e36cce1`，原已保存 r74 公开输入，不是新生成 20 人招生。 |
| current-r2 r83 与 reload r83 | 两次 product_export | 各 1008274 B / `989909651a7c661a42504b9f12106ad4001ef9e974ae653a412ddd688010837a`，同一新生产结果重载前后逐字同。 |
| current-partial-r2 r89 输入 | import_buffer | 原 R1 已保存 r89 的公开输入，1017469 B / `f7858d438c6087cffdf1cfb336d3a4df024dd6daf31bf06f82d9d7a9393095d3`。 |
| current-partial-r2 r89 library | product_export | 与该输入及 R1 已核 r89 原文逐字同；本次导入后只读导航，无新增游戏命令。 |

五条新记录是 2 输入缓冲、3 产品读回，不能称五次新游戏结果。current-r2 由原 r74 正常输入接续真实 9 条新命令至 83：退款、第一段规划、推进、退款、第二段规划、推进、退款、推进至原支持完成、推进至关窗。返回调整期间仍为 r74/Jan16，没有退款回执；真正确认后才为 r75。三次退款都仍是原三位不同 personIds，原 0 新增操作费用/0AP 不等于应退学费 0。

新 R2 r83 与旧 R1 r83 **不是同一原文**。旧 R1 r83 是 Apr22 迟更新完成、含补支持的 1001925 B / `a9e1606af8930631bea69228ae697bb158c20460277ce968bbebd7e8a2f1c65a`；本轮新 R2 r83 是 Apr16 未刷新/未补支持而完整退款的 1008274 B / `98990965…`。revision 相同不允许互换现金、日期、AP、支持或业务解释。

## 新生产 r83 原账与后果

- 原 20 人唯一批次预款 1998000 分；单价 99900 分。Jan16/Jan28/Feb7 三次主动单人退款各 99900 分，未交付/已交付分别为 99900/0、49950/49950、0/99900。每一笔都指回原支付批次或原阶段，原退款债务及实际企业现金流水相配，无重复退原款。
- 两段真实交付在 Jan28/Feb7，按当时剩余学员确认 949050 + 899100 = 1848150 分；三次原退款后剩 17 人。Apr16 另有 2 人因补救期限逾期退 199800 分，再有 15 人因旧课更新未兑现退 1498500 分。五组退款合计 20 个不重复身份 / 1998000 分，全部最终 outcome 为 refunded。
- 累计未交付原预款退还 149850 分、已交付收入冲减 1848150 分；合同当前 prepaid/recognizedIncome/receivable 均 0，feeFen 为 0。每个退款操作的账户、企业、班期、原款或原阶段 referenceId 均核对；相关义务 remainingFen 为 0，实际企业现金付款总额与原退款金额相配。此处现金付清来自原账读回，不是从 UI 的“应退金额”自行推定。
- 原 guided 支持 Apr1–8 实际完成，300000 分 / 1AP；没有新 recovery slot、refresh job 或额外扩权命令。H004 在 Mar14 发生，原 dueAt Mar21，实际 defaulted=true / resolution=refunded / resolvedAt Apr16，不能将原支持完成或曾有部分 helped 当最终学习保留成功。
- 原 r74 企业现金 3730259 分，新企业现金 1402259 分：新增企业流水 −2328000 分 = 原退款 −1998000、真实原支持 −300000、Jan/Feb/Mar 维护合计 −30000。个人账户 13590000 分，未被退款挪用。企业累计收入净额 0、历史成本 597741 分，故企业现金 ¥14022.59 不是利润，原资本仍须分开；不得把画面选中的个人可花 ¥135900 当企业可花。
- Q2 只有原支持 1AP，余 3/4、预留 0，与当前全退 AX 和稳定截图相同。三次退款命令为 0AP，原教学在其实际 Q1 日期耗点，不因推进换成免费教学。

## 实际画面与 AX

已通过 view_image 读取七张 PNG，未以读取图片代做页面兼容测试：

1. `refund-before-confirm-r74-first-page.png` 显示企业主体、0 操作费/0AP与 Jan16；`refund-before-confirm-r74-terms.png` 的第二页清楚列 ¥999 应退、原预款 ¥999 / 收入冲减 ¥0、课程/原班期、未到账说明和返回/确认。真实 journal 的返回调整后仍 r74，再确认才 r75，与原回执相符。
2. `refund-half-confirm-r77.png` **仅是第一页**，图中没有 ¥499.50 + ¥499.50，不能作为其详情视觉证明。对应 `refund-half-confirm-r77-ax.txt` 的实际第二页 AX 有完整 ¥999/¥499.50/¥499.50、企业主体、Jan28和原两个按钮；新 r83 中 Jan28 原退款及收入冲减另实核相同。原图保留，不为补截图重复跑相同业务。
3. `refund-after-confirm-r80.png` 第二页实际可见 ¥999 应退、原预款 ¥0 / 已交付收入冲减 ¥999、不冒充到账，原两个按钮可见；AX 与 Feb7 原退款相符。
4. 旧 `course-all-refunded-final-r83.png` 标题正确，但副行仍为时间回响；它不能证明最终数字副行。后补 `course-all-refunded-stable-r83.png` 已实际目检：0 人留存、20 人有退款记录、¥19980，实际付款仍看原账，两个选择/原记录入口仍可见。journal 明确补记前后帧差异，新图使用同一 bytes 保存和 emit，不覆盖旧图。
5. `course-partial-refunds-current-r89.png` 实际可见“留下了学习，也留下退款”、17 人留存/3 人退款/¥2997，仍写“实际付款仍看原账”；课程选择与原记录入口保留。该图来自旧 r89 导入后的新 UI 只读显示，不能写成本轮重新做及时更新、两次支持或重新玩到89。原 R1 r89 所有原账事实继续按旧来源成立。

这些原帧继续采用 A 电影课堂、场景上的编号选择和纸本分步确认；本报告不从截图推断未操作页、全局无滚动、所有焦点/草稿或所有操作均无缺陷。原册跨页和关闭焦点的旧实际责任由 root10 原记录承担，不冒充此代理新增验收。

## 连接、失败与当前 r89 读回边界

Chrome3 连接不可用后记录为 Chrome4 / 用户1，沿用户要求使用 Chrome，没有切尺寸/缩放。新 DEV 连接最初可见故事为 0 的原因**未建立**，不能断言旧存档丢失、成功迁移或是产品/工具的哪一种原因。原 R1 r89 文件完整保全，本次以公开输入恢复到当前连接。

第一次 r89 导入在本地 DEV 故障库真实显示保存中断，`import89-dev-abort-ax.txt` 同时显示入口/0故事和“旧档完整、重试同一候选”；检查原缓冲后同一导入重试成功，之后页面已保存89。它是当前导入写入失败/重试证据，不能替代 R1 正常游戏命令候选74/独立物理73/同候选重试74的原子保存证据。当前 r89 public home/library 导出与原 f7858 全字节同，不等于本次新执行89个命令。

现有取证包含真实工具/观察失败：生产 journal 有 21 条 observationError（多次 CDP click 超时，但随后读取到已保存新 revision；没有盲目重发变更）、初次文本即时长度误读、懒加载未就绪；DEV 有 finance-open-not-observed 及首次导入真实 abort。父任务还保留两次 finance 打开观察/transport 超时。最终成功从公开入口故事库取得 r89 原档，不把绕回入口导出说成先前 finance 打开成功。保留未知原因，不声称“没有工具错误”或整体“无 bug”。

## 当前审核与父项门槛

`browser-audit-complete-r2.json` 已读回实际 wrapper/driver exit 0、validationErrors=[]；对应完整审核报告是 16 raw / 4 input buffer / 1 Create / 107 unique commands、allByteEqual=true，包含原 R1 的11条和本轮新增5条，不是16个新玩家或107次本轮新Chrome提交。本代理再核其125 sourceHashes及21 inputHashes与当前物理字节全同，并核五份修缮UI源与 active-ui R2 / build R2 冻结一致。此审核证明从正常创建的原文一致性，不证明浏览器操作或画面；本代理没有重跑它。

当前 typecheck/build R2 终态均真实0；生产5314的44资源与首页/HTTP相等见原 `production-build-r2.json`，这是原主代理的读回，非本报告新HTTP执行。原适用UI121/121及规则经济/课程保存/历史代理各85/68/37的已实际终态可沿同源分别引用；book-layout两多宽度仍paused。当前退款/闭班限定问题已有静态、实际UI和当前窗口图/AX/原文证据，未发现要求再改生产的确定缺口。

父项收口仍须按原计划完成六Q的具体证据映射、完整378与原48实际正向的同源引用核定、全面检查-debug2/GJ，以及最终旧树/旧交付/远端保护、正确selfExcluded封存、本地Git逐blob/mode/链接原文核验和主记录；相应已完成条目可由主代理引用现有真实报告，不要求重复长矩阵。此独立报告不单独把 P4/5b、T17、goal 或整个仓库判为通过，5c–5f/后续玩法美术、旧PNG/真人、暂停M01和T18不减少。

## 本次读回的物理文件索引

以下为读取时字节，root10相对路径；PNG全部保持原件，未重采样/裁切/改图。journal 的后补说明与旧帧一起保留。

| 文件 | bytes | SHA256 |
|---|---:|---|
| `chrome-current-r2/course-all-refunded-final-r83-ax.txt` | 2202 | `224ff8976405ffad6266e368dbfddab882a470aa083ecc8a2d7569c4763d97d5` |
| `chrome-current-r2/course-all-refunded-final-r83.png` | 95535 | `b1ab39b09effa6cf38a26c5c628b137e5d8143214fcad0fcc673b9ffc9a9c2dd` |
| `chrome-current-r2/course-all-refunded-stable-r83.png` | 95633 | `bb5d1d5647feba684866ac6387bacbe683d3a595aba5d1d180e64197a861a7b7` |
| `chrome-current-r2/exports.jsonl` | 1553 | `ae1b26d91ad4e077f08bc3165df896765d848148c1f93d044ba281a952c16269` |
| `chrome-current-r2/native-progress.jsonl` | 49800 | `50bb7b793057444ef78231a8d19c87373bbea43b988aa3617d948faaff19fe20` |
| `chrome-current-r2/r74-current-import-text-before-import.json` | 896077 | `59d52a2747d55d204d014fe0964418ddc7180e675401bd0a2ac7a2ee8e36cce1` |
| `chrome-current-r2/r83-current-after-reload.json` | 1008274 | `989909651a7c661a42504b9f12106ad4001ef9e974ae653a412ddd688010837a` |
| `chrome-current-r2/r83-current-three-refunds-default-closed.json` | 1008274 | `989909651a7c661a42504b9f12106ad4001ef9e974ae653a412ddd688010837a` |
| `chrome-current-r2/refund-after-confirm-r80-ax.txt` | 14268 | `13ea84b2cd4163cf21de112528068a5ed6272d74a43cbac726860cd50741c13e` |
| `chrome-current-r2/refund-after-confirm-r80.png` | 47112 | `29c3e35cdeee7b322305818a8dbc0d2f2e8039bc1aa77999b3141af4bd4b8da7` |
| `chrome-current-r2/refund-before-confirm-r74-ax.txt` | 13749 | `2459f1a47e8d9e42ffe4cc3578998ec916dc537cb83d7c845794e0298211a54d` |
| `chrome-current-r2/refund-before-confirm-r74-first-page.png` | 34378 | `6af87a01ced87649b0462dba83b83d28e7b615f929f06667d50078acff3cd955` |
| `chrome-current-r2/refund-before-confirm-r74-terms.png` | 47138 | `f09496ed38063a12e6f64e7910686c0e20455514234238952f744ce6ba4fd1ac` |
| `chrome-current-r2/refund-half-confirm-r77-ax.txt` | 14439 | `f1ffc4b1fec311fcc0e832140cf4c24c2a040dd8f446a7f3edbbd5df5f71a0bc` |
| `chrome-current-r2/refund-half-confirm-r77.png` | 34436 | `040716bd0a5bce2ffb2075bf4ec33dce272e4d8858f8050ed3a9e2ef42353f51` |
| `chrome-current-partial-r2/course-partial-refunds-current-r89-ax.txt` | 2878 | `e7ee8620e1a4c14e14f1c15b65dcedd0c26c441d86f16a6bd2ea01629f09e80a` |
| `chrome-current-partial-r2/course-partial-refunds-current-r89.png` | 87833 | `5a4552c86be4abc962dd0727cad7ffd363796143ba0d313e3a0cda7e4edb6d94` |
| `chrome-current-partial-r2/exports.jsonl` | 1079 | `42cdd4f1a26bd2ec1ad9950b2091c091395454b685127c76b3ae70f8a273f493` |
| `chrome-current-partial-r2/import89-dev-abort-ax.txt` | 3523 | `38daca63ae0ebde57f672db629b2c271acc41e97d9f9f983486bc02372c07827` |
| `chrome-current-partial-r2/native-progress.jsonl` | 11430 | `a20c400941498d06261ae550754a072b9788ecb76a9a3dc184a3d8fb9b4ca68b` |
| `chrome-current-partial-r2/r89-current-library-after-readonly.json` | 1017469 | `f7858d438c6087cffdf1cfb336d3a4df024dd6daf31bf06f82d9d7a9393095d3` |
| `chrome-current-partial-r2/r89-current-partial-import-text-before-import.json` | 1017469 | `f7858d438c6087cffdf1cfb336d3a4df024dd6daf31bf06f82d9d7a9393095d3` |
| `browser-audit-complete-r2.json` | 253 | `c5828542258f5327341387308fddc98e38136ad3c70e12cb629b85e667b21b34` |
| `current-chrome-audit-r2/normal-browser-export-audit.json` | 24970 | `0c3dc2d89e45b5cf584f226e2de72f45e42ee56ceb3ec66b051dd8ff696673d6` |
| `checks-r2/typecheck/complete.json` | 549 | `15b0c31d554ec033ad17349eec29f732881c7d8b1823e42685a78b9b312d8c5b` |
| `checks-r2/build/complete.json` | 601 | `8d022addaccbc91bebae1bf999489af74a601fa460ccf381b50dda94fd61f965` |
| `production-build-r2.json` | 10078 | `32a51348330eae22109c398b815f1c14181311425d5ae7e80ac104ba72a29bdd` |

[杠精审查] 限定只读原文/实际截图/终态复核通过：先前截图帧界限已如实纠正，未把AX当图片、导入当新游玩、应退当到账、现金当利润或同revision当同原文。没有增加隐藏事实策略、放宽原范围或恢复兼容工作；整个P4与父目标是否收口仍由原完整门槛决定。
