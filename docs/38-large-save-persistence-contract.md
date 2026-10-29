# 完整经营历史与有界存档封装

2026-10-30。承接技术08/调用22/当前schema13、rules-t16-journey-v1，不改游戏状态schema/经济/AP/日期/RNG/权限。正常原53续跑至76后，原合法AdvanceTime提案77有三期20客户共1680个不同计量、约13MB，原状态验证通过但明文10MiB检查拒绝；不是磁盘空间或额外计量重复。

## 逻辑与物理数据

`RunCodec.prepare(run)`返回`{envelope,storage,text}`。envelope是原v1逻辑信封与完整state/原语义checksum；storage和text是实际可导入的数据。seal给Session预检/逻辑调用者，外部文件应使用export/prepare.text。IndexedDB保持原stores、generation、receipt/log、事务和Session权限，存storage；读后验证得到逻辑state，同时保物理row用于原样backup/exportStored，不解包重写旧备份。

原可导入小v1（10MiB内、完整信封最多300000节点）仍原字节。大历史使用saveVersion2物理封装：原VersionSet/runId/revision/checksum、packing=zlib-base64-v1、logicalBytes、payloadHash与payload。payload为原完整v1规范信封UTF8的zlib/base64，payloadHash为原逻辑文本SHA256；外层元数据须与内层全部一致。不是删日志、重算结局或把客户保护款变本金。正常registry13仍明确拒绝保存状态schema1—12，不自动迁移；未知物理版本仍拒绝保留。

## 有界校验

外部文本与物理封装仍最多10MiB，JSON解析前检查UTF8量。解包最大256MiB，逻辑保存数据最多5000000节点；原普通JSON/命令默认300000节点不变，深度32/每容器100000/非法原型与访问器/符号/稀疏数组/非有限数检查保。逻辑预算根据原96行动内的多期经营完整历史单独设置，仍有限；不承诺无限下单或游戏性能/平衡已通过。

pako3.0.3精确锁定，16KiB流式输出逐块核实际大小，不按声明预分配大缓冲。严格base64、zlib完整消费与校验、UTF8 fatal、声明长度、完整逻辑hash、元数据与内层v1校验和/规则版本、严格状态及所有原业务/账务/随机/命令/因果引用依次检查。只允许内层v1，不递归解包。超限或损坏不写目标档，不放宽原测试时限。

Session继续原提交前校验与原子完成后发布。保存失败/冲突保原场景和同候选，原retry只保存同一提案；新封装不增加权限、免费点、现金或新Core命令。事务内全部同步验证保持活动状态，压缩预备在启动写事务前完成。旧小档、物理备份、导入幂等/冲突、头写后abort/原retry、只读/重进和实际正常失败命令必须分别核。

原失败与修复证据见goal-1/evidence/t17-acceptance-40/save-limit-repro-r288及large-save-repair-r290。作者Node/原生Chrome/真人不同；全部页面兼容开发测试仍0，不能把本修复当六年整体、正常董事资格或性能验收。旧软件不支持v2时应明确拒绝并保原始物理档，不能删改或静默改基。
