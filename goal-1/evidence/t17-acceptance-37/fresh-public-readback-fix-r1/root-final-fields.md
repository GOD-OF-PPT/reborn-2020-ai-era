Root最终配置：

1. 选本根fresh-public-readback-candidate-r5-final.mjs为publicReadback；替换freshSpec为本根fresh-facts-spec-r5.TEMPLATE.json在未来新同级填完的final:true版本，旧模板不覆盖。R8 cut/captureKeys/recordFacts/cases均保持null直到实际采集完；R5必拒当前模板。
2. publicReadbackWiring.canonicalSourceContract=<本根canonical-source-contract.json完整identity>，并将该文件和最终freshSpec都放Root spec.referenceFiles。既有builder/freeze原样保wiring扩展，无需改协议候选。
3. p.recordFacts每capture填Root-final identity/origin/source/run/rev/branchId/auditRole/captureRole/semanticRole/scopeInput。source.frame.scopeInput与实际原period一致；复用byte-identical原source成员的branchId保持同一实际原receipt branch标签，不能按producer名伪拆相同history，也不能合并不同末command。新经营pairs仍完整prefix，未来新raw hash只从真实保存取得。
4. 按R8-purpose-groups.TEMPLATE.json明确填真实keys与members；old115来源硬绑R7c1309且state115Apr9，old99来源硬绑2d938且state99Mar5。每组原source.branchId从该source的final registry取，成员同branch/原文；不同purpose禁止复用一个任意115 group。95/92/115真实处境表见two-p2-response；若要视觉working，则另实际读原89并填可选working89组。
5. per-producer expectedChecks仍cases.length+3，仅配置公式，不预报实际绿。所有原producer keys必须被声明case覆盖，别名0新；实际新经营count只由原prefix+1末command及producer-stop真实数核。图/AX/N8/N9引用只observationsOnly，仍由Root独立实际画面验。
6. 当前未做语法/模块import/工程/codec/JSON读回/正式Create，独审后并不自动GO；最后producer真实stop、全部spec/输入完整freeze、Root独审与另GO后现runner一次engine→readback。若engine已过而本读回红，保原只新根补readback。
