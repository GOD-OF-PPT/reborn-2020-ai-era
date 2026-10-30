# B2执行合同：有界字典编码作为原物理格式的后备

这是B1已实际复现/重算/原型后的实现合同，尚未改产品。目标是从同正常304接原305并继续完整2025原董事路径；不以305能保存或压缩率替代正常board/24季度/真人/整体U6验收。

## 已确认事实与取舍

原逻辑54571088B/1234737节点，原完整v2 level3为10767098B，超过10485760B；原packSave第47行准确触发。level9完整9947374B暂时可容，但仅余538386B，且无未来路径证明。全局JSON字典原型载荷5267400B；更紧凑的独立typed token原型为19216606B中间流、3456678B zlib、4608904B base64载荷，逐字还原完整逻辑和1234737节点，Node原生inflate全字节同。后两数仅payload，尚不是完整生产wire，不用它们冒成已保存大小/安全产品/2025容量证明。

选择保原zlib level3与现有v1/v2规范字节，原格式完整物理包容不下时，才使用显式新物理saveVersion3/packing='zlib-dictionary-v1'。不把level9的小余量当完整长线解决方案，也不改原10MiB/256MiB/5M预算；无新依赖。全部世界规则/状态schema13/参数/seed/RNG/钱/AP/日期和逐笔历史保持。语义原信封仍saveVersion1，原checksum算法/排序/完整业务校验不变。

## 入口与原子链

RunCodec.#sealed产生原逻辑v1、校验与canonical文本→prepare/packSave挑选物理v1/v2/v3→Session.seal完成原预检后才形成candidate→IndexedDbRunStore.prepare/原transaction提交head+backup+receipts→实际commit完成后发布新view。原源码Session117在codec.seal失败时尚无candidate，不能把旧SAVE_TOO_LARGE拒绝说成已有可retry候选。真正head.put后abort时已有candidate；原retry不得再次evaluate/抽取结果，物理旧head/backup保持到同candidate真正commit。

readEnvelope先保持普通300k节点的外层JSON检查、10MiB完整wire和版本/内容头兼容；仅已支持物理2/3进入各自有界解包，逻辑内容仍须saveVersion1。解包完整长度/hash/metadata后沿现有#readLogicalEnvelope和validateRun全部规则/交叉引用/ledger/clock检查。未知物理版本、错误packing、嵌套物理包、旧状态schema/规则不兼容均明确拒绝并保原。IndexedDb现有SaveDocument union与codec入口已适用，不为新格式改事务或用直接写DB旁路。

## 物理v3字段

v3保同runId/revision/checksum/schemaVersion/rulesVersion/contentVersion/contentHash/rngAlgorithmVersion；额外只允许saveVersion3、packing常量、logicalBytes、packedBytes、payloadHash、payload。logicalBytes是原canonical v1 UTF8总长度；packedBytes是解zlib后typed-token字节长度；两者分别1..原256MiB。payloadHash是完整原逻辑文本hash，payload是规范base64的单个zlib流。外层strict schema拒绝未知键，整个canonical wire（包含全部头和base64）仍≤10MiB，不能只检查payload。已支持v2头与packing='zlib-base64-v1'原样保持。

## typed-token格式与解码预算

采用B1 RJS1原型的明确结构，生产前固定magic/version并写字节级独立reference：magic4B；规范varuint词典项数；逐项“规范varuint长度+UTF8 JSON字符串字面量”；根值token。标签0 null、1 false、2 true、3 数字字面量、4 字符串词典引用、5 数组、6 对象。数组存元素数后逐值；对象存成员数后逐(key引用,值)，原UTF16字符串顺序，拒绝重复或逆序key。数字必须finite且JSON.stringify(JSON.parse(token))===原token；字符串literal亦须typeof string且JSON.stringify(parsed)===原literal，以保引号、反斜线、空字符、Unicode和孤立surrogate。字符串内容中像JSON/ID/对象标签的文字仍只是一段原文，不展开或全局替换。

varuint最多5字节，最短形式，拒绝溢出/多余零/截断/负与超安全整数；词典引用必须在现有表内。词典项唯一、总literal字节不超过logicalBytes，项数上界不得依输入任意分配，按≤min(2*原5M节点,剩余packedBytes的最少编码容量)严格核；这只约束中间表，不扩大原logical node预算。构造词典与token流使用有界Uint8Array/chunk builder，不沿用原型number[]一次性巨数组。大文本字节长度、字典token长度只计算一次，不在每token重新扫描全文。

