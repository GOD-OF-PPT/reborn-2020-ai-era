# C2静态边界复核（不代替运行验收）

- 全局canonicalJson/copyJson/SHA、规则/随机/账本/日期/权限、schema/rules/content版本、原79文件496断言与原配置均保持C1字节；source-reuse记录唯一旧源变化为Codec实现。
- 公开readEnvelope(unknown)始终走旧保守编码；内部信任只来自import自身的原生JSON.parse，不是JSON字段或公开可传参数。assertJsonInput及原UTF8/depth/node/prototype/有限数值检查先执行，版本/严格schema/SHA-256校验和/完整validateRun/全部关系约束照常。
- 原生编码只在所有对象键序已等于规范序时使用，数值索引键等不满足就回原canonicalJson；数组来自JSON.parse，不能携带函数、getter、定制map/toJSON或Proxy。未修改通用任意JS值的编码接口。
- Root checksum只在前缀逐字匹配且schema解析前后所有JSON数据相同才剥离；其他情况计算原parsed body哈希。导出只复用原canonical body，checksum不在最前时回原完整编码。不是跳过SHA-256校验和、引用、版本或金额验证。
- 不缓存前史、命令、业务决策或验证过的GameRun；没有新增随机、注资、字段归一化、旧档迁移、外部API/依赖/字体/遥测或在线模型。
- Codec没有仓库内子类/重写readEnvelope的接线；现有public接口形状保留。新私有方法保持所有内部校验与拒绝顺序，公开边界四新增守卫在旧码通过，改后与原codec/hash共16项通过；UTF8规范化扩张、错误SHA-256校验和/不匹配header、非规范顺序与转义/孤立代理码元已实际覆盖。
- 当前引擎重放C1十五实际UI导出/六正常输入/七字节对/293不同完整命令均逐字相同。C1照片仍属C1，不能称作C2新原生；C2实际保存链和完整500仍待运行。

静态复核未发现规则/保存语义降级；原时限复验、完整累计与C2新原生还未形成完成证据，D03/C-D03未结项。
