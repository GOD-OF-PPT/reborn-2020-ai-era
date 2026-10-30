# B2：正式有界字典后备编码

承接已封存344的完整plan/tasks/wire-contract，当前HEAD34f41993，仍唯一U6第10项。本轮只B2；上一中断仅只读无进展，原B1是有据progress。不修改344及旧STOP目录。

先用冻结342/938与原327完整正常304/305运行正确RunCodec回归，明确期望同合法305可导出并完整还原，原码应准确SAVE_TOO_LARGE；大样本真实反馈单独Node工具，保原5秒unit配置，不伪造领域状态或降低限额凑快速红测。小型单测另以独立规范字节reference验证新格式读/写及恶意流；真正305原码红→新码绿与旧304全原文单独核。

实现限src/persistence：新增save-limits（原数值移出重导出，无环）、save-dictionary（RJS1首次出现词典、规范varuint/typed tokens），改save-packing、codec识别v3及直接受影响测试。保持原小v1/能装下的原level3 v2逐字同，只有原v2完整包超10MiB才v3；保持256MiB/5M节点/普通300k/原对象32层100k成员、16KiB解流。完整v3头/packedBytes/logicalBytes/hash、唯一词典/引用/UTF8/数值/危险key/完整消费/原逻辑metadata与全部业务校验按344合同。生产chunk builder不用number[]，token解码输出先计真实UTF8/节点再分配/递归，不每token重复全文扫描。canonical source与payload保持一致，非canonical fallback不默改；旧v2尾空白独立producer保持。

之后冻结精确新源（基于342，只有明确owned persistence/测试替换，P3overlay0）；跑新的恶意字节/Unicode/边界与所有原persistence整文件、关联Application原保存/权限/候选/恢复检查，以及类型/构建。原305编码/完整RunCodec导入再导出+独立Node inflate/二进制reference逐字核，旧304与选定旧v1/v2规范原档逐字保持。原逻辑GameRun/规则/seed/参数/RNG/经济/日期/AP不变。这里不执行新Core或把encoded proposal当已保存存档。

B3真实Controller/Session/fakeIDB head.put后abort/原retry/reader/backup/cold、Chrome原304原等待及完整原文，三项后C-B3累计review另执行；原2025正常board/全部系统美术与后续责任保。主5415固定342不换新编码，本轮0用户UI/设置/主业务。兼容开发测试0，无新依赖/图/声/委派/外部消息/push/deploy/global memory。

28完整旧seals（27+344）、P326/132marker/2symlink/旧19&35/input61B/未接线model/master原前缀+2304B插入保。选择性本地提交owned实现/测试/本轮资料，严格blob/模式/精确路径集与post核，不stage混合master/AGENTS/P3；全部自有测试进程真实终态后STOP/fullseal。失败原记录保，不能把新包当正式保存或整个U6已验。

[杠精审查] 不使用错误领域fixture和调测试限额替代真实反例；B2代码有完整字节/攻击/旧档依据才关闭本内部任务，B3及整个goal保持未完。
