# 存储与压缩依据（公开一手材料）

- 仓库docs/22-command-save-contract.md与docs/08-technical-plan.md：10MiB外部导入、完整信封与原子提交/旧档保留，旧历史条目不倒改。
- https://github.com/nodeca/pako ：官方实现与命名同步API。
- https://raw.githubusercontent.com/nodeca/pako/master/src/inflate.ts ：onData流式输出、chunkSize和ended/err，16KiB固定输出支持逐块预算。
- https://raw.githubusercontent.com/nodeca/pako/master/CHANGELOG.md ：3.0.3说明及3.x类型、命名导出/字节输出；本组锁定3.0.3，不自动追最新版。
- https://www.npmjs.com/package/pako ：精确版本/包来源。只取官方registry tarball，新增包与lock不改已有runtime版本。

研究是API设计依据，非本游戏保存或性能验收；实际以本组源码与回归/Native证据为准。没有使用任何竞品或ForgeTax。
