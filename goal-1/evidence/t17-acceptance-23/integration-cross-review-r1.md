# S3-V1 接线交叉审查 R1

范围：仅只读 App、OpeningMoment、NarrativeScene、RoomMoment 及直接账户/保存模型和 ui-r6 接缝；未改生产、未运行测试、浏览器、Git、兼容、服务或规则。以下为源码路径推导，不是原生复现或整个小循环验收。父 guard 在写入前通过。

## 确定问题

**P2：仅携显式失效账户的视频入口仍可被静默改成个人入口。** App.tsx:81 仅在 videoTarget 非 undefined 时保留不存在的 selectedAccountId。调用 navigateScene/openWorkspace('video',{accountId:'missing-account'}) 时，175—184/156—171 会先接下该原账户，再由81退回 personal；此调用没有 videoTarget，故 NarrativeScene.tsx:129 也未传账户给 openingFocusFor。VideoSceneChoice.tsx:38—40 对 undefined target 不作账户校验，VideoPanel.tsx:75 也仅在非空 target 失配时早返回，随后77仍有个人新账号表单。因此该形状的显式原账户会丢失，ui-r6 针对“非空目标的 owner 与 p.accountId 不一致”的 gate 无法补回已经丢失的入口身份。这是导航 API 失效边界，未声称当前正常公开记录会生成该 missing-account。

必要修复：显式请求的原账户不存在时，保留身份并同步进入可见重选门槛，重选前不渲染/提交默认个人入口；同时涵盖“无 videoTarget 的入口”，不能只扩大原目标校验。可在 App 统一拦住这一缺失账户上下文，不需改规则或引入偏好架构。非空 videoTarget＋未知账户现已由81保留并拒绝，勿退回旧 fallback。

## 本次未发现其他确定断点的边界

- 显式 videoTarget＋原 account 冲突：openWorkspace/navigateScene 仅在 target.accountId 缺省时从 channel 补 owner（App:164/171、178/184）；有明确原账户就不改。Narrative:129—132 经 public playerThread 移除原命令/等待；ui-r6 ContextReason 同步阻止 draft payload/request/submit。明确选回账号才调用 selectVideoRecord 改账户。
- 同屏翻原册：openWorkspace:159 在同 screen 且没有新 target 参数时保留 videoTarget；有新 target 则使用本次完整值。Narrative:178 的近景原册显式传 accountId/target，页脚213无参也走同屏保留。VideoPanel 的 run/account/完整 target key 隔离草稿，查看/取消不自动回调。
- 新实际ID只在 status=saved 后，从请求前公开 view 与当前已提交 view 及完整原 payload 解析（App:85—99）；videoFocusFromSaved:60—78 验证公开新对象与关联账号，未从余额或隐藏结果猜测。primary pin 另经 seasonFocusAfterSave 的 invalid-existing、同ID、同频道/原推广→同 cohort 委托边界，旁路不直接窃换 primary。
- unsaved/conflict 仅保存原 kind/payload/workspace 到 failedScene，不发布新 focus（App:102/111）；retry:220 将该原 payload 交回 onSubmission，使用旧提交为 before，原 candidate 保存成功才重新派生。跨 run 会在87拒绝，116清空 failedScene；普通 AdvanceTime 不生成新视频身份。原主关注由 currentFocus 同身份比较保留。
- 责任：OpeningMoment:60—69 独立算真实缺口、已到期义务、pause/强制事件/风险；中断时保原 focus，强制责任不被普通视频目标压掉。RoomMoment:54—65 的活动 job/pending 已透传真实完整 videoTarget 与 owner，playing:76统一用 OpeningMoment。此项不等于其他路线或有限尾声全部验收。

同屏异步回调方面，App:89仅检查 activeTab，没有以原 workspace epoch拒绝 sheet target 切换；但本次只读检查未证明正常可交互路径可在受控保存中显选新目标（selector有 busy/candidate锁），故不把这一可能性列为确定 bug。后续真实候选/重试与跨导航检查仍由根完成。

## 审读时源身份

当前根仍在有限文案修缮，以下只标写报告时文件 SHA，不冒充最终 build 或全源冻结。

| 文件 | bytes | SHA-256 |
| --- | ---: | --- |
| src/ui/App.tsx | 41762 | a71889c298408530268fc88d5039bfcedcdaf868268f7b9f1305d7702efbcca9 |
| src/ui/OpeningMoment.tsx | 22867 | 001b9964052172c91e1ed814540c360721d88f7ab606bd2e531502d0cac3f3ba |
| src/ui/NarrativeScene.tsx | 40830 | df3de20eaf2b03d630f15160796d1c47a71aed2c5100d5d0976ab55fe7f937a4 |
| src/ui/RoomMoment.tsx | 17878 | afc6919ebc08d90d9d53ff9b1ea7b5386b36d818700179a03f3ea908c5f0bd63 |
| src/ui/CinematicRoom.tsx | 14670 | ca48734483b43a6e9aed492715931b0c7368e66e7e3e6fb23b2f40696ed77b94 |
| src/ui/VideoSceneChoice.tsx | 29645 | 20c3f0f4c0be7331883c3192fa01ed80c9aea59a23c28aa09e48f4e999cf8ec4 |
| src/ui/VideoPanel.tsx | 29354 | 764103781600246a28981a585aadb832682fa78b566807bc0e7d8de36145732e |
| src/ui/video-player-thread.ts | 8217 | 3b1912d1ec2eb7043dec766c1f17ffc68aa506da7a763bb9e9461b9179ada2b2 |
| src/ui/player-thread.ts | 39885 | 8400e06811fae0bc3cc4706bb36bcec93e88259b7a00b2a9004cf433529f9ed9 |
| src/ui/season-thread.ts | 25411 | 2c0dc6736481bd133de909396fd02770bf0b2f4a49076cadfe008c49dfbe3ca7 |

结论：上述 P2 需收紧；其余限定接线未再发现确定冲突。本报告不宣称 Chrome、原生草稿、整局、人类理解度、P3、兼容或总 goal 完成。
