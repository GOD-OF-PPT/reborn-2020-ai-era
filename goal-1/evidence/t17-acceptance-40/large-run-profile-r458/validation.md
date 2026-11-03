# U6真实长档分段诊断与原因索引优化：459限定交付

本任务针对正常资本长档慢等待，不改活47783/r440、不改用户Main/DB、不做兼容性工作。固定原416来源、正常origin、revision545、2024-03-07完整8,893,670B输入：`26dc73ef...cf655`；同revision journal原行SHA `efb39f...a78bf`。输入来源来自活r440已保存head与同revision命令记录，原head/log未写。

## 反馈环与复现
独立Node22 CLI分段计时复现。纯读取约30–40ms，JSON.parse约16–23ms；原codec.import baseline约69,011.52ms，codec.export约61,857.79ms，canonical whole run约2,589.74ms，总约135,487.37ms；原完整export wire逐字相等。CPU profile `codec545.cpuprofile` 11,765样本/10ms、约136.84s（采样有开销，非正式性能）。top inclusive：codec validateRun约102.96s，#references约78.04s；约51.5%采样自receipt causeId→commandId的全causes `some` 重扫。原4.3万cause/545command及4.2万ledger receipts、1.49万timeline receipts计数均实读。

## 修复与语义
在 `src/persistence/codec.ts` 的单次 `#references` validation 局部建立 `Map<causeId, Set<commandId>>`，逐 receipt/causeId 仍执行原 `requireRule`，保留同causeId任一command命中的原语义；不跨调用缓存、不删任何schema/账务/事件/随机/权限/原子保存校验。新增 `src/persistence/codec-cause-index.test.ts`，先让旧实现的访问增长断言真实失败，再修复后通过；涵盖完整RunCodec消费链、缺失/重复/借用cause、对象二次修改、重复claim和canonical save bytes。

## 修复后证据
新冻结459仅2 owned source path，完整来源978文件；类型通过、构建通过。cause-index及相称codec/core/application消费者共237项全部通过。固定同一8.9MB档两次复测均逐wire相等：候选1 import27,943.43ms/export38,752.56ms/总71,875.19ms；候选2 import22,204.78ms/export32,041.09ms/总58,206.68ms。候选2相对baseline总时长约0.4296、import约0.3218、export约0.5180；这只是本机固定档、采样/GC/环境有影响，不称正式性能门槛。候选CPU profile top已移除原`#references`主热点，剩余正常历史/relay validation/canonical/packing成本，不在本任务内凭猜测继续改。

候选1/2完整export均保原原文，revision/date/origin/钱/AP/RNG/receipt/history保持；无Controller/IDB/Native/Chrome/真人/Board正向层，未更新Main。全部兼容开发测试0。

## 保留边界
原baseline1的错误统计字段读取失败另存，不能冒成完整通过；首轮原profile和失败/红层保。活r440继续原完整2025/80万董事/实际签署治理，原source/seed/driver/策略/日期/预算不改。正式人类理解/趣味/美术、原PNG0of3、P3正式62/22、17+5深态、normal board Native、最终U6和后续组合均未关闭。

## 精确提交
feature7f1e20dc82b6cec4fc4e05549840e3dfec8f8806，父64b5e7e75b02e7297e5585672c32e88c99b793ad；58owned/delta、2源路径，index/commit blob/模式/字节/SHA全核同，index空未push。新增原因索引仅作用于一次codec validation；固定545完整wire保持逐字同。
