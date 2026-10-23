# C2独立保全与根接线只读复核

保全R2通过，精确结果在result-r2.json；原result.json false/check.mjs保留。首次脚本把C1 post完整headBytes误作P3插入位置，补正说明r1-assumption-correction.md及独立check-r2.mjs保留，不把旧红改绿。未改production/旧seal、未跑游戏/单测/兼容/浏览器/Git。

| 范围 | 实际readback |
|---|---|
| root24 | 453/453 ordinary；453逐bytes/SHA/mode同；50/50目录精确集合，无增删/重复/符号链接 |
| C1 post | 21/21 ordinary；21逐bytes/SHA/mode同；1/1目录精确集合，无增删/重复/符号链接 |
| 两marker | 103481B/SHA4a8df0ad…与5393B/SHAc7aa1ec9…，均同root25 git-baseline外部开工SHA，读取前后同 |
| src开工429路径 | 411完整字节/mode未变；18旧UI变更，另13新UI，共442路径；261非UI全同，0缺失/越界变更 |
| P3原26路径 | 26/26 bytes/SHA/mode同开工或sealed前轮精确锚；不是P3功能验证，不涵盖root19整树 |
| 三master | 各自root25开工完整前缀逐字同，仅追加本C2 756B后缀；各原P3单插入块2304B/14换行，SHA均d6d2ae77cb0e8dadcee47df146d712a82dbfa4a278a2de9cec3a3a5564610655 |
| 原goal input | 61B/SHA20c73…保持 |

marker历史mode和目录历史mode未被开工/封存字段记录：当前均实际观察，marker读取前后mode同；不扩大称从封存起mode逐字保持。ordinary的474个mode有原索引，逐项实核。root25 source-baseline仅src429，P3另核26指定路径；本报告不声称whole repo未改。31个C2 UI允许路径完整枚举在result-r2.json，非UI和原P3在本快照同，后续Root最终源/构建另核。

P3块以sealed C1 post intended文本恢复原HEAD前缀，与root24 master-baseline.text求唯一插入（removed0B、added2304B）定位，三处真实offset为72049/180290/66598；不能用完整HEAD长度代替插入offset。读回当前/root25开工均同原块。

## 根接线结论（代码事实）

未发现新的确定跨对象、提前收入/完成、只读/候选提交绕过。审读的7个源文件身份见wiring-source-readback.json，复读时均与保全R2相同；这是限定只读结论。

- App.tsx:95—128仅真实saved且同run映射新目标/书签；unsaved/conflict保完整原payload于failedScene、关闭原册不播成功。retry提交原候选，open:false不复活旧册；原确认继续controller.preview+submit，未改变命令。App:173—190显式target不带旧recordId；只在同页且没有新target时保原对象；teachingSlot与目标/owner一起进入Panel。:228—236显选清旧record及两槽，bind实际business owner。此处得到book owner并行只读同结论，不代替实际Chrome。
- CourseSceneChoice.tsx:136—139在原hooks之后按明确course ready/当前audience/cohort分派TeachingChoice；current受控直接target，不全球拿第一班；preparation/historical sample保C1。第三参数teachingSlot由同target穿过onInspect，原C1准备slot保持独立；rootchildren只打开近景，不追加第二套默认命令。
- CourseCommandDetails.tsx:11—14仅一次新Details承接六个教学命令；Refund沿原CourseRefundDetails，其他C1准备不丢。所有新承诺仍由原preview确认，金额/AP/开工日期在原confirm；预款/保护增加/本次课程收入0明示，无重复Stage长段。
- OpeningMoment.tsx:101—110/142—149从thread原courseTarget投影，课程近景p.accountId校正为同focus owner；历史job显选去掉jobId回同cohort才继续，不自动换最新。责任/unknown优先且blockedReason透到近景，纸签仅非中断/有效关注/非legacy。短displayTitle保完整aria-label，不藏课程名或日期。
- course-teaching-result.ts:27起要求同run、revision+1、saved、非candidate/readonly和原receipt一致才生成新回响。推广/Plan/教学/补支持安排与真实完成分开；Enroll取实际新增同班students；阶段交付须原attempt job completed且deliveredAt新变；退款对原operationIds实际负现金流水及未清应付核总额，feePosted与closedAt分列。Fund是个人转入，不称收入；PayObligation可结清而不强迫另推日期。course-scene-result优先接该新回响。
- course-teaching-paper.ts:9—25只显式同cohort，历史job/无效进度不画新班状态；实际deliveredAt才两段完成，planned/running/stopped有原job；保护与退款待付读原finance，实际needs_recovery才朱红签，closedAt才结清。未预画学生或未来结果。

模型owner另报F05真实RunSession/官方projector独立非0应付回归通过：应退10000=实付5000+仍欠5000，部分原PayObligation后paid8000/owed2000，费用0仍不结清，末笔原付款后才closed/保护0；这些是其测试原身份，不计本次只读审查执行，也不冒充normal或Chrome。

## 问题与待实看

确定阻断0；没有提出新增功能任务。当前自然窗口新C2图尚未交给本审查，实际物件触感/局部人物叠盖/纸签密度/底部入口及保存回响文字阅读仍待actual图+同次DOM/AX目检。旧C1图与静态源码不冒充本C2实际画面，自动操作不等人类理解/趣味性。
