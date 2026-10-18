# D03 / C-D03 最终验证索引

2026-10-18，Asia/Shanghai。现有goal-1继续执行，用户新增“持续美术优化、美术优先、移动最低”已并入，不重建或缩小目标。本轮完成D03/C-D03限定范围，不标T15/C15或整goal完成。开工main/2bdb9c33d9488db2169e2168865351647f1abbad，原公开owner GOD-OF-PPT/reborn-2020-ai-era；本地提交状态另见任务记录/Git。

## 实际改变与画面

新增四名虚构NPC的半写实电影感肖像，桌面人物改左选右读；开局、章节、四导航、季度阶段、五路线、生活/年度、账本/记忆、风险、确认/保存状态统一纸面/墨绿/黄铜视觉。保持真实命令、金额、日期、义务、权限和场景实际完成条件。

- [美术问题、修缮与剩余项](visual-review.md)、[持续美术清单](../../art-review-checklist.md)。每个后续任务先复核最新画面，移动专项后置M01。
- [同状态对照身份](visual-comparisons.json)：人物与路线两组均为正常77、2022Oct21、个人127500、AP0、1280×720。人物[前图](comparison-before-people-1280.jpg)、C1后图及[当前C2后图](c2-candidate2-person77-final.jpg)已实际目检，四入口和人物资料同屏；C2仍为相同77原档。
- 内置image_gen生成四张项目肖像；[完整提示词](art-prompts.json)、[原输出来源](art-generation-sources.json)、[项目路径/尺寸/原PNG及生产JPEG哈希](art-manifest.json)。四张均1122×1402，JPEG仅编码转换，合计1702376字节；不据此声称浏览器加载速度通过。

资产是本轮虚构人物工作稿。原三PNG仍0/3，真人仍0，未替代原字节或最终用户审美判断；普通/已改善房间原资产保留。较早.png命名的截图实际JPEG、fullPage可能临时改变视口，原件保留；最终首屏依据V2原生JPEG和截图前后视口稳定记录。

## 真实浏览器与完整前缀

[最终分层原生报告](native-final-report.json)：79次综合迭代，58个最新检查全pass；其中52项是源组未变的C1实际观察，6项是在5220直接执行的C2补验，**不是58项全部在C2重做**。C1原72次、首页新增false及C2补验均保留在[综合迭代](candidate2-combined-iterations.jsonl)，[最新检查](candidate2-combined-checks.jsonl)与报告一致。生产/DEV分别标识，不把有验证条的DEV截图当生产首屏。原[native-report](native-report.json)是C1的52项历史范围，不覆盖随后发现的首页CSS回退，也不替代当前最终报告。

- 三桌面1280×720/1366×768/1920×1080：开局/季度/生活主操作、四人物入口、正常载入/文本/减少动效及稳定视口通过。四入口初轮回退和超4.3px的false保留；lazy CSS元信息行高修复后第四入口底边708.85在720内。
- 五路线全部工作区、生活/年度、账本/记忆/例行/处置、四人物切换实际可读；负净额/流出、2020年末余额、当前余额、公司与个人、预款保护、股权估值/锁定及独立控制证据没有混同。风险入口不被普通消息预算隐藏，恢复仍受原条件限制。
- 真实Enter/双向Tab/Escape与原触发焦点、刷新77原字节、第二标签只读114/写入禁止/中性保存徽标通过。生产实际忽略DEV故障参数，捕获范围内生产warn/error为0，见[控制台记录](production-console-final.json)。
- 新正常内容开局固定seed d03-native-content-art-1：26000/4点→真实改善工作个人3000/1点/7日；put后abort旧1仍26000/4点/普通房间，另一物理连接读回旧1；原候选2重试逐字同，23000/3点但尚未换景；Jan6未完成，Jan8提交4才改善。真实图片onError回姓名/原记录/200元1点3日操作，前后提交4逐字同。

[最终独立审核](native-audit-final/native-audit.json)实际0退出/42.307秒：14份UI导出、5实际正常输入、7对UI字节相同，286条不同完整正常命令。创建身份/版本/原命令载荷完整重放，每份UI raw与最终回放严格逐字同；原候选、物理旧档和提交分别记录，不以put完成代替事务提交。C2当前人物77导出仍SHA6b4e…；它复用已审完整前缀，不把重复76条命令再加成新的独立命令。详见[审计输出](native-audit-final-output.txt)、[实际命令与wall](native-audit-final-result.json)、[可复跑审核器](verify-final-native.mjs)。原C1的13份审核另保留，未覆盖或改写。

business/risk原引擎snapshot仅末尾多一个LF：[原格式诊断与严格canonical期望](input-canonicalization-audit.json)保留原raw/source SHA，独立codec验证其余字节/checksum完全一致；没有重写输入或悄悄trim所有文件。UI彼此的6对仍要求原始字节相同。导入的旧正常前史不冒充本轮原生2020全流程。

## 累计检查与完整性

