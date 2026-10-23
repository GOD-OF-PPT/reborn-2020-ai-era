# S3-V1保全读回

已核范围通过，原终态exit0/1056ms，0错误；完整逐项输入/实现/读回见inputs-before.json、check.mjs、result.json、terminal.json。只有本新目录发生写入。

| 范围 | 实际读回 | 来源与边界 |
| --- | --- | --- |
| goal-1/input.md | 61B，SHA20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1一致 | root23 master-baseline原条目；当前mode420仅实读 |
| 指定P3源码/config 26 | 26全为原路径普通文件，bytes/SHA/已记录mode全部匹配 | 18取root23开工415清单；8脚本取root22封存保全报告当时current身份，未使用HEAD替代工作树 |
| root22封存 | 364普通文件集合零增删，bytes/SHA/mode全同；marker82539B/SHAb511dbd378951e43118122616c9d783f83d1f4b0fc3524a38477ee56d3dbec9c | marker自排除；其bytes/SHA由S2post原feature/staged readback独立锚定；marker本轮前后也同 |
| S2post封存 | 18普通文件集合零增删，bytes/SHA/mode全同；marker4356B/SHAe0c8d3fa7b3b540862995cd9ff115bbfaf157a17d65557a01694ee6bfd9bd75c | marker自排除；当前mode420，本轮前后同；未找到自身历史独立anchor，不能声称该marker从原封存时起未变 |
| 正常前史139绑定 | runtime124＋protocol2＋reference9＋原input4全部bytes/SHA同，runtime当前124集合零增删 | 只读normal-prefix-r1/source-before原路径；其mode未记录，不声称历史mode已证；不重新执行Create或引擎测试 |
| master三文件 | 分别剥643B当前S3-V1尾后，原长度/SHA全同master-baseline | 原P3和全部既有内容包含于原prefix，未改它们；不从HEAD重算14行/不检查暂存索引 |
| R7原425源 | 检查时未见差异 | 仅本次读回时点；R8仍可并发修改其UI，不据此断言未来零漂移或替R8构建冻结 |

限界：8脚本只能证明相对S2末次封存观察的字节保持，其更早pre-S2原hash当时就未记录；本轮没有补造。P3的历史tracked/untracked分类沿原报告，没有运行Git重新判定，也没有宣称P3/62/22测试通过。S2post marker缺历史独立锚已明确保留；root22 marker历史filesystem完整mode没有另行声称，原Git mode仅作旧记录附注。

本次不改src/master/旧sealed，不运行Git、Chrome/HTTP、单测/游戏/兼容或服务，不把源与证据保全当新引擎/整局/真人验收。根R7 DEV实际结果按根原证据另记，本检查不重复或替代它；R8最终源/构建/当前画面由其owner收口。
