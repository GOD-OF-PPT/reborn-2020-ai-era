# U3-C1 当前Root实现只读复核

本轮重新实际读取input1行/plan645行/tasks853行，共1499行；全部内容分块输出，无截断或遗漏，未以read-r1/摘要/搜索替代。读前、全量读完与本次末核的bytes/行数/SHA/mode精确相同，见master-before、master-after-fullread、master-final-readback及reading-coverage。RTK/GJ/REPEAT正文已重读；既有项目流程可复用，没有新增Skill、自动化或memory。旧goal-read-r1/r2不覆盖。

当前唯一U3-C1，终点是同一样课真实完成且当前权利/工具可核，没有招生、班期或学费收入。原手工案例、免费全局大纲、所有原册/C2责任继续；当前116普通marker与2marker symlink不混旧全repo19 symlink。兼容开发测试0，未重置goal、未进入U3-C2。

## 一项确定可修问题

**[P2] 已完成样课的非成功/暂停分支会丢新结果去向。** CourseSceneChoice.tsx:138—139对kind=course、status=ready但phase不是course-ready（且非historical）的对象提前return CourseTeachingChoice；其children将所有非record意图一律折为undefined，包括新next。CourseThreadAction.tsx:23对course-closed/non-success主操作明确调onResult→open(next)，因此已有ready样课的工作室进入关闭/收尾等状态时，这个“想怎样继续”入口实际打开旧Teaching默认页，不能得到本片新结果页的回今天/生活。ready后暂停/资格或权利需重核也被同一宽条件交给Teaching，而不由准备结果层说明当前缺口。原closed/paused与样课status分开是合法业务状态，不能靠样课已ready泛化成班期/招生域。

最小修法：将准备域next保在CourseSceneChoice；只有真实audience/cohort、旧refresh/update等原C2域，或玩家从结果页明确选择下一步后才委托CourseTeachingChoice。保留全部原恢复/旧班/支持/退款操作，不为修入口禁原允许动作。建议对原正常ready86的合法暂停/收尾结果保原ID做一次实际handler断言：物件与主操作同标签、同next、可回Today且不新增命令，原book仍同对象。此处尚未本轮执行或Native复现，不把源码因果说成实际新游戏结果。

同一边界的状态呈现也需一并核定：course-continuity.ts:15以后只将phase===course-ready映射sample-ready；ready对象处于course-paused/course-tool-required/course-rights-required时会fallback definition。已有样课并未被删除，宜保实际完成痕迹并另标暂停/当前前提需核，不画回尚未制作的方案。不能因此宣称资格仍有效或自动恢复招生。此作为上项视觉后果，不另增第三方规则/状态机。

## 未发现新增确定问题的接缝与限界

原先确认前setOpen(false)已删除；新结果页、主物件binding、路线CourseEncounter、Today准备对象支持及App同course workspace fence均已在当前源码接入。历史先回今天再读原记录，命令/等待仍走原CommandButton/ClockAdvance；public progress拒invalid/historical继续承诺的边界保持。App target key带完整对象、草稿槽/教学槽/record，局部保存映射核run/account/open/epoch而global真实saved关注独立发布；原候选/冲突/只读与原retry未从本静态读取发现新增确定绕过。

这些是所读源身份下的静态判断，没有运行测试、浏览器、命令、codec导入或新的Create审核。Root仍在实施，后续源修缮须以新身份/定向与真实当前图核验，不从本报告外推已有正常链、全部艺术、真人理解/趣味或整个goal验收。本轮只写新goal-read-r3；产品源码、主master、旧sealed、Git/index不动。
