# C-B3：三项累计审查与解析热点修缮，限定验证通过

本轮唯一U6内部C-B3，承接B1 34f41993、B2 8d2f32d5、B3 Node13e4cf5f/最终7f1cf70d。先349三文件/覆盖与风险，再350正确seam红测，再351最小实现；不是T18，不开始U7。逐B1合同、B2生产协议、B3真实candidate/Store和Native来源读源的审查表见review.md；原全部需求、资产/真人与后续范围保持。

## 实证问题与正式变更

原assertSupplierHistory对每次全账校验重复JSON.parse每条旧signature。4条真实低层ledger记录连续20次全校验，旧350实际80次，期待4；350新增8case为3红5绿。正式仅src/core/ledger.ts及新ledger-signature-cache.test.ts两份owned。私有WeakMap以同receipt对象和同当前string命中，仅复用解析；所有成本/资产/发票/重复/状态等校验仍每次完整运行。签名变更、非法JSON/null/非string、非对象与getter原属性读取/错误路径保；private operation不暴露或写回源。

原304实际20235条signature合计7469302B；缓存明确32768插入、16Mi字符累计、单条8192字符上限，替换/已GC键仍保守计数，超预算整表重置，大单条绕过。条目/字符两预算独立清空、不同对象、热后破坏和原数据不变各有回归。无规则/schema/RNG/日期/AP/钱/权限/codec格式或依赖变化，不引入正例ID全局缓存。

## 当前工程与累计边界

351冻结942行/2owned，P3 overlay0；7账务整文件35/35定向通过1861ms，随后完整Core/Application/Persistence89整文件一次594/594、610240ms，原5秒/2worker/隔离配置不变，实际9374 exit0。35含在594内不重复汇总。类型351/45898ms、构建351/1411ms均exit0；两个origin当前构建各56 HTTP文件逐字同。350原3红保，不改测试限时或缩文件来消红；没有运行P3正式62/22，也不把模型全批冒UI或完整游戏/真人验收。

## 真实旧档与同原命令

新351 codec五份原v1及真实77/v2完整导出字节、独立Node zlib逻辑同，legacy71194 exit0/10062ms。原304/10088850B/SHA9fa6fda4..新codec回读/再导出全同。同原诊断Jun6命令完整canonical51227733B/SHA f2e6bcd9f1819f05dd3009cc206b81de3325313ad8eb05294f8635367e3c37b0与348原baseline全内容hash/长度同；kernel19139ms，历史62231ms只是非受控单次对照，19秒仍过慢。

原304上同normal-capital-v2:305 AdvanceTime(Jun30)重新evaluate，kernel448363ms；完整codec wire4609457B/SHA c107fa8eacb43116fb582f59beb0d85f95be86f5c5507fbf9db3691157844e87与348真正saved305逐字相同，原输入304不变。真实saved305与Native329/v3的新codec回读/再导出也全字节同。作者检查90883实际exit0、wall562695ms；多份完整run同进程maxRSS2527760KiB，仅作者进程记录，不是Chrome堆或正式内存合格。以上0新Store/0新Native，不把提案导入当进度，也不将两支receipt拼为同一人生。

## Chrome与用户主进度

新351在原QA5527仅续既有Native329，0新导入/Create，原before329和实际backup329完整逐字同。原Clock有已知支出时主按钮直接执行，独立先核对入口保；本轮主Clock明示个人4000/中转54后实际一条330/Jul1，原Q2服务继续，Q3 AP3可用/1预留/0已用。计划的329先取消没有发生；真实330另显点Jul2核对53.76/0新增费用0点、9.67已用未出账分列，返回调整未再推进，不能冒329取消。部分工具回执超时但实际动作已完成，逐当前状态核而未重发时间。

实际330 writer/ANOTHER_WRITER readonly/cold完整4622781B/SHA e2c4fb73c8012ced2b4602c1b347287c34baf97fe519e3276553a3aeed079b33逐字同；原347依这一真实命令后缀重放完整wire等值，新351完整codec读回同，35006 exit0/159451ms。非完整Create重跑、非新Native故障注入；原348大档fakeIDB put后abort/同candidate retry按原源身份保。QA003/006标签全关，5527 server10560实际exit130，DB保。native-r352已STOP/fullseal27普通文件。

主5415实际仍原129且无打开决定，完整before保；前置齐后精确停原84610/PID87501、实际exit130，替换新351，保旧内容寻址资产共88文件，当前build56 HTTP全同。原UI重进、全部after与before1317268B/SHA82f3147aa4684334f032886300292fd906050af25e873c1ded5a69c87b5621e7逐字同，0主Core/导入/设置/书签。三阅读层合上、同次主图DOM与markDeliverable齐；新主30475/PID99897保可玩，旧用户其它origins不写。main-r353已STOP/fullseal15普通文件。

## 未解决与下一次实施

当前没有WebWorker，browser-game直接Controller/Session，evaluate/copyJson/codec/Store.prepare同步占主线程；PublicWait仍按无意义日常nextDate逐日保存。解析复用没有解决全部长等待、响应或内存问题，不以原型/本次历史时间差/模型绿称性能通过。下一B4必须把交互与真实执行边界成套隔离，含异步preview/clock确认、run/actor/revision/session/sequence/lease/candidate/retry与原子发布；用短提示和真实可回应状态保护画面。随后B5最小公开反馈意义接口减少日常序列化，不能读隐藏队列/未来模拟或简单跳target跨掉原反馈/费用/硬屏障。具体调查依据和未实施边界见next-repairs.md，原U6短文案/closed生态终态/17动作5共享系统美术、正常2025board与最终全审全部继续。

[杠精审查] 本次纯解析修缮、原协议/权限/完整原文和实际当前经历限定通过，数据正确与游戏可理解、有趣/美术认可分别成立；未删历史、换seed/钱/AP或拿fixture获得资格。源与当前两owned、35完整旧/子seal及P326/132marker/2symlink/旧19与35/input61B/未接线model/master前缀+2304B插入按当前保全核，选择性提交/post仍随后完成。U6与goal仍IN PROGRESS；原U7/U8/CUX12完整U4-B/U5/U6、U9后原组合、T17余/PNG0of3/真人0/P3正式62/22 not_run/M01须用户明确恢复/T18最后保持。全部页面兼容开发测试0，无push/deploy/新委派/外部消息/global memory更新。
