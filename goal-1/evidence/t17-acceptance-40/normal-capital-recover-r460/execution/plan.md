# U6正常资本路径：从最后已保存605恢复，不重跑历史

当前唯一U6第10，goal继续active。原r440句柄已不存在且无terminal；最后权威保存是 execution-r1/head.current.json revision605/date2024-07-31，已与commands.jsonl同revision SHA/bytes核对。当前任务只从该保存点建立新独立producer，保全部已存历史、原候选、原身份和原策略；不从417或372重跑，不改活r440源/driver/selector/calendar/seed/规则/预算/限额，不改Main/DB/Native，不做兼容性开发测试。

## 需求与风险
需要继续正常2025路径，目标仍是合法80万董事条款、实际签署与独立治理结果；但新谈判可能按原随机实际拒绝，必须保留真实结果，不重抽、不注资、不强签。新运行先独立审计605来源，然后沿原已登记策略从2024-07-31到2025，所有命令原preview→evaluate→codec canonical roundtrip→原子head/journal。每步最多原公开时间窗口；失败/候选停留原状态，不把作者工具结果冒Controller/IDB/Native或人类体验。

## 执行设计
复制原r440 run.ts到本root新脚本，仅改入口为固定605 head、输出root、启动身份检查和跳过已完成417→605历史循环；后续closeRelay/qualify/maybeBoard/signAndGovern函数逐字保留。把605作为新的原始输入，匹配同605 journal行；新producer不得复用原旧execution-r1输出文件名。原source416完整冻结只读，Node22。

## 验证
里程碑一：605完整codec导入/身份/同journal/公开relay和pending状态，旧历史逐字保。里程碑二：独立恢复沿原命令；每条新保存wire canonical roundtrip、revision/date/钱/AP/RNG/receipt/原因和紧邻backup保，最多8逻辑步一个物理检查点，长档慢如实记录。里程碑三：若达到board签署/治理，单独保存正常原文件并报告；若实际拒绝/资金/资格/执行终止，报告真实阶段和缺口，不把停止当完整目标。类型/构建/作者原完整策略检查运行，P3/旧seal/masters保护。

## 回滚与边界
只删除本新root/独立脚本即可回滚，不触碰r440、活head/log（即使句柄消失也保全）、所有旧DB/保存/完整seal。新脚本任何命令只写本root的head/journal，不写用户Main/IDB。所有兼容开发测试0，正式性能/Native/真人/PNG缺口继续不关闭。[杠精审查]通过：恢复精确已保存点而非重跑历史，真实拒绝不伪造成功。