C3内部1—3范围检查见[c3-results](c3-results.json)：6文件21项旧UI/Life工作台用例及构建通过，正常77/1只读操作和图片错误原档字节保持。首次可选布尔类型失败已修复，原输出保留；不放宽配置、断言或时限。

C-D03最终完整结果见[八步串行结果](cumulative-ordered/cumulative-results.json)：typecheck、78文件495项JS、60工具、内容、85份Markdown/原规格、独立构建、10组Life及两背景可玩回放全部0退出。原495同一完整运行通过，单工作器、每文件fork隔离和所有原断言/钩子时限保留；[实际78文件/源码/隔离/次序](cumulative-ordered/actual-file-order.json)、[完整输出](cumulative-ordered/cumulative-unit-output.txt)及[入口](run-cumulative-ordered.py)可复核。配置仅在独立诊断文件merge原配置后明确先跑两个异常文件，再其余76；根vitest配置/测试均未改。JS阶段1461.561秒，不作普遍性能或浏览器加载结论。

原默认顺序两轮分别485通过/10跳过、487通过/8跳过（原准备钩子60000/120000ms超时），均失败停止且完整保留；原两文件独立10项在原限时/隔离下通过。定序完整通过不证明顺序是唯一诱因或默认时限已经稳定，[诊断记录](diagnosis.md)与四个未采纳原型/CPU采样保留，默认计时稳定性归T15/C15继续核对。没有抬限时、关隔离、移动准备工作、缓存替代命令或修改规则来放行。

Life/可玩使用原T15/T09采集器在新目录实际复跑，保留其taskId/来源/种子身份，属于本轮D03回归，不替代T15或整24季度验收。此前T15的13类独立回放仅按原字节保全，没有宣称本轮又全部重做；本轮全495及14份完整正常UI前缀、上述12组新回放覆盖本次不改规则的回归范围。60工具中发布/PRIVATE/Push文字来自mocked工具测试，不是本轮创建私仓、推送或改公开权限。

末轮发现并修复[首页文字模式真实回退](home-text-mode-before-repair.json)：C1文本模式true/img0仍显示CSS场景，根因是同优先级后加载覆盖。保存[C1原CSS](candidate1-art-direction-before-text-repair.css)，仅新增更具体的home文本背景清除规则，另冻[C2最终322源](candidate2-source-freeze.json)。[源组复用证明](candidate2-source-reuse.json)核321文件同SHA、唯一差异是此精确CSS插入；全部JS/规则/测试/资产保持C1最终源，因此沿用其完整495/规则回放，C2新增原生补验与构建/资料复核，不重复无关规则计算。

[C2实际32资源](candidate2-production-manifest.json)逐字匹配5220磁盘/HTTP；[构建对照](candidate2-build-reference-comparison.json)中23份JS有16份原字节相同，7份仅已声明的资源哈希文件名引用变化，替换这些具体文件名后逐字同，无其他代码变化。C2六项实际检查验证正常首页仍有场景、三桌面文字模式BG none/img0/动效0s/首屏CTA、刷新偏好、当前人物77/5肖像/四入口及原档逐字同；[当前控制台](candidate2-console-final.json)捕获warn/error0。C1首页false与旧52项实际source/runtime都不改，不伪装成全数C2重做。

[最终完整性](integrity-final-before-commit.json)实际0退出：[开工3368文件](opening-files.json)仅授权5份旧文件变化，3363份保持；322最终冻结源/8肖像核对，5218基线28、5219候选1的32、5220当前32资源分别磁盘与HTTP同字节，C1累计构建与原固定C1逐字同。原三PNG仍0/3，旧丢失预览目录不冒称在线。提交/Git/远端最终读回记录随后单列，当前预览为http://127.0.0.1:5220/。

## 审查、范围与回滚

[GJ/REPEAT审查记录](gj-repeat-review.md)逐项检查C端、全部新源diff、规则投影、安全边界与最终CSS修复，D03范围通过；复用既有证据/防覆盖/完整前缀算法和持续美术清单，不新建Skill、代理或自动化，不改个人Memory。本轮本地提交与提交后保护另行记录，未推送，不把本地成果当远端main推进。

回滚用D03独立提交的新还原/修复提交保留历史、原档/备份和新旧资产，不强推/删档/上线。没有真实交易、支付、收费课程、模型服务、融资、网络分享、密钥、权限变化、依赖或外部资源。

后续顺序D03→T15/C15桌面原生收口→T16正常24季度/结局（持续美术复核）→T17非移动美术/资产/试玩/平衡→M01移动最低优先级→T18最终最大review/候选。真实200%/原生离页和FCP/加载预算仍未验，原PNG/真人仍待；不自动关闭任何整体P/W/Q/X。

## 用户最新美术复核

用户指出主画面仍像软件系统，要求先调研并交三套可选游戏界面，再实施完整美术优化。以上通过仅指C2技术/原字节范围，不代表主画面游戏感或用户美术验收；D03/C-D03继续未完成。追加阶段见goal-1/game-art-options/plan.md，旧原始报告/截图不覆盖。
