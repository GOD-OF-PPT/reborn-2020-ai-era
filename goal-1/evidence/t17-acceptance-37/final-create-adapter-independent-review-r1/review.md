# 最终adapter四helper与R6import：限定静态准入通过

实际源：IO21347B/104580d1…、builder12615/d0e35a38…、freeze12249/dd491a00…、runner6405/2aefc0c4…、R6copy59795/36bf92d1…；完整SHA/前后文件身份在static-source-comparison.json。逐actual source与adapter-source-diff对照，原before/after各身份同。R6copy只一行import改成本根./audit-io.mjs，逆替全文等已审59825B/73116fbd…原R6，没有改金融/Audit/profile事实逻辑。

1. Node外部身份：requireIdentity仅对确在repo外的路径进入新分支；要求row.path字面及path.resolve都精确等fs.realpathSync(process.execPath)，逐祖先和文件lstat拒symlink、只regular，再核原path/bytes/SHA/mode。没有开放任意repo外文件或相对../逃逸，且Node22.12执行版本由builder现有门槛要求。repo内仍原read/regular/路径约束，原source/dependency集合比对未弱化。bindings改为requireIdentity反而对期望identity即时核，不只读取当下身份；runtime当前整依赖与历史901 proof窗仍分开。

2. 原cut shape：requireProducerStop先保原R1explicitProducerStop/旧last producer-stop与physical reader-closed；该分支拒额外captureStopProof。只有明确R8/R9/R10三个原目录可用新top schema：stopped_writer、实际cut.directory、captures数组/newGameplayCommands安全非负、proof literalType producer_stop、固定native-progress路径/正line，requireIdentity原journal并核该line是最后非空行/lineSHA/event.type/count与cut同且journal在完整cut tree文件身份中。没有伪造cut.last或把英文破折号与下划线模糊匹配。

3. 调用链：builder先requireProducerTree再requireProducerStop，原manifest/full rows/来源角色/当前native贡献继续核；captureStopProof显式保到registry.producerCuts。freeze重新全tree/stop proof后才复制原snapshots与合同；runner预检与终态均全tree/stop，原bindings源码/完整runtime/P326/refs/input/snapshot差异各层保。新末journalproof已在cut完整tree和references中，不因没另列一份裸字符串失去身份保护。

4. 授权与一次运行：builder新增spec.final===true，仍Root authority/operation/version/fresh输出路径严格；当前spec.CANDIDATE的finalfalse/authnull和registry DRAFT不会直接成为执行输入。freeze仍只认state frozen/frozenBy Root/U4-B/同output和当前sources/deps全identity。runner仍需exact RootGO+frozen-contract完整identity+独审fileidentity，wx/fresh marker，一次原verifier绿后才一次readback；任何error/signal/非0保终态，没有自动重试Create。green engine而JSON红只可另fresh补读回的原协议保。

5. 不变边界：finalProducerSet全14/所有fresh各完整capture、原origin/source/旁sourceRole、旧15/25 exact scope与35/31结果继承、derived101历史proof任务窗不倒拉当前tasks、当前mutable-final refs持到终态、完整payload trie/官方verifier、R6审计实际量逆链与refund2424/AR1212/供应asset808/cost404等没有改。读回结果仍精确contract/coverage scope/keyset/count/mode/producers/reused identities验证，不因adapter跳过某fresh。

本限定切面未发现确定新增P1/P2，允许Root采用本同组进行准确metadata finalspec/registry/freeze准备。data本身（97roles/43fresh/14cut/完整current runtime与127官方闭包）由state/Root另独审；本文不把DRAFT翻状态视为真实builder输出，不声称最终frozen-contract已存在或数据已准入。Root最终STOP/准确source/input/引用及另签RootGO仍必须完成，当前无任何执行GO。

实际操作仅fs读取/hash/text/JSON比较、guard新本目录；没有候选import/语法/builder/freeze/engine/readback/产品/工程/Browser/codec/Git执行，没有改产品/master/P326/旧候选或原Native树。只写本独立审根。图审/真人/PNG/compat与U4-B任务完成不由此代替。
