# U2最终R4只读保全

逐字复用原checker，check.mjs仍11455B/SHA48c52b7365fb728291ed89c6deba0c382be09ed7e70d87c464c1ce15b7d48b39；新目录终态exit0，开始2026-10-24T07:44:43.579Z，结束07:44:45.869Z。原脚本/authority/530源集合读取前后稳定。未调用Git、游戏、测试、网络、浏览器或兼容工具；未写源码/master/旧根，不stage/commit/seal。

| 指定范围 | 最终实际读回 |
| --- | --- |
| 原26P3路径 | 26项bytes/SHA/mode全同root29 baseline；不是P3功能或62/22验证 |
| 三master整文件 | plan.md116770B、tasks.md225011B、t17-plan.md111319B，完整等baseline及开工副本，暂无U2后缀 |
| 三master原P3块 | 均2304B/14LF、SHA d6d2ae77cb0e8dadcee47df146d712a82dbfa4a278a2de9cec3a3a5564610655，真实offset72049/180290/66598且唯一 |
| 112旧marker | 逐bytes/SHA/mode同baseline且读取期间不变；除指定树外不扩大为全部旧payload重验 |
| root19 | 精确1197文件/110目录、文件bytes/SHA/mode和目录mode全同，根marker仍无；完整anchor315952B/SHA57aaedd2a7b4dc81ecea4f1b34dbcaa39c024c171f706b2c6bc6be04c2ed1c7e同root25封存项，root25 marker自身同baseline |
| root19 baseline覆盖 | baseline仅1191已知子集，与完整1197封存锚一致，六条额外原项仍由完整锚保全 |
| root28 payload | 351普通文件/30目录精确set、bytes/SHA/mode同；marker83421B/SHA8341e603faa1117c002fd63f7424ac006c62f8802e049757f70806aaca66649a同baseline |
| U1 post payload | 28普通文件/1目录精确set、bytes/SHA/mode同；marker6717B/SHA3f8063d86d8a4d0bf104cbb2a92538c026fb0e3a05706d5132714eab88c12377同baseline |
| 原goal input | 61B/SHA20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1/mode0644 |
| 源/资产520→530 | 507原项未变，13旧UI修改+10新增UI=23，0缺删/非UI越界，309非UI全同 |

## 23个UI路径及最终身份

最初派工“22”是preservation-r1历史阶段数。最终新差异仅多出SeasonRecollection.test.tsx：baseline9493B/SHA8c63be4fb35e6235bb9bfcc1e9932adaef72dd53c9dbb86e5a1e4e60cc27885d→10857B/SHAfea4fc07643285bb17e0f312edbd1af7fc6f075d68250236803b446b0c046708，mode0644。Root已确认这是本轮授权的正常Q1→Q2历史标签回归，归U2；其8项结果沿Root自己的执行记录，本checker没有运行测试。原22的记录不重写，新确认见scope-confirmation.json，初计划保留plan.initial.md。

