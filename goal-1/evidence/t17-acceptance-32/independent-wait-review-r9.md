# U3-C2 R9 独立等待审查与阅读记录

本文件只记录作者本轮实际全量阅读、仅 docs36 追加及独立静态审查。记录时源码身份如下；没有运行测试、类型、构建、preview、模拟、原126重放或浏览器动作。根代理另行报告的定向绿色与 Native 不作为本文件作者的执行结果。

## 三份 master 完整阅读

完整覆盖 input 1；plan 1—668；tasks 1—876。分块实际读取，而非只看尾部或摘要。最初合并输出中的 tasks 1—170 有截断，随后重新逐块读取 1—100、101—170，弥补全部遗漏。其余 plan 分块 1—180、181—320、321—440、441—550、551—666、667—668；tasks 分块 171—220、221—270、271—350、351—450、451—550、551—650、651—750、751—876。

| 文件 | 字节 | 行数 | SHA256 |
| --- | ---: | ---: | --- |
| goal-1/input.md | 61 | 1 | 20c73f8fec1a17a39606fc854126c59f949cddc6f8342ec2d55eb999c10a70b1 |
| goal-1/plan.md | 136717 | 668 | 182ec4a48525fdaff6affabaddb16580b20fc7f901906272dc4e4a97c9302d4c |
| goal-1/tasks.md | 244958 | 876 | 5f3e331b3951af3b1cca7872c8f63096a117b3a580d324fe8bd99d3474140be6 |

阅读开始 plan 为136355B/666行、SHA f33f430e74e41f3afd0de3043ecd87f439efaa9d3d66e48141babb657cf6941e；tasks 为244596B/874行、SHA00807a6b442b233d56eddfd603089efb7610ea3f1abb7a2a32cb14e502a2c716。期间根代理各追加362B/2行 R9 条款，原全部前缀逐字保持，新增尾部亦已读完。上表是结束阅读及本文件写前再次只读核得的同一身份。作者没有修改 master。

当前唯一任务仍为 U3-C2，R8失败保留、从原97分支验证R9，不提前标完成或提交；U4A后续，CUX06待C1/C2/U4A后，所有兼容开发/测试仍0。原P3 26路径、root19、三master各2304B/14LF插入、旧封存、原PNG/真人和全goal未完成责任均保留。

## 此次授权的 docs36 唯一增量

仅在现有8.11追加2052B/4段：旧71923B前缀 SHA e765a9c365634e105e0afb7db844b2f43c4009de830a59e5337127862eb88087逐字保持；现73975B/453行、SHA 58467abb3e057eac04690e78390ce0c6a3fe349fc8b30fa17be7ca6e00f36ae4。未改旧段落或任何其它产品源、master、root32既有证据。新增内容明确原98逾期事实、不能按期补完的日期依赖、R9仅UI等待停点修订及原97修后分支待验。此追加未由作者另跑文档检查。

## 独立静态结论

这四处新逻辑未见确定阻断，结论只限代码阅读。

- course-wait-date.ts:6—19只取原 playable 上界与公开 progression.nextDate 较早值；pause/交付屏障返回null。真实同日pending可继续；无同日pending时只有季末snapshot保留同日一步，已闭季仍可到原nextQuarterDate。没有未来事件名称、结果或新时间规则。
- CourseThreadAction.tsx:21—29先处理history/非成功，再把同一个next交给ClockAdvance。主念头、纸件共用binding；缩短停点使用日历停点文案，仍保原长目标反馈。原ClockAdvance的review/main均构造同一date的原AdvanceTime请求，不在提交时暗换确认日期。
- CourseTeachingChoice.tsx:180/200真实wait使用同helper、同safeDate标签与请求；course-stage-needed仍用原latestStart专用上界。原历史job先显式回本班；目标错误/只读/候选仍由原context、lock及CommandButton live gate限制。没有用取消、换页、失败候选发布新结果。
- course-teaching-continuity.ts:14实际受众只称已有记录，班期/报名另核；18真实欠退款/欠费优先于窗口标签；25—29累计预款、仅正值实退、保护与教学收入取同班原账。46的historical提前返回，MoneyFor另拒history，不把当前班汇总贴到旧尝试。原欠付和完整原账入口未因三处copy变动消失。

