# C2接缝约定 R1

本文件先于本片生产代码。三文件已建立，当前只实施S3-C2同一任务。

- 目标仅在现CourseSceneTarget增 audience {businessId,courseId,audienceId} 和 cohort {businessId,courseId,cohortId,jobId?}；jobId只能唯一属于本班原教学attempt或支持/补救slot。run/account保OpeningFocus；旧attempt不默换最新，无目标不找全局第一班。
- 新course-teaching-draft.ts由book接缝负责：CourseTeachingDraftSlot为capital/audience/plan/enroll/stage:0/stage:1/recovery/refund/refresh；CourseTeachingDraftScope包含accountId,businessId,courseId,audienceId:string|null,cohortId:string|null,slot，runId另传，不含revision/date/page。
- CourseTeachingDraft字段：capital,price,audienceMode,sourceIds,resources,startAt,endAt,supportStartAt,seatLimit,supportMode,deploymentId,promise,personIds,reason。所有日期/金额/名额是string；sourceIds/resources/personIds是string[]；deploymentId是string|null；mode/promise保string由原解析器校验。emptyCourseTeachingDraft默认空/[]/null，不默选资源、受众、成员、支持或日期。createCourseTeachingDraftMemory/read/write与useCourseTeachingDraft/run/scope/memory/initial保持C1 hook同样的函数setter与防旧稿覆盖语义；复制全部数组。
- GamePanelProps新增可选courseTeachingDraftMemory（App同run唯一实例）；SceneTarget新增courseTeachingSlot?:CourseTeachingDraftSlot；CoursePanel初始initialTeachingSlot，同目标原册/场景两侧共享以上Map。C1既有courseDraftMemory/slot完全保留，不把班期塞sample槽。
- 新CourseTeachingChoice由art/UI接缝负责，Props {p:GamePanelProps,target:CourseSceneTarget|null,onTarget?:(target|null)=>void,onInspect?:(target|null,slot?:CourseTeachingDraftSlot)=>void,blockedReason?:string|null,children?:(open:(intent?:CourseTeachingDraftSlot|'record')=>void)=>ReactNode}。命令helper导出courseTeachingDraftCommand(p,draft,intent,target)，只组合所选公开ID/真实字段；原CommandButton与最终preview/确认仍权威。
- Root负责CourseSceneChoice纯gateway：ready当前课程与audience/cohort分派新TeachingChoice，旧准备/历史样课仍独立inner；C1 onInspect扩第三参数teachingSlot（第二仍准备slot）。Root负责GameTypes/App/Opening/Narrative/Room/SceneResult共同接线，接CourseTeachingDetails到CourseCommandDetails，避免重叠编辑。
- Book负责CoursePanel/SceneJournal/CourseStageChoice与新draft及原册/槽测试；audience/cohort/job新增锚、legacy recordId反解，class/intake字段共享且过期不重置。C1 preparatory helper对C2 target/teachingSlot分开核，不误判为definition/sample。旧班期所有命令、责任、三形式两主题四支持及旧原册保留。
- 模型负责progress/player/season/pref及其测试：实际saved新对象白名单与同course/biz/actor严格重匹配；FundBusiness/Refresh/普通浏览/Advance不抢焦点。Enroll/Refund保同班，planned/running/completed、protected/收入/退款应付/费入账/closed分开；projectCourse没有payments，不能假设有此字段。
- 原款口径：Enroll现金与保护增加、收入0；阶段完成释放保护并确认收入而非又收钱；Refund退款记录不等实付，feePosted不等closed，仍有应付/保护缺口须可达。Plan即预留原支持，不能再造安排原支持按钮。
- Root C2plan9步骤/三次debug与第三S3累计完整执行；任何代理只能在指定文件接缝实施本同一任务，不做P3/兼容或另开task。旧root24/post已sealed。