| 类型 | 路径 | bytes | SHA256 |
| --- | --- | ---: | --- |
| 修改 | src/ui/CinematicRoom.tsx | 15429 | 74f62b05dd966a7d9858b63dd392e4fe709f8010054da3dfbb331db6781e8102 |
| 修改 | src/ui/market-scene-progress.test.tsx | 16370 | 2d69942ce2d92717a46280be39cb252b49ece91a4647be1e0ea2a08457de57e2 |
| 修改 | src/ui/market-scene-progress.ts | 8521 | 0ef75331e83a3a7d5904a15390c781949ebc210824d0d6bb7457498308a9702e |
| 修改 | src/ui/OpeningMoment.focus-book.test.tsx | 8606 | b26a76d8ea885c6572e5f155ccf97b150a5041a952653c090a525fbd7b52bb4b |
| 修改 | src/ui/OpeningMoment.tsx | 43273 | 00a1054919d946f2eab1c746f4fa4ce240fddd2ab1917f62e4e4f35dd55c3b4a |
| 修改 | src/ui/OpeningObject.tsx | 6582 | 78529741c8e82d8f1ed8d988ec950a5f075eb0efe794fc9fe62c8f89519017e3 |
| 修改 | src/ui/player-thread.test.ts | 30404 | 0d93edba3d3038cb511276306f72d483046b26c26b2841a0ae56a111d70b748b |
| 修改 | src/ui/player-thread.ts | 43457 | 1afddf69a109dc800ca01e0c2ec0f0c3fb907ea90594174082c0db2dc508fd2a |
| 修改 | src/ui/RoomMoment.tsx | 19621 | 6a44fd54ae0f9e559688f9c9692d8cfd8dfd2f09ff6f6ca96be2003904abbb00 |
| 修改 | src/ui/season-thread.test.ts | 36204 | 5a9d3d56b7c6bb76f16c92d3dedd37fcf894fa09565fd5cc8405694d96285fae |
| 修改 | src/ui/season-thread.ts | 49560 | afd39e3e38eff0eb9fa02e71cc3d5437592775753e962c49e1efe5aa1b166811 |
| 修改 | src/ui/SeasonRecollection.test.tsx | 10857 | fea4fc07643285bb17e0f312edbd1af7fc6f075d68250236803b446b0c046708 |
| 修改 | src/ui/SeasonRecollection.tsx | 7560 | bbb5f6a6637b65bb5ab39bfed0bee30526b8546b82591ba6ab4dceaae7d40927 |
| 新增 | src/ui/day-continuity.css | 2309 | 2d7ccb773e17abdc28fff3cf6eaf35eb1363dc99374496c4d46b72eff4daee67 |
| 新增 | src/ui/day-continuity.integration.test.tsx | 8227 | 2aca07dcb719943f9b72d16a2efda871f6fc9e4f099a206d9457c03dbc5522bf |
| 新增 | src/ui/day-perspective.ts | 700 | 5f485a6df5e58f678fd09f868aff992cd553283eec4440f21fefdaecf6e9087d |
| 新增 | src/ui/DayContinuityPaper.test.tsx | 2621 | a08ad8c3c77976670cd4d8e6a28c9aaa096111bd1ea4be0a8f0047dc6e5deac6 |
| 新增 | src/ui/DayContinuityPaper.tsx | 4816 | b52b42f663bfac07a5fbb9966ade4d6234dfeabe8e1ce9c9822b73ed56276733 |
| 新增 | src/ui/DayThreadAction.tsx | 2408 | 649fec9bbd53579194ea5622a30d067f456395073130f8737ca0a4098c3f258c |
| 新增 | src/ui/today-scene.css | 3086 | 7fe968e3542fd135773d46197f832698127f6e966d9d51ff42c7798807335023 |
| 新增 | src/ui/today-thread.test.ts | 16478 | efe329c8f4c481b0e95c3934696fd8444d4a4778b29dd15be2659f611441c708 |
| 新增 | src/ui/today-thread.ts | 8202 | 8fdc693ac9e0b5c221424d50b1007daf8f553bf340ac23be84e2982625c94f33 |
| 新增 | src/ui/TodayScene.tsx | 9323 | 73ddf39cc45aa47bce07455757fa87bacf488a84205580f9f4b62671adc23a26 |

全530项当前身份另列source-final.json（含baseline HEAD b1d8959485d0862c6aefe594e2f3259b8a1215e9和本次asOf）；全量before/after差异及集合/mode证据见result.json/source-diff.json，终态见terminal-r2.json。

## GJ边界与停止

- 本次核同baseline的src/assets/public和列明根配置，以及独立P3/三master/旧marker/指定三树，不能说whole repo未改。AGENTS.md/docs36是Root本轮另授权文档，不在该530源/资产集合，不计P3或非UI越界；其最终文档身份由Root另收口。
- 112旧marker仅证明其身份；root19/root28/U1 post才分别做了完整payload及目录模式检查。没有用marker存在替代指定树的字节验证，也不宣称全部历史payload被重放。
- 三master现在整文件等开工baseline；后续追加U2后缀/提交/封存须Root另做身份记录，本次通过不预审批未来变化。
- Root通报的candidate6→7→retry7、独立物理旧6/新7、关3tabs和DEV5367的原生记录不由本哈希审查推出。官方原文/完整Create/浏览器功能、实际美术及真人理解/趣味仍按各自原证据分层，本次不新增其通过项。
- 本目录写毕即停止writer；原R1报告/测试红档/旧sealed/masters不覆写。本次是保全通过，不是U2、T17或整个goal完成。