zlib每16KiB输出累计≤declared packedBytes且≤原256MiB；必须正常end、err0、完整消费、不接尾巴或第二流，最终大小等packedBytes。token解码深度≤原32、每个原数组/对象成员≤原100000、逐原值累计≤原5M；在分配和递归前核，不信声明计数。直接构造原canonical JSON文本并逐段累加UTF8长度，输出超过declared logicalBytes或原256MiB立即拒绝，最终必须恰好等长；不能先创建巨大对象再检查。key拒绝__proto__/constructor/prototype，不经普通对象赋值制造原型写入。所有token和源二进制须完整消费，原逻辑hash再核，禁止静默修复、截断或默认空行。下一步JSON.parse仍进现有完整逻辑验证，不因typed-token有效而信游戏状态。

## 格式选择与旧档

小v1分支原条件与原字节保持。原v2 level3完整可存时继续原pako3.0.3选项/排序/bytes；不把既有本项目规范v2重新生成更小新格式。只在已确认逻辑/节点合法、原v2完整wire超10MiB时后备v3；不捕获任意validation/版本/内容错误来尝试别的格式。v3编码须对应原sealed envelope与canonical logicalText，解码应逐字恢复原内容；非canonical人工文本不能被字典化时悄然丢空白后仍沿旧hash。该API的调用前提与拒绝方式先测明；现有v2对独立Node producer/尾随空白原测试保持。

原304自身仍原项目v2，import/export和物理backup必须逐字同。5份旧小v1/已有v2规范原档亦逐字核；外部独立producer的物理原文件/原backup保持，state的codec canonical export与任意外部压缩字节原本不保证一致，不能扩大既有字节保真声明。新的完整305原proposal按完整canonical GameRun等值核，实际保存后才成为后续输入；原unsaved proposal不可直接“导入当已完成”。

## 拟改范围与红测

优先src/persistence/save-packing.ts、codec.ts、新save-dictionary.ts与必要无环save-limits.ts（原数值常量移出并从原入口重导出，避免公共API变化），以及必要真实packing/encoding测试。IndexedDb/Session先用原接口，不改核心规则/P3/原资产/声音/新依赖。原codec.test未来saveVersion3在支持后应成“已知格式但缺头”拒绝，另保真正未来4/999拒绝；只改受新协议直接影响的原断言，旧红保。

先固定一次正确packing seam：原完整305已validate、原packSave失败；将足量原字符串重复模式缩成快速红测，仍必须真实原逻辑UTF8体积在预算内、普通zlib不进10MiB（不能只mock codec.export/改限额），并保实际305原循环。新增字节reference、Unicode/孤立surrogate/键和值碰撞、重复/逆序key、危险key、未知tag/packing/version、截断/非最短varuint/坏引用/非法UTF8/数字、扩张/深度/节点/集合/词典预算、元数据/hash/单流完整消费的真实攻击输入。不是implementation同写法镜像断言；reference decoder独立并与原逻辑全字节比较。

实际305大样本可用单独作者检查工具，不强塞进5秒unit test或提高配置/worker/隔离/超时。B1原packSave连续两次红保；修后同样本及原304重进/导出、全部相关原测试、type/build和指定完整当前检查按真实固定源分层。无新兼容开发/测试。

## B3完整链与回滚

用原完整304、同normal-capital-v2:305及原真实Controller/Session/fakeIDB提交；实际head.put成功再abort，核UI仍304/无新钱日期AP、物理head/backup原字节、真实readonly、candidate恰是同305；retry真正提交、原commandId/receipt/random/history、物理305/backup304、冷读和重复命令均核。禁止缓存换假kernel声称完整链；B1原evaluate重算耗658339ms仅是实证运行，不称性能通过。

固定新构建独立Chrome通过原UI只导入304一次，原Clock/PublicWait按原屏障实际到305；不得承诺一次点击一定305，若中途保存必须逐实际revision原文核。真实readonly/cold/原文及完整proposal结果保持，故障注入若没做不冒Native。用户主5415原129只在最终验证后按需更新，保原已保存全部字节与所有用户origins，不更浏览器权限、不做兼容专项。

回滚保旧源码和全部已保存v1/v2/v3原档/备份；旧版明确拒绝v3并保原，不自动降级或删除。源变更只选择性本地提交，U6/normal board/24季度/最终整体与真人责任保。B2完成才进入B3，三项后C-B3综合debug；304后的真实资本策略随后另登记同seed续，不换参数/钱/保护余额或虚构董事资格。

## B1最后单变量复核

UTF16全局词典排序的实际payload5312628B，比首次出现4608904B更大；两个均完整还原。生产编码确定使用原canonical对象遍历时的首次出现顺序，Decoder检查词典唯一性与引用界限，不要求词典按字母排序；对象key仍原UTF16 canonical有序。具体B2攻击测试/内存结构/完整wire与真实保存仍未运行，不能用此原型代替。
