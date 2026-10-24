# Root30收口准备交回

本目录仅准备，不已执行封存、拒写、暂存或提交。最终可用候选是 `closeout-final-r2.candidate.mjs`；初稿 `closeout.candidate.mjs` 保留身份但不要调用。只读复用root25纯I/O/blob函数；未调用硬编码root29 mutator。Root仍在写原生证据，当前盘点不是最终冻结。

当前547绑定源相对开工530：新增17＋修改21＝38路径，全部在src/ui；0删除、0资产/非UI/配置差异，509开工条目逐bytes/SHA/mode同。白名单逐项见u3-ui-paths.txt/source-delta.json。26P3当前bytes/SHA/mode同开工；root19为权威1197普通/110目录完整同；114旧普通marker字节/模式同，完整旧payload本轮只核root29与U2post两套（521/29与32/1），不外推全部旧payload。原input仍61B/SHA20c73f…。

三master各仍是本轮baseline原字节＋唯一2090B own段；baseline去掉原2304B/14LF插入精确等开工HEAD64b1624。不能直接git add这三文件。候选feature不纳入master；record必须用feature未改的开工HEAD主文件＋当前baseline之后全部本U3后缀，验证2090B开工段只有一次，另须确有其后的最终完成增量，再hash-object/update-index写选择性blob；工作树不重写，因此P3留树。record ordinary和feature都用NUL清单；逐blob字节/SHA/Gitmode、stage0、精确路径集合均核，不以commit对象存在冒充master或工作树一致。

Root最终实际可用顺序：先完成Native/停止exports→完整Create审核及实际结果→最终文档/validation和本目录所有writer停止；此时按最终生产manifest运行候选prepare（新独立post）→seal-root→实际13browser＋2CLI拒写→stage-feature/commit-feature逐blob核→只追加本片最终完成记录（master及若需要AGENTS/36状态）→准备好post摘要等所有文件→prepare-record→停止post写入→seal-post→stage-record→Root明确git commit→verify-record并在封存外保存真实回读。不得因候选语法通过提前执行；根当前未发收口信号。

命令模式见execution-order.txt。final source manifest是Root最终构建记录的source-after或source-before（files完整547），不要拿本准备时点身份替换最终构建。prepare完成后若源码再变，旧pre-feature-binding不可覆盖，保原记录、另新同级post/候选处理；若新增UI路径或非UI差异则候选拒绝，不静默扩大白名单。

实际13browser口径：4个标准wrapper显式计数stub＋9个已绑定native入口；拒写前不得委派，非13次实际UI操作。必须使用封存前已绑定的Root当前真实native对象，绑定到root30或其子目录，不能在seal后重新bind（factory先guard即拒绝），不能在纯Node伪称native。4wrapper由protectBrowserEvidence包装，9native为journal/click/closeDialog/readRaw/fillImport/key/shot/exportSaved/radio。候选browserProbes(native,context)只在Root实际浏览器上下文调用，结果写独立post。两CLI为原collect_course_evidence与verify_normal_browser_exports指向新root30拒写子目标，原env输入root30；预期IMMUTABLE_EVIDENCE_PARENT_USE_NEW_SIBLING、exit1、目标仍不存在，必须实际读终态，不把browser错误名套CLI。

原console/统一diff空白：root29原57诊断/49路径不能抄成root30结果。原25owned UI/正式文档staged check0；全feature原cached check2的51行/48原console路径＋6行/1原unified-diff路径保原字节。full-file no-index exit1且stdout/stderr空只表明有diff，不冒称0。新root30按实际每条诊断的路径/原始输出来源分类，不能凭.txt/.patch或旧前像后缀自动豁免，更不能trim旧日志求绿。相关真实旧锚见guard-and-whitespace-reuse.json。

[杠精审查] 本准备范围完整：可执行候选覆盖final源绑定、P3/root19/旧seal与input、master选择性blob、NUL精确集合、独立post及封存拒写；已知所有执行/Native/最终docs依赖明确保留。只node --check和静态复核，不新增玩法/兼容/目标，不称整个T17/goal、原PNG或真人通过。完成准备后停止writer，等待Root的docsfinal和收口信号。

候选自审补正：final-r1的prepare尝试guard(evidenceRoot)会因空relative被拒，未执行；final-r2仅改为guard未封存root30以验证共同父链后创建同级post，再guard(post)。原初稿/r1/早先说明均保留；唯一执行入口为final-r2，旧版本不执行。