### 审阅源码身份

| 文件 | 字节 | 行数 | SHA256 |
| --- | ---: | ---: | --- |
| src/ui/course-wait-date.ts | 1030 | 20 | a97aca8a9be9118d4df3c2db0d8ded811d05ea678d2a403cd6f2b6bb69624788 |
| src/ui/CourseThreadAction.tsx | 3902 | 33 | 8068274eed8876d128a6a88cf2f87f0950be61928f3907372367b31aa6e50c9a |
| src/ui/CourseTeachingChoice.tsx | 53821 | 253 | e6116bf81d275bb61295ef3b22b305aa3f516771faf71d3204e710aa37219ba3 |
| src/ui/course-teaching-continuity.ts | 5645 | 66 | de7b61b3a2be2d09e637e271304dc6156c59261d579df8a3ca482803e1c48678 |

辅助只读依赖身份：

| 文件 | 字节 | 行数 | SHA256 |
| --- | ---: | ---: | --- |
| src/ui/ClockAdvance.tsx | 3495 | 38 | 919ec76c3c762f0ab428e47233c468784f9c18ff51bda007fe8d38d634110f2f |
| src/ui/shared-action.ts | 2290 | 39 | 5562777df4ccdacbd266f29835571e0c18d1977424cf12816ae39fd2cf6e42b7 |
| src/ui/CourseTeachingDetails.tsx | 12597 | 87 | eb16c882a8239b616e4f81b7652e2d2681591fc832c070ba6c8d27c8074ad3de |
| src/ui/course-cohort-progress.ts | 17485 | 118 | f87c6081e6f9abf008dd030b011a6e1a232dd9c73e0028eca0d1d06a5f97fd73 |
| src/application/playable-advance.ts | 862 | 10 | c703a8eab70aabd3a1cf3f0a4a0f0b25b9c253a0afca8dd4a192d29a0900c9a0 |
| src/application/workbench-projection.ts | 11136 | 55 | 36a6092bee23b9509b26a7ff04535518cd0d5717aa4bbaacbf0e2be8c944b4a1 |

## 原98有限失败与修后边界

原98 actual Mar31才看见H004（发生Mar14、到期Mar21、defaulted=true），原导出1005459B/SHA9c2fd116f08a08673139f9bb1e2df3f63b2bb7fed09802b98c87c159eaa0d1f2保留。原第二段Apr8期限不变：Mar31起七日更新最快Apr7，之后七日教学最快Apr14，故不能按原班承诺补完。晚更新可修课程，不能改旧班期限；Resume不免原更新；Recovery是支持，不能代替第二段教学。

可沿原有限出口明确Interrupt未开工教学/支持，未来预留依原规则释放，已耗成本/AP及第一段实际交付保留。RefundCourseLearners退的是所选原学员全部尚留原款（含已交付收入冲减），不是任意“只退一半”；stage_due原自动处理才按未交付部分。资金不足保留原应付，原窗口及费用实际处理后才可closed，不把有限退款收尾称为教学成功。作者未执行这些命令或预览。

原97可见备份973216B/SHA80d603e542c7b5a8a5ac1f366bd2bc946428a2869eab417fd2b0118b5714063f作为另标R9分支输入，不删除98、不算新人生。R9新分支及时停读变化、真实更新/教学/支持/结算，以及候选、物理只读、原重试与重进仍须以根代理之后实际 Native/审核终态核定；本文件不以静态审查或旧绿色替代。

本次唯一新证据文件采用实际 browser_evidence_guard 对root32及祖先保护后wx创建。记录写成后作者停止writer，等待capturing完成后的独立原126完整Create审核授权；本文件不是封存marker。
