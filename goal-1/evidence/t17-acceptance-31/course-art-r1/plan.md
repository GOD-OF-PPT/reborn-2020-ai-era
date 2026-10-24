# U3-C1 教案状态纸件

只改 OpeningObject 的 typed coursePaper 挂载，新增 CoursePreparationPaper.tsx / course-preparation-paper.css / 对应纯 SSR test。复用现有原创低平 course-preparation-kit-v1.png（完整1536×1024），原生SVG纸页、书签、留痕区分13个公开阶段；金额、日期、原因、主动作全部由父DOM提供。不画现金收据、学生或未发生批准，不把已安排画作完成，不从日期/资源反推状态。

OpeningObject 的 firstOrder / entry / day / video 既有优先次序不动，coursePaper在这些之后显式挂载；无prop时旧分支逐字保留。保护是 committed phase 的旁层，textOnly不输出图层、保全文本/AX/native button/disabled/onActivate；新CSS限新paper或data-course-phase，原字体/焦点/独立底部导航不变。原C2 teaching slips保持。

检查：13态图形实际分支，规划/运行/完成语义分明；许可完成≠样课完成；无命令/新币图/状态推算。3项小SSR检查轮廓、AX与保护语义；先准备源与静态自审，Parent统一冻结后执行联合定向。若本地运行则只报实际owned依赖，不称全547初末同。无global type/build、engine、浏览器/兼容/几何/多尺寸、资产/Git/master变更。

回滚：只恢复本目录OpeningObject完整前像并移除本轮新组件/CSS/test；不得恢复他人并行改动。接触/人物叠盖/全阶段实际视觉由Root自然窗口后验，SSR不是视觉或真人验收。

[计划审查] 不是换字/钟标；每段有独立纸叶轮廓，完成样课保为教案。原图封扣烘在位图，不伪称已解绑；不建立第二状态机或新规则。
