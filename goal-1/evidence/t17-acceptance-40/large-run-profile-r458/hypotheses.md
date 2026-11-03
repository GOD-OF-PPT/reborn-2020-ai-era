# 已复现之后的可证伪假设

baseline1固定545：JSON.parse16.33ms、原codec.import66275.58ms（CPU63835.34ms user/2659.23ms system）。计数日志误读不存在relay.metering在导入成功后抛错，原phase/error/输入和脚本保，不当全往返通过。原脚本已另存measure-codec-initial.ts，修只统计字段后再跑。

1. 财务/业务交叉验证反复全历史扫描或重放。如果为主因，CPU采样将集中在assertLedger/route validate/数组查找等，codec-import/export验证阶段显著超过JSON和编码。若采样不在这些处则降级。
2. 事件队列逐项重建/排序产生平方成本。如果为主因，queueEvent/compareTimePoints在codec.#references占主要CPU；只测queue重建边界应有相应耗时。若pending数少且热点不在队列则排除。
3. 整份canonical/hash/packing重复编解码。如果为主因，JSON/canonical/hash/compress栈占主要CPU；验证阶段相对小。纯JSON16ms已否定把缓慢简单归于JSON.parse，但尚未否定哈希/packing。

独立采样只固定545、原416、Node22；10ms采样，不更改规则或live47783。第一轮原导入慢已复现，第二轮正常全往返与CPU结果之后再决定最小修复，不提前减少任何校验。
