# S3-C1 Root 接线独立只读复核 R1

范围：按root24三文件及近景UI契约，读取App、OpeningMoment、NarrativeScene、OpeningObject、RoomMoment、game-types、course-scene-result、scene-result；必要追读同对象模型/原册接口。未改源码、运行新测试、浏览器、Git或兼容/几何检查。本结论是当前代码接线审查，不是实际Chrome、完整业务或真人验收。

确定发现及复读闭合：

1. Narrative外层command/Wait原先只查模型invalidReason，原册切查看账户后可能绕过近景owner门槛。现已复读NarrativeScene：courseIdentityReason用于标题、encounterWait及显式course的Action/Wait分支；无效账户只开近景重选。旧undefined legacy分支保留。
2. OpeningMoment曾把任意course actual（包括大纲/许可完成）称作样课，且无条件写尚未招生。根补正后复读：只有course-ready称“回看这份样课”；其余actual称教学准备；caption改为招生另定、原责任继续。当前两项具体缺口在源码上闭合。

当前接线核对：

- typed目标/null入口贯穿SceneTarget、RoomMoment inspect、OpeningMoment、App导航与Narrative；near chooser传焦点实际owner，完整原册收到同target。null与undefined保留各自入口/旧合同语义，没有把显式对象换成全局第一课程。
- App的courseDraftMemory仅按runId新建；同屏openWorkspace保留显式courseTarget（包括null）和recordId，并按已匹配business修正未显选的owner。显选按钮才调用onTarget；候选/冲突/busy同步阻断换对象，原册预看不改primary。
- active course提交LicenseCourseMaterials后，App从之前完整视图生成priorCourse，交courseFocusFromSaved。模型只在同business、实际新增许可、原course含该case且既有关注有效时保留同course；否则明确绑定新增license。App的tab target和season pin均仅在saved分支更新，不凭安排/失败候选播放成果。
- 原册保持白名单仍仅LicenseCourseMaterials：同run/screen/account/epoch、原册原先开启、已保存无候选且非只读才留册；定义槽与许可槽不混。确认取消只关确认，近景草稿保留；失败清回响/关册，retry沿failedScene保存的原kind/payload调用controller.retry，不重新生成命令。此处只核代码，未新增失败/重试实际运行证据。
- 主幕和物件近景共用openCourse、真实command/ClockAdvance；等待读取原progress.wait与playableAdvanceDate，责任中断仍优先。course前景消费真实1536×1024资产，文字保持DOM，textOnly隐藏图片仍留原生按钮全文。
- courseSceneResult要求同run、更高revision、saved且无候选。样课完成回响另要求同job由planned/running转completed、完成日不晚于当前日且course实际ready；日期到达本身不算完成。scene-result把课程实际差分与其他时间回响并列，没有把制作变成招生或收入。
- legacy教学未被C1吞掉：Narrative的undefined路径仍有原CourseStageChoice；显式课程/工作室原册仍渲染该business全部课程与cohort的StartCourseStage、支持/整改、逐学员及全班退款。旧sample明确只读回看可切当前准备；完整复杂教学/退款继续走原册，C1近景未新增营销/招生动作。

当前未见上述范围内新的确定阻断。生产同源类型/构建、Chrome同对象往返、取消/失败/retry/只读及完整正常Create仍由根另行核定；不能据此称全局100%。

读取终态SHA（根后续修改需重读对应段）：

```json
{
  "src/ui/App.tsx": "92526084b3a8a6610484b2661a1c8364217c3b005724143495500a3782e4628c",
  "src/ui/OpeningMoment.tsx": "09ff9f556716d62be2c27e8e244aae56d55ea302a161557ed71a1f1cd16d7356",
  "src/ui/NarrativeScene.tsx": "4d82114c11ed3b2b62dd930dff2a04688bf8b7c36921a257df7506ea98fada28",
  "src/ui/OpeningObject.tsx": "312af7323e41dcbb7c6b1af4f414bfdfabeb4a761d3ba58632637f5c95351d0b",
  "src/ui/RoomMoment.tsx": "e27b0490a0eaa0c657a980b251bbb082129627021c438bd94950bf4c01ec2a5d",
  "src/ui/game-types.ts": "426be48d75472ded70c40d1893fabff2937beb669cbaa539181c8e2f053b4fca",
  "src/ui/course-scene-result.ts": "5f19f377237aa0a065b482f2ac9ec06a980f13c25630cbec7b4621300aed3459",
  "src/ui/scene-result.ts": "bea0184fa3f9bebb36ce9762cf86efaf7e8e224eeb1ce395bde4069be5f06d04"
}
```
