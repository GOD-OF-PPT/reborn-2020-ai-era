# 23｜内容执行、世界时钟与资格合同（T05）

2026-10-16；T05/E05，P005及P006/P019调度与资格子范围。schemaVersion=2，正常世界规则`rules-t05-world-v1`、内容`world-work-v1`；完整业务、历史分岔和可玩界面仍由后续任务实施。

## 正常入口与数据

正常游戏组合入口为`src/application/campaign.ts`的`createCampaignRun`、`createCampaignRegistry`与`createCampaignCodec`，三者使用相同的规则/内容上下文。原`createInitialRun`继续作为经济初始化底座及协议夹具入口，不能把world=null的底座当作完整世界新局。前台尚未接入新游戏入口，T09负责实际玩家流程。

`src/content/campaign.ts`是独立的运行时工作包，经过`loadContentPack`严格校验；不从planning装载。当前包含11条有限核验来源/历史锚点、19项能力、两背景初始技能、5条准备事件及2条模糊记忆。5条事件只产生练习案例、研究材料或提纲，不产生订单收入、专业交付资格、供应权限或股权。

技术背景保留基础编程，内容背景保留受众研究，两者都有手工剪辑/表格入口；初始资格不包含API、生成模型、供应审批或融资。模型发布时间、公开说明、实际访问资格和规则施行日分开判断。DeepSeek直接股权能力为counterfactual，仍需资格、尽调和对方融资同意；T05没有提供现实申购或自动批准。

## 白名单与绑定

条件支持all、any、not、flagEquals、dateInWindow、availableFundsGte、capacityGte、businessKindIs、hasEntitlement、contractStateIs、hasCapability。flagEquals只读已登记准备结果，不读任意路径；资金只读绑定账户的可用款，合同只解析绑定ID。合同条件基于可证账务交付/余额/欠款，不代替T06及路线任务的物理交付和客户验收。

效果支持postLedgerTransaction、moveReservation、startJob、pauseNewContracts、recordObligation、scheduleEvent、recordEvidence、recordCause，以及严格登记的recordPreparation、grantEntitlement。没有eval、外部请求或任意setFlag。JSON不能注册代码、修改余额字段或重建开局。

T05的postLedgerTransaction仅允许expense、income、reserve_cash、move_reservation、release_reservation、due_expense、pay_obligation，仍全部经过账本不变量与绑定检查。股票、权益、交付/退款、供应结算必须由后续专用业务命令建立前提，不能借事件JSON直接创建DeepSeek股权或把未交付预款改成利润。T03账本原语仍保留完整能力，不把它们直接暴露给普通内容。

每个实例绑定player/business/contract/person中的一个实体；绑定账户必须属于当前主体。装载时检查操作符、类型、来源、日期、重复ID、已登记准备/资格、默认分支、后继引用和循环；初始化/实例创建时再检查实际作用域、账户与后继范围。默认分支必须0行动/0额外成本、无额外条件，只能有限停止、记义务/原因或公共证据，不能免费启动任务、授资格、发收入或揭示隐藏事实。

## 事件、任务与日序

GameRun新增可空world状态，正常入口必有world；基础夹具可为空。world保存绑定、已发生锚点、阅读/收藏、准备/资格、事件、准备任务、停止新增标记、可见证据与因果记录。未来排程留在timeline，不进入公共新闻投影。历史/虚构/架空标签保留到投影与来源。

世界锚点使用world_update内的优先序先发生，随后才检查同日内容条件；沿用世界→确定到账→义务→玩家动作→撮合→快照。事件与定时器有独立稳定实例ID；事实在实例创建时固定，后续预览/阅读/收藏/读档不重抽。精确隐藏证据的揭示分支必须实际付出已声明行动或成本。

交互事件首次到达可暂停时钟。ChooseEvent明确选择；DeferEventDecision只解除本次提示，不改变期限或默认分支；继续推进到期限后自动执行默认选择并记录resolution=default。已经处理的遗留到期定时器记录具名跳过理由；触发前提不满足或互斥组忙时也有具名默认结果，不丢弃实例。

同一绑定/重叠窗口的互斥组在先前分支已接受后仍保持互斥；单纯拒绝默认分支不冒充接受。默认或选择产生当期欠款时会暂停加速：定时器欠款关联事件回执，命令即时欠款关联真实义务/效果因果，不伪造时间推进回执；确认暂缓不清除债务。

选择的行动/现金通过T03真实预留、执行和回执收取一次。已知即时财务效果使用同一预检函数验证并计入预览；未来到账不能支持当期成本。startJob保留完成日期，按单人日期资源占用，完成前没有准备结果。当前5条准备任务都为7天；该单人资源不是员工/完整经营容量，T06将建立共享经营与团队模型。

完成定时器只在任务仍有效时授予完成效果；中断保留成本/已耗行动。完成时条件失败会原子放弃整组完成效果，记录失败和中断状态并继续时钟，不能先授予部分准备再报错。过期、停止和中断不删除旧合同/预款/义务。到期费用可带实际绑定合同，费用欠款保持合同归属，不改变预款保护余额。

## 预览、信息和保存

ChooseEvent、DeferEventDecision、InterruptPreparation、ReadNews、FavoriteMemory均接入T04的runId/actor/载荷/revision/幂等和原子保存。读未来新闻明确拒绝；看不看新闻都不决定世界是否发生。普通投影不带随机流、原始事实、未来队列或私人备注；失败候选中的新证据仍不能提前发布。

`projectWorld`只读：普通事件最多强调1主2支，其余保留在ordinaryArchive；所有mandatory/risk及未结义务独立保留，不受普通数量预算影响。投影和收藏不消费随机；这不是已经完成的工作台界面或无障碍验收。

schema2包含world和世界定时器的严格形状与引用。导入校验固定内容hash、初始资格来源、已选分支、事实、任务/行动/占用区间、期限/完成定时器、未来世界排程和因果链。旧schema1明确返回UNSUPPORTED_SCHEMA_VERSION；没有迁移，原T04导出保留，不能用新规则重算后声称已兼容。

## 验证与历史证据

`npm run validate:content`运行真实包/schema/两背景初始化与封套检查；它不宣称完整经营路径可达。`npm run evidence:world`记录实际命令、种子/版本、起止封套与源哈希。两背景deadline回放只检验世界时钟和欠款保留；有资金内容回放明确为origin=fixture并注入50000000分，用于逐条完成5个准备模板，不能当正常开局通关或平衡证据。

证据采集器共用`--output-dir <新目录>`保护：已在HEAD提交的目标档禁止原地覆盖，Git状态无法核实时也拒绝写入。重跑T03/T04/T05案例须选择新目录；旧浏览器报告仅作为历史引用，重跑纯规则采集不会产生新浏览器通过结果。各提交的旧证据和原始planning字节继续保留。

[T05验证与实际范围](../goal-1/evidence/t05-validation.md)、[来源观察](../goal-1/evidence/t05-source-observations.json)。T06就业/团队与经营、T07第一单、T08市场、T09实际可玩/浏览器、T14分岔危机、T16正常24季度、T17原图和真人试玩仍待实施。
