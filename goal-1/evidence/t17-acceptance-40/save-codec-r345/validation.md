# B2有界字典后备编码：本轮实际结果

本轮仅执行U6的B2，实现正式codec并验证原305提案；B3实际Controller大档保存/Chrome和C-B3三项累计未执行。上一被中断的B2只读复核无进展，本轮已完成实现与实际验证。原344已封存，不追加。

## 实现与范围

6份owned：codec.ts、save-packing.ts、codec.test.ts；新增save-limits.ts、save-dictionary.ts、save-dictionary.test.ts。原四项数值常量移到无环limits并从原入口重导出，10MiB/256MiB/5M/普通300k不提高。原小v1与容得下的原level3 v2继续原字节，仅原v2完整物理包超限时用显式saveVersion3/packing zlib-dictionary-v1，逻辑v1/状态schema13/规则/seed/RNG/经济/日期/AP不变。现有IndexedDb/Session/原子candidate控制流没改。

RJS1 typed-token与首次出现词典保持原全文，编码用16KiB有界chunk与字典字节缓存；解码先核packedBytes/单zlib流，再按规范varuint、唯一词典/安全有序键/UTF8字面量/数字/深度32/集合100k/原值5M与实际UTF8输出核，完整消费/长度/hash/metadata后进入原完整领域验证。不能靠词典扩张、尾巴、嵌套物理包或未知版本绕过；fallback只针对量出的原v2物理大小，不吞校验异常。原v2独立producer和尾空白用例保持。只读/候选/原retry仍沿原Session资格，未新增业务或权限。

## 红→绿与独立原文

修改前，冻结342/938源以同正常304导入/导出原字节，再validate原305并真实RunCodec.export，准确SAVE_TOO_LARGE，原栈packSave47；43920ms，before-result.json保。

修改后，冻结346/941源同回归通过，原304的10088850B/SHA9fa6fda4b28cdbb7bfcf02a29cc660f6530f9a45d5a955ba0ecbce892daf0ee3逐字保持；新305完整v3物理4609457B/SHA c107fa8eacb43116fb582f59beb0d85f95be86f5c5507fbf9db3691157844e87，真实codec import的全部canonical GameRun逐字等原完整提案，再导出逐字同，122935ms。文件名encoded-proposal305明确它还没有经Store保存，不能作为正常进度/后续资本策略输入。

另用B1独立binary reader与Node原生zlib（未调用生产dictionary decoder）解当前305：原tokens19216606B、完整逻辑54571088B/1234737节点与原header/checksum/hash逐字同，完整消费，2043ms。旧5份真实v1原档与旧大v2真实77逐字保持，v2 2584441B解12983871B，10322ms；加本原304，不以外部任意压缩producer的字节保证扩大既有声明。

## 工程与原反例

346四整文件首轮63case为62通过/1失败；原反例保。该测试声称测“扩张”，却将词典literal本身设得比声明输出大，被原结构守卫先拒绝CORRUPT_SAVE。347仅修测试输入为合法小词典在多引用后真正膨胀，原产品代码未变。最终347/941行/6owned、其余940行与346逐字同。347的全部17份persistence与14份真实Application消费者共31整文件一次232/232通过，原5秒限时/隔离/2worker未改，49270ms。没有用mock export或伪造领域状态获得大小红绿；真实大样本采用独立Node正确seam，不塞进5秒unit或改测试限额。

346类型73055ms、构建2846ms通过；347只同测试literal修正，全部生产代码和其余940行同，复用该工程结果而不冒最终源又全跑一次。字节fixture含全部标量、32项数组次序、跨chunk、Unicode/孤立surrogate/引号/空字符/类似JSON正文；独立malformed字节覆盖varuint/坏引用/重复词/key/危险key/UTF8 BOM/无穷与非规范数、额外token、深度/节点/集合/输出膨胀及头兼容/完整zlib消费。自审发现BOM可能被默认TextDecoder吞掉的问题在首次冻结前已通过ignoreBOM保原字节并留实际恶意字节测试；不改旧v2行为来扩大本轮范围。它们是本地协议/数据检查，不是正式安全认证、性能或人类验收。

## 保全与仍待

本正常作者分支B2实际新保存0/新Core命令0/Native0；单元测试中独立小run/fakeIDB例子另列，不能冒原305实际已存。没有用户UI/导入/设置/主业务操作。主5415仍原342，本轮不将未做B3的新codec切给用户。B3必须沿原304+原命令和真实Session/head.put后abort/物理旧/候选retry/reader/备份/cold与独立Chrome原等待核，三项后C-B3再完整debug，然后同seed真实资本策略继续。旧原proposal只作预期，不导入当完成。

P326/132marker/2symlink/旧19与35/input61B/未接线model/master原前缀+2304B插入与28完整旧seals已核；混合masters/AGENTS/旧未知不stage。全部页面兼容开发测试0，不做尺寸/缩放/跨浏览器/原生离页/几何专项。无UI/图/声/依赖/核心规则/参数/RNG变化，无push/deploy/委派/外部消息/全局memory更新。当前U6原17/5深态/当前系统美术/closed生态终态与正常board正向Native/最终全审未完，所有原后续组合/T17余/PNG0of3/真人0/P3正式62与22 not_run/M01须明确恢复/T18最后/goal ACTIVE保。

[杠精审查] B2编码实现与已列数据/协议/旧档/工程检查通过；未把导出提案、fakeIDB小夹具或232绿当实际正常大档保存/Chrome/完整2025/真人/整个U6完成。准确本地选择性提交与post身份随后记录。
