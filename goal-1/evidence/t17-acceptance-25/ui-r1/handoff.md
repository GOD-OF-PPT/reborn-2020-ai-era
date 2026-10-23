# C2近景UI交回（源码冻结）

本agent只改下列7文件。Root/GameTypes/App/CourseCommandDetails/模型/原册由各owner接线。CourseTeachingChoice真实import course-teaching.css。

| 文件 | bytes | SHA256 |
|---|---:|---|
| src/ui/CourseTeachingChoice.tsx | 40264 | d23a53971bf72c0feee9bbae9c997f8a4c06a5365c38914e7e65fe44f19802c4 |
| src/ui/CourseTeachingChoice.test.tsx | 13093 | b4e36461f9333c6b94c82d37bf3708c97f2d5c423463eac23471cab03e533223 |
| src/ui/CourseTeachingDetails.tsx | 12597 | eb16c882a8239b616e4f81b7652e2d2681591fc832c070ba6c8d27c8074ad3de |
| src/ui/CourseTeachingDetails.test.tsx | 8966 | 4d0ca0273bb5710352591d549f48394d1061db966de5b7309b9236d2f75f4f6e |
| src/ui/course-teaching.css | 3439 | fb03a6e5e0362bf9fa7948bf66c866a87c7f24b826a8ec98b7eb792b82bb5ef3 |
| src/ui/OpeningObject.tsx | 4042 | 35153b770bfdd9308e754ee17263e63d0f20d8ac4cadef835b392b97408f3276 |
| src/ui/course-play.css | 7102 | ab3a8d706b9a02d4b389a6f82787fa9299a8cbf92b93e6016195bb1f8766ea96 |

## API与身份

CourseTeachingChoice按interfaces-r1导出原Props与courseTeachingDraftCommand；children open(intent?)不执行命令，onTarget仅显选，onInspect携同target及原槽。capital/audience/refresh为course/null/null，plan为原audience，enroll/stage/recovery/refund为原audience+cohort；capital/refresh保当前书签。三数组全部函数setter，不丢同一事件连续勾选；原共享Map负责往返。

两教学/原支持/补支持/实际反馈只读原提交投影。历史job仅翻阅，须显选去掉jobId回同班；原支持已随Plan预留，不造重复安排命令。候选/只读/冲突/旧revision/错账号/blocked同步锁提交；失效目标明确重选。全部原操作仍经完整原册到达。

OpeningObject增加CoursePaperState（父只喂真实提交状态）与displayTitle。可见短标题保完整aria-label，默认C1等原读名不变；纯文本不渲图而保全部文字/责任/动作。两枚纸签actual由父delivered投影，非本组件推断。Root应只对非historical同cohort传teaching。

## 确认与钱

CourseTeachingDetails展示捕获原payload+本公开对象：Audience显选报价/来源/日期；Plan冻结实际audience单价及支持预留；Enroll只取原preview的预款/保护增量并明确收入0；Stage/Recovery/Refresh分别说明真实完成、原支持/退款责任继续。Refund复用原CourseRefundDetails。费用/AP由原确认preview权威，不复算为实付。

courseCohortFinancials读同cohort合同正现金流水作收到预款；原RevenueBalance.prepaidFen是当前尚未交付余额（ledger deliver/refund实际递减），recognizedIncomeFen为退款冲减后的已确认收入，非利润/新现金。退款登记来自同cohort原refund；实际已退=登记−原operationIds对应的未清refund obligations。fee只读同cohort expense的原未清额；feePosted≠paid≠closedAt。保护读原active reservation金额，未核完整则null而非零。独立model owner在其F05原真实RunSession追加非0应付核验，终态由其交根。

## 实际检查与红档

- handlers-r1：3/3，Vitest单worker，native6.90s；actual handlers/CommandButton，原正常档，显选/不执行浏览/资金不足原preview/连续数组/错账号与只读等。
- confirm-r2：4/4，Vitest单worker，native4.58s；原正常r74的Plan/Enroll原preview及候选投影（非保存）、原Stage确认、实际退款原账、displayTitle纯文本完整读名。
- syntax-css-r2：两CSS解析27/55节点，无media；三个TSX transpile诊断0。非布局/浏览器验收。
- type-r1终态2：book旧test unused addDays和过宽target（book已另修）；type-r2终态2：root新course-teaching-paper.ts:17:6 TS2532；本owned源无诊断。原日志和terminal完整保留，不报全局绿。Root将统一type/build。

最后仅记录词句把“教学净收入”改为“已确认教学收入（已扣退款冲减）”，无载荷/控制流变化；handlers绿对应前词句，final-source与type-r2-source可核该一处。Details保留旧责任准确句后运行confirm-r2绿。

没有服务、浏览器、Git、兼容/几何/尺寸/缩放或新图/声音；当前自然窗口实际物件接触/人物叠盖/底部入口和一班完整周期由Root后续真实核，不称真人理解/趣味性通过。
