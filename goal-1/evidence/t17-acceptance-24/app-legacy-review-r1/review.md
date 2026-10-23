# Legacy课程辅助保存复核

结论：在此次读取的App身份下，未发现retainLegacyPreparation新增条件的确定缺陷；不需改生产。它把原白名单保留原册约定应用到undefined旧入口，避免成功辅助许可后改target/key卸载原册。

- **undefined旧入口**：App.tsx:105只在courseTarget严格等于undefined且keepPreparationWorkspace全条件成立时跳过setCourseTarget/setAccountId/slot改动。原run/account/legacy focus/slot保留，CoursePanel.tsx:78的实例key不因新增许可切换；License不改变原业务lifecycle，CourseBusiness key和definition稿继续。
- **null新入口与显式对象**：不进入该例外，仍用courseFocusFromSaved公开差集/原payload/已提交receipt映射。显式course许可属于原课程案例时该模型返回原existing；studio/新实例仍接真实保存后的目标，原共享草稿按各槽保留。未静默把null视为undefined或虚造许可。
- **已开原册/主体/时序**：App.tsx:55–61的白名单仍只有saved LicenseCourseMaterials，原origin/active必须同run/course screen/account/epoch且两边open、账户存在、非readonly，并有committedEcho。关闭再开、换账户/页/人生不满足；成功回响也按当前epoch/account复核（:240）。
- **失败与重试**：unsaved/conflict不进saved映射分支，:126关闭原册；failedScene保完整原payload。retry的workspace刻意open:false（:256），不会借新例外重开失败时已关闭的原册。候选/saving/冲突/readonly不能满足committedEcho与keep条件。

跨业务边界：keepPreparationWorkspace自身不接businessId，只检查账户/页/epoch，不能单独把helper true当作任意同账户跨业务身份已证。当前实际路径依赖原Panel在legacy下选择既有未closed业务、License原payload与原规则不换该业务；显式目标另外由courseFocusFromSaved核同business/case。换企业账户会改变epoch并拒保留。本次未构造不可能的多active studio，也未称同account任意换旧业务场景已被此函数独立验证。

实际定向：原App.preparation-save.test.tsx单worker4/4、exit0，native4.05秒、wrapper4704ms，所有原时限/断言保留。它用明示fixture的真实原命令验证许可费用/AP、未完成任务、white list、主体/epoch/候选门槛、head.put实际abort及exact retry；**直接测的是keep helper，不是App.onSubmission新增分支的事件/DOM实例验收**。本次源码阅读确认该新分支调用关系，未以4项绿替代实际Chrome/原册不卸载观察。

复核源：App.tsx45500B / SHA256 af9bc0df327ba2c5438911ceaa1706c4692bef65b9b8dcf3d750f766fcaa7c87；全部7项读取身份及终态见source-before.json、vitest-r1-terminal.json、final-readback.json，前后0漂移。未改production/测试/P3/旧sealed；未跑兼容、Chrome、Git或全矩阵。
