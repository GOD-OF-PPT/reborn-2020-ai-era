# U4-A只读保全实核交回

正式命令为 rtk proxy node goal-1/evidence/t17-acceptance-33/preservation-r1/run-preservation.mjs；内部只读执行 verify-preservation-final.mjs。实际exit 0，wall 8571.648275000001ms，errors 0。输入、脚本、HEAD/index、两轮身份与所有差异数组详见[readback.json](readback.json)、[terminal.json](terminal.json)及[command.json](command.json)。未执行草稿verify-preservation.mjs保留，不作为本轮运行源。

| 范围 | 实际严格结果 |
| --- | --- |
| 原P3 26路径 | 每份bytes/SHA256/mode与开工baseline同；8个原tracked索引条目等HEAD，其余18路径未入index |
| root19 | 精确1197普通文件+110目录；无缺失、额外或symlink/special；全部文件bytes/SHA/mode及110目录mode同root25权威，且权威与baseline32内嵌清单一致 |
| 旧marker | 除当前root33全增量外精确120普通marker+2符号marker；120份bytes/SHA/mode同开工，2份字面target/128B/目标文本SHA同开工，不读取悬空目标 |
| root32 | marker本身119351B/SHA f9a88a71d200803a1ea06a46e334ee2532a38fee656ae602c33f3cddca4449e2同开工；仅根marker自排除，payload精确520文件/27目录及全部bytes/SHA/mode同原marker |
| root32 post | marker本身10284B/SHA a4587bfa2c1ce9ad5c9997a8e1bc207e7911f60bbd6b22d02ea9a7bdcbd2b23f同开工；payload精确42文件/3目录及全部bytes/SHA/mode同原marker |
| 原input | 61B/SHA20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1/mode0644同原基线 |
| 三master | 各自原2304B/14LF/SHA d6d2ae77cb0e8dadcee47df146d712a82dbfa4a278a2de9cec3a3a5564610655插入恰好1次；原段在HEAD和index均0次，index逐字等HEAD；工作树=各原baseline+登记1694B自有suffix，suffix SHA545e24bf30fad2da14d804958f919dd0fd956d8b3b14b470b24ce0bbc537541c |

HEAD实际f9c3798b86361e961c62026f18f61bb3a6095e34，branch main。两轮全范围身份SHA均ad55d889ef2ef8bcee554b487bcdd94784dacb8febd44ea67e5f0d2065458e2a；所有control输入初末同。正式脚本15074B/SHA d293e1195375903e18c06901bc41a7ff534b6691fda6cad7ac87d8810529ec9a；readback37473B/SHA ac63d2e8f3437a1cb5e7bd9ed391703d877bd3f9ade5cbbac184e256306300bb。

此结论只覆盖本次保全。120个旧marker整体核的是marker身份与精确集合；本次额外重新逐份核全payload的旧根仅root19、root32和其post，不冒称全部120套payload均新重验。2个symlink历史mode不在baseline中，只记录当前0755并核本轮初末同，不冒称从原封存时起mode已有证明。PUBLIC/远端另由Root核；没有push、stage/commit、hash-object写、封存、游戏/浏览器命令、业务/兼容测试或产品源/master改写。root33仍有其他writer，不代表最终封存通过。
