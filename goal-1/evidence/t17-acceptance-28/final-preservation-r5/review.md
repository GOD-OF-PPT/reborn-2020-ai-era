# U1 当前最终保全

纯只读检查实际exit0（final-terminal-r2.json，2103ms）。未修改src、scripts、masters、P3、旧证据或Git/index；没有运行游戏、浏览器或兼容测试。Git仅执行rev-parse HEAD与三次cat-file blob。

| 对象 | 实核结果 |
| --- | --- |
| baseline.priorFiles原P3源码/script/配置 | 26项完整bytes/SHA256/mode相同 |
| root19 | 1197普通文件、110目录与110目录模式；精确路径集合、逐文件bytes/SHA/mode全同 |
| 旧seal标记 | 110项原标记bytes/SHA/mode全同；不冒称所有旧payload重审 |
| root27 | marker自排除后的850文件/87目录和模式精确清单全同；marker另由旧110项保护 |
| S4-R1 post | marker自排除后的38文件/1目录和模式精确清单全同；marker另由旧110项保护 |
| 原goal input | 61B / 20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1 / 0644全同 |
| 三master | 当前全部字节等root28对应.baseline，mode均0644；不是只核前缀 |

root19目录锚点沿封存R1 helper实际指向的root25/closeout-preparation-r1/root19-preparation-tree.json（315952B / 57aaedd2a7b4dc81ecea4f1b34dbcaa39c024c171f706b2c6bc6be04c2ed1c7e），先验证其bytes/hash/mode符合root25原seal行，再比root28.root19全清单与实际树。原root19根无seal的事实仍保留，没有增删文件或用相同数量代替精确比对。

当前HEAD仍64f97ac3df5e6c6d101c9dc1e5b046d569361897。三master与其HEAD blob的全部差异均只有唯一原P3插入：2304B、14LF、SHA d6d2ae77cb0e8dadcee47df146d712a82dbfa4a278a2de9cec3a3a5564610655，offset分别plan72049、tasks180290、t17-plan66598；移去该唯一片段逐字恢复HEAD blob。当前没有U1 master追加。

完整结果见final-result-r2.json；初次同样通过的current-result.json/current-terminal.json保留。R2仅把未来append检查收紧为在整份current中拒绝重复P3插入及显式核基线路径唯一，当前精确结果没有改变。

这里证明当前保全，不证明U1体验/规则全验、真人、P3正式与例行完成，也不保证任何尚未发生的append/commit。
