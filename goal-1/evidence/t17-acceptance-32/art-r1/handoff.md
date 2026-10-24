# U3-C2艺术源码冻结交回

只新增4文件，完整SHA见source-final.json，补丁见owned.patch。CourseTeachingPaperState / phase / status API按Root已接受合同，OpeningObject由Root负责teachingPaper与data-teaching-phase/status。CSS从组件自导入，名称course-teaching-art.css，未动原course-teaching.css、OpeningObject或其他owner。

六业务主形状：audience原报价回信、cohort真实班期承诺册、teaching两段课页、support回信与保留课件、refund对账/退回页、closed原班留册；stopped/history各有独立折页。choice/planned/running/actual另外用预留折页、书写散页和已发生留边区分。SVG无文字/金额/日期/百分比/学员脸姓名，无事件/命令；完整复用原1536×1024 kit，原字节同。朱红折签只实际needsHelp/refundDue/feeDue正值才出现，保护只正值才出现；它们不是数字替代，Root DOM仍须明示真实资金与日期。readonly/unsaved由原外层保护保committed形状，不在paper推未保存结果。

helper courseTeachingPaperFor(p:Pick<GamePanelProps,'view'|'features'>,target:CourseSceneTarget|null)严格核原业务/课程/受众/班期/任务、经营投影与账户，使用公开courseSceneProgress、原courseTeachingPaper和courseCohortFinancials，无新规则/时长/资金推算。准备course只在course-ready提供audience choice，其他C1步骤与旧样课历史返回undefined保原C1。历史cohort job只留原任务页，stages/当前钱款/帮助/closedAt全null，不借后来结果。

Root复核指出的受众误当班期已修：target audience只在completedAt为空且实际中断时stopped；已实际完成（有意向或空意向）始终audience/actual，只有真实cohort才班期册。cohort两段交付不代表学习结果；帮助未实际assessment时null，闭合只认closedAt。已登记退款/费用与实际支付不在art里混算；protected/refundDue/feeDue复用原同班financials，未知null而非0。旧course-teaching-paper.ts原SHA/mode/bytes未变。

新增4项有意义SVG/SSR用例准备：物件形状与安排/运行/实际轮廓、教学交付≠学习/结清、正值资金责任折签、历史不继承后来班级标记。只构造装饰art输入，不伪造GameView；受众actual明确不带班期页。按并发指令测试执行0、type/build0、浏览器0，Root统一后跑，不能报绿。静态复读与CSS边界扫描完成，无media/字号/裁切/滚动/缩放/动画/viewport；原图和旧模型身份已实核同。当前不称556源初末同，也不预报实际落桌/文字同屏或真人通过。

[杠精审查] 通过（本4文件实现/静态范围）：已修受众与班期边界，未知/历史不虚写0或当前结果；Root的联合检查、自然Chrome逐状态及实际钱/AP/date/保存仍待。源现冻结，不继续主动修改。
