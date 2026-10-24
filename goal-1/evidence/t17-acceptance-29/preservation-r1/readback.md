# U2开工基线与旧证据保全读回

本次纯文件读回通过，terminal-r1.json记录exit0；没有Git、游戏/测试/回放、网络、浏览器、源码/master/旧证据写入。原authority、脚本和本次530项源/资产在读取前后保持；完整结果及每项身份见result.json/source-diff.json。

| 范围 | 本次精确结果 |
| --- | --- |
| P3原26路径 | bytes/SHA/mode全部同root29/baseline.json；仅保全，不是P3功能或62/22验证 |
| 三master | goal-1/plan.md 116770B、tasks.md 225011B、t17-plan.md 111319B，各完整文件与baseline及开工副本逐字同，不只是前缀 |
| 原P3正文 | 三处offset72049/180290/66598，均2304B、14个LF，SHA d6d2ae77cb0e8dadcee47df146d712a82dbfa4a278a2de9cec3a3a5564610655，位置唯一；旧root25已补正封存结果作offset锚，未调用Git |
| 旧marker | baseline列出的112份全部bytes/SHA/mode同且读取期间稳定；不冒称已复核所有旧payload |
| root19 | 精确1197文件/110目录，文件bytes/SHA/mode与目录mode全同，无增删/重复/符号链接；根marker仍不存在 |
| root19完整锚 | root25/closeout-preparation-r1/root19-preparation-tree.json 315952B，SHA57aaedd2a7b4dc81ecea4f1b34dbcaa39c024c171f706b2c6bc6be04c2ed1c7e，mode0644；其封存索引项逐字核对，root25 marker自身又同本轮baseline |
| baseline的root19覆盖 | 仅1191条已知子集，均与完整1197锚一致；六条额外原项由完整封存锚覆盖，不能把1191说成完整开工树 |
| root28 | 351普通payload/30目录精确集合及全部文件/目录mode、bytes/SHA同；marker83421B/SHA8341e603faa1117c002fd63f7424ac006c62f8802e049757f70806aaca66649a，同baseline |
| U1 post | 28普通payload/1目录精确集合及全部文件/目录mode、bytes/SHA同；marker6717B/SHA3f8063d86d8a4d0bf104cbb2a92538c026fb0e3a05706d5132714eab88c12377，同baseline |
| 原goal输入 | 61B，SHA20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1，mode0644 |
| 源/资产集合 | baseline520→当前530；508原项未变，12旧UI变更，10新UI；0删除、0越界，309非UI全同 |

root28/post仅排除各自明确selfExcluded的根sealed-evidence.json；嵌套文件若存在仍计普通payload。root19完整树不作自排除，额外确认根marker缺席。所有指定树目录模式都有原索引而非仅报告当前mode。

## 12个既有UI变更

- src/ui/CinematicRoom.tsx
- src/ui/market-scene-progress.test.tsx
- src/ui/market-scene-progress.ts
- src/ui/OpeningMoment.focus-book.test.tsx
- src/ui/OpeningMoment.tsx
- src/ui/OpeningObject.tsx
- src/ui/player-thread.test.ts
- src/ui/player-thread.ts
- src/ui/RoomMoment.tsx
- src/ui/season-thread.test.ts
- src/ui/season-thread.ts
- src/ui/SeasonRecollection.tsx

## 10个新增UI文件

- src/ui/day-continuity.css
- src/ui/day-continuity.integration.test.tsx
- src/ui/day-perspective.ts
- src/ui/DayContinuityPaper.test.tsx
- src/ui/DayContinuityPaper.tsx
- src/ui/DayThreadAction.tsx
- src/ui/today-scene.css
- src/ui/today-thread.test.ts
- src/ui/today-thread.ts
- src/ui/TodayScene.tsx

## 本次结论的范围

source集合严格沿baseline的src/assets/public和列明根配置，P3另核其26个原路径；不扩大声称整仓/全部脚本或全历史payload未变。本次未重跑任何测试，Root typeR2/适用UI检查沿其独立终态与源身份记录，不能计成本审查运行。

三个master现在整文件同开工baseline；未来append、提交、封存后仍需Root新的身份读回，不能把本次通过作为未来改动已获保全。没有stage/seal/commit/push或修改旧根。新U2实际画面/真实命令/候选故障/完整Create与真人理解/趣味均不由本次文件哈希检查替代。
