# S2纯模型交回

本代理只修改 player-thread.ts、新增 season-thread.ts / season-thread.test.ts；原 player-thread.test.ts 字节未改。UI、App、偏好存储、原规则/钱/AP/schema/随机/游戏raw、旧P3与旧sealed证据均不由本任务修改。源码已冻结；最终4文件哈希见 source-r4-after.json，与原5秒复验的 source 完全一致。

## 固定接口

- playerThread(p, focus?, focusQuarter?)：原字段外提供 focusQuarter、focusScope（entry/current/carry/history/invalid）、legacyFallbackRequired。旧对象不等于新季安排；旧安排在本季真实完成可有 current 结果。旧季只留入口意图则明确重新选择，不自动工作。
- seasonFocusChoices(p) / focusCandidates(p)：每个具体公开对象有 OpeningFocus、原日期、原季度、阶段、scope、下一反馈日与失效说明。入口与实际对象去重时保真实原日期；选择只是书签，不执行原命令。
- seasonFocusAfterSave(previous,current,kind,payload,existing,pinned=true)：沿真实相邻已保存revision/同run，原主pin不被责任/旁路/AdvanceTime抢走。同对象更新返回 existing 原引用；entry创建才补实际ID，原委托amend只跟自己的replacesId。无pin继续S1有据保存推断。
- seasonRecollection(p,quarter?)：from/through/asOf、真实closed/source、atQuarterEnd，最多3个featured nodes及全部allNodes；remaining完整不slice。nextQuarterDate只取原当前季末公开日历；2025Q4只问有限尾声，不开新季/补AP。

## 来源与审查

回响只用公开正工资记录、首单实际收款流水、生活完成/中断、约定实际兑现/失约/对方撤回、实际成交、已付交收、已完成研究；不由余额差、最后20条摘要或今日估值猜旧季结果。每节点带原sourceRefs与原册目标。remaining保留原义务/缺口、强制与非ordinary事件、pause原instanceId/原因、未完首单/生活/市场/准备/原经营工作，以及sceneThreads全部旧业务责任；普通新邀请不自动抢主关注。个人life/work/free及个人market携businessId明确无效，企业市场只认company同账户主体，不能被手工业务旁路污染。

有意义正常链包括：原工作三次月末工资→Mar31真实闭季来源→Apr1原4点/工作重新决定；Mar28休整跨Q1→Apr4实际完成；Mar25见唐萤→原邀请接受→跨季保留→Q2实际兑现；SIM-AI02真实委托/改委托/成交/后日现金交收；原强制事件暂停/原选择保存后回主pin；实际IDB head.put abort→原候选retry才绑定同对象。终季仅为公开投影边界断言，未冒充正常完成24季。

## 检查原文与限制

- R1原默认35项：32过、3红。修候选去重丢日期；投资测试改用原有1日交收SIM-AI02（SIM-AI01现金零日交收）；旧relay实际责任3项，改核原责任集合完全包含，不臆造数量。红档保留。
- R2原默认37/37过、strictTS 0。
- 最终源R3原默认39项：36过、3项默认5秒超时；没有断言差异，超时原因未独立归因。strictTS 0。
- 同源R4 --testTimeout 20000：39/39，仅诊断，不能当作原默认门槛通过或性能验收。
- 同源R5原默认5秒/maxWorkers=1精确复验两背景首单及旧relay3项：3/3过，36 skipped，9.55秒；sourceUnchanged=true。即最终39项由原36过+原超时3项同源复验覆盖，并非宣称最终原39项一次全绿。
- 原player-thread.test.ts及workbench/life/market/journey原来源5文件哈希均未变，见owned-baseline-preservation.json。

未运行全仓、浏览器、兼容、Git；不证明UI/偏好存储/正常Chrome实际画面、人类理解、整体验收或S3—S5。根负责后续正式接线、Chrome与提交。
