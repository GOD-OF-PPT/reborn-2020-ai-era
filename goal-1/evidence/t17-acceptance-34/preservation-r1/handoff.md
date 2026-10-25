# C-UX06开工只读保全实际交回

正式调用：rtk proxy node goal-1/evidence/t17-acceptance-34/preservation-r1/run-preservation-final.mjs。只运行一次正式verifier，实际exit0、signal null、wall 9331.309717ms；不是测试或性能测量。[原argv及终态](terminal.json)、[完整初末读回](readback.json)、[脚本机械适配](adaptation.json)与[唯一执行选择](execution-selection.json)分别留存。原未执行草稿有一处说明字串root33，final仅改为实际root34并保旧稿，没有覆盖记录或失败后重跑。

| 范围 | 实际核定 |
| --- | --- |
| P3原26路径 | 每份完整bytes/SHA256/mode与baseline相同；8个tracked的index模式/OID等HEAD，18原未跟踪仍未入index |
| root19 | 精确1197普通文件/110目录、无missing/extra/symlink/special；1197文件bytes/SHA/mode与110目录mode同root25 authority，root32 baseline的SHA与内嵌authority也同 |
| 旧marker | 除整个growing root34外，精确122普通marker+2符号marker；122份完整bytes/SHA/mode同开工；2份字面target/128B/文本SHA与当前baseline mode0755均同，不跟随悬空目标 |
| 最新root33全payload | 570普通文件/25目录，精确集合及所有bytes/SHA/mode、目录mode同原marker；只根marker自排除。marker本身132362B/SHA28eed5215d8ed854daf75edcad8dfb8d38a6de42ee7304388342706dc117453b同baseline |
| 最新post全payload | 33普通文件/2目录，精确集合及所有bytes/SHA/mode、目录mode同原marker；marker本身8126B/SHAa58d4b3f8d0efcd27cb4c529e68c0cc7de43247a2e6fdae5924e1e958039ebba同baseline |
| 原input | 61B/SHA20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1/mode0644同 |
| 三master | 工作树各=开工baseline+当前登记1151B own suffix（SHA33911f54e26f07b0ab7f96bd4c1508a70370ad82b32b4cab05941cb6f3ee3fcd）；原2304B/14LF/SHA d6d2ae77cb0e8dadcee47df146d712a82dbfa4a278a2de9cec3a3a5564610655插入各唯一1次，HEAD/index均0次，index完整bytes等HEAD。工作树不重写 |

baseline.lastSealed实际字段ordinaryFiles已按570/33取值，未误用旧files字段。HEAD实际0c7e3c7ca38135608dbbcb524331b78a7ebcd6d1/main。两轮完整范围身份均52edc848d357d2255f588a237b2f1b7838f90ee9cb9c2c4fccb9ff8f76e9f92c，9个control输入初末同、errors0。正式verifier15333B/SHA5b1c61d6ff5d094080c6c58de9034332d4afa046ba6e9f519fa7ee98ab54f97c；readback38038B/SHA c7bcec5c0af14fddd3e30148723ac5492443d9f7396a3096594e0b33eb0b2dfc。

本次完整payload重哈希范围只有root19、最新root33和post；其余122普通marker核的是精确marker集合及身份，不宣称全部122套payload又新验。2符号marker的mode有本轮baseline锚，不能外推fixture创建时刻。当前root34全部增量从旧marker inventory排除，不把根代理活累计日志当旧payload；没有写源/master/旧证据、封存、Git写、游戏命令、单测/编译/浏览器或外部操作。PUBLIC/远端末核由Root处理。此为实际限定保全，不是C-UX06、业务/真人/兼容或最终封存通过。
