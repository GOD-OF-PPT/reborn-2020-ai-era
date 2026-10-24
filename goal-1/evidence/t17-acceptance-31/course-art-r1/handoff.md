# U3-C1 教案纸件交回（生产冻结）

接口：CoursePreparationPaperState={phase:CoursePreparationPaperPhase}。phase 为 entry / outline-planned / outline-running / outline-completed / definition / license-planned / license-running / license-ready / sample-planned / sample-running / sample-ready / stopped / history。OpeningObject 新增 coursePaper?:CoursePreparationPaperState 与 data-course-phase；FirstOrder/entry/day/video 既有优先序保持，course在其后。没有prop时仍走旧PNG与C2教学slips分支。

原1536×1024 course-preparation-kit-v1.png完整复用，SHA 227d3bb9b10a327c5c2dd6d26f15e50ca33d02d6780d422b50cdb9990383f245；无新bitmap。原生SVG：来源空教案、预留折页、展开书写、成册大纲、案例与教案、预留许可、材料与范围核对、成对范围留页、预留练习页、展开样课、留存样课、停放与保留单、旧页翻折。没有金额、日期、学生、批准文字或货币图形；许可完成不是样课完成，样课不是收入。原图封扣保留，未伪称PNG已解开。

文字与主动作由Root公开模型供给，组件没有命令、读档、日期推算、保存或阶段推断。保护只在旁签，readonly/unsaved/unavailable不改已提交图形；textOnly保阶段、完整原名+action、detail、保护文字，移除装饰图。原native button、disabled、onActivate、aria-describedby与完整AX名称不变。新CSS仅 .course-preparation-art[data-course-phase] 或新 data-course-phase 挂载，不改旧shared CSS、字号、裁切、滚动、断点、规则或底部导航。

实际小检查：CoursePreparationPaper.test.tsx 3/3，0失败，单worker，原默认5000ms未改；用例运行约67ms，进程13:28:26.227Z—13:28:28.168Z。3个TSX的语法诊断0，PostCSS解析及选择器边界通过。检查绑定18个本地静态依赖，前后逐字同；check-inputs-before/after和terminal保原件。这不是547源/全局strict/type/build/Engine/Native或真人验收；并行其他owner源未绑定。Root后续联合检查与自然当前窗口实际接触/人物/阅读/阶段/保护图审待做。

本轮四源SHA见 source-final.json，完整前像/patch/final副本均在此目录。没有改OpeningMoment/route/choice/model/原册/master/assets/P3/Git，未运行浏览器或兼容/几何专项。源已冻结，不继续产品修改。

[杠精审查] 通过（本组件与接口范围）：不是同图换文字/钟标；13态有不同path轮廓。未删责任或真实字段，旧C2无coursePaper时不变。实际美术接触与全经历清晰度尚不能由SSR断言成立。
