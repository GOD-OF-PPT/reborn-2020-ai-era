# Reader 三张原生实图后的最小修缮 R1

本次仅图与source只读复核，候选补丁没有apply。全190回归仍由Root原进程运行，产品源冻结；三张JPEG的精确身份和6份来源首末SHA见scope.json（期间变化0份）。不改先前capability/producer静审的范围结论，也不把Reader原生体验缺口抹成Native通过。Root所记原87导出/备份及恢复86保当次身份，本代理没有运行任何游戏命令或复核其原文。

## 图上可确定的问题

1. n01原87住处整幕明确“原支持仍在进行，预计2024-11-13完成”，当前未来应收7.20，到期Clock先到11-08；房间物件/支持纸签完整可见。这次问题不应再改房间背景或挪主幕。本期纯period打开Reader的entryKey却固定选service row，日志与AX显示第一份票成“原服务已经实际完成”，与眼前正在等支持的阅读意图错位。
2. n02确是可选原票picker，显示全部133、1/28页，两条客户标题各含完整rly哈希。每条标题先逼玩家辨技术身份，日期/款项/这次需要回应什么反而弱。它不是钱/日期规则缺失；也不能因列表长删掉其余原票或只留最新期。
3. n03原支持Reader在同一页反复出现“实际进行中”：独立state、summary首行、原日程尾再次重复。260×174的接线盒/纸件位于正文末，在分页底边只剩上半，完整物件未同幅；结合columns源码可对应装饰物被当可跨列普通div。原支持金额1500/1点、原执行11-06、原期范围/容量/供应预算、已确认支持收入0都应保，不能靠删这些事实换空间。

## 最小完整实现顺序

### A. 默认先翻当前回应，原显选/记忆绝不覆盖（Root负责entryKey）

保initialRecordKey优先，再同target reading memory，再且仅此时给首次阅读建议。指定票或memory失效时继续当前“需要重选”，不能重算建议偷换票。完整run/account/business/station/period和typed recordId均不改；只改变本次Reader首次建议，不写主书签、不执行命令。

- period有显式jobId/meterId：保持原精确票，不按阶段换父/别票。
- 纯period无显式或memory：用同一relaySceneProgress和同原来源的rows。已知差额优先当前meter/correction回应；collection阶段选同progress原客户、当前period source的已到期原应收；audit-waiting选确证同period的原active batch；support阶段选同period原support job；planned/service阶段选同period原service。用row.periodId/jobId/receivableId typed字段核，不能从key切ID。
- 到期单/复核有多个候选时，按同原公开next-feedback/due日期和原顺序给明确“先看这一笔”的阅读建议；无法唯一或引用不一致，说明要选，不任意取某站/某期最新项。Root已有helper/原排序可用，不造新世界事件分类或读未来队列。
- 原87预期首次开原support；原86若主幕正核已到期原款，首次开同period到期原单。两者差异来自真实已保存状态，不是硬编码revision。

这项为主线修正，必须与下面材质/标签同批接回，不只给kit打break-inside就称完成。候选patch刻意不改entryKey，以免和Root已拟实现争Owner；本节为完整接缝要求。

### B. 阅读动作持续可见，133原票仍完整

把changeTicket视为阅读动作，放入RelayRecordBookView.actions，不夹在可分页正文末尾。近景SceneChoice已把view.actions放Dialog.footer，故原Clock/本次确认和“翻另一张原票”在正文翻页时仍有明确去处。原册original路径继续自己的原分页，不加固定浮动工具条，也不换ScreenBook。

选票列表仍有完整133和全部票种，不按过滤重新编号客户或取前N条；只改title的人类可读标签，内部key/recordId/target与全部row.lines的完整原ID一个字不删。日期相同/金额相同票必要时用该类原数组稳定原笔次作补充标签，不用过滤后index充当新身份。picker是主动阅读旁路，不能再次成为主幕默认目标。可在进入picker时将当前票种作为阅读起点，但“全部原票133”必须明确可选；此为可选后续细化，未含于候选patch。

### C. 原kit成为票页上沿的完整小物件，避开文字与分页

复用原接线盒/托盘/SVG与260×174 frame，不改图、不缩图/字号，不造人物或新大面板。把现有插画节点移到facts heading之后、state之前，限定在Book内float:right；文字围绕一个小物件，完整notes随后自然分列。现有纸色/墨色保；只有选中票的细金色左线与淡渐隐笔痕作选中状态，仍配radio/文字。不是给所有条目加卡片。

CSS以.cinema-app .book-flow .relay-ticket-illustration增强specificity，display:inline-block + break-inside:avoid-column/page-break-inside:avoid，让既有固定大小frame成为原子小块。当前全局.book-flow div规定break-inside:auto，且abs子图不能让分页器识别完整意图；不能只在img上设avoid。full-evidence/reading-actions clear:both，不把整个facts/全部责任变成不可分超长块。没有overflow/max-height/line-clamp/display:none或媒体查询。

候选未测试，浮动图与原columns的实际组合仍须Root同自然窗口回看；若整块移到下一页也应完整，不能断成两半。不能以AX有img或break规则存在称实图已修。

### D. 首层只去完全同义复述，完整事实保全

row.state继续单独刊出。generic summary初值从[row.state]改空数组，原日程段只留原start—complete，不再尾接同一jobStates。这是n03明确的三次状态复述去重；原cost/AP/执行日/现金与未付/原范围/容量/预算/支持收入一律不改。专用money summary与完整lines不改。source中的取消与实际执行区分也保，不能删成只剩“已停止”。

列表model新增独立customerLabel只供title用，原customerName及完整依据保持原ID。客户/原计量/应收/充值/续签/实收/退款标题用稳定客户号+原日期，复核标题用原start—complete+完整count，原jobId仍在row.key/recordId/lines和真实命令载荷。不得用字符串正则删哈希或拆key伪造人名。

## 候选补丁与边界

reader-material-and-copy.candidate.patch包含3份未应用diff：Reader常见阅读动作迁view.actions、插画节点上移；局部CSS原子浮图/选中材质；model精确状态去重与title标签。它只是一份可供Root后续授权使用的候选文本，不是已实现、可编译、测试或美术通过。所有金额/日期/原责任行和CommandButton/Clock/权限不在删除范围。补丁基于scope首读SHA，Root若有后续delta须重基，不能盲apply。

Root在原190终态和明确授权后实施A+B+C+D，再统一必要检查：首次无记忆原87应到原支持；原86应随真实到期原款；显式meter/job与失效旧memory不回落；同target取消/跨册草稿仍保；当前票阅读动作在footer；完整133原票/原ID从依据可达；同一自然窗翻支撑图前后页看整块kit/全文/原Clock；纯文本/减少动效沿原路径。这里只列本片定向责任，不启动兼容/几何/跨尺寸测试；测试用例或图存在不代替实际新图与原动作。

[杠精审查] 方案范围通过：同时修“默认读哪件事”、可读标签、空间支撑、重复层级；没有用换背景/删字段/缩字凑一页。原190/Native失败、R1旧准入范围、U4-B/R2/R3/C-S4-R和整体goal留责。等待Root授权源码，当前writer冻结。
