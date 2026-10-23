# 原册/草稿/日历接缝交回

生产与测试冻结身份见[final-source.json](final-source.json)，终态见target-vitest-r3-terminal.json和strict-owned-r3-terminal.json。3项增量定向通过，严格类型0；前轮14项有独立较早源码，不合并冒称最终16项全跑。

CoursePanel接口为initialTarget?:CourseSceneTarget|null、initialDraftSlot?:CourseSceneDraftSlot、onTargetChange?；undefined保旧、null新入口、具体对象公开重匹配，错误同步gate。草稿slot只影响UI不造业务实例，许可按完整business/case路径核对；CourseSceneChoice编辑页onInspect(target,slot)到原册已用实际handler和正常前史验证，同资源/未来日期保留，sample另一槽不串。旧sample attempt保持原job，不换后一次；ready后sample和营业后outline原锚点仍可定位。

共享useCourseSceneDraft在读取和functional setter时均优先最新Map，run绑定/账户/业务/course/slot隔离并深复制；不随date/revision翻页重置。旧班期/招生/授课/支持/退款保原函数与命令，未执行本片范围外招生。SceneJournal仅由公开原jobs+outline/license/sampleAttempts唯一反查，完整account/courseTarget透传。

最终3生产：
- CoursePanel.tsx 47741B / 3874c2cb4810a35e238122cfede959135b32b267dbc26a87d69cf2ceb10ce9eb
- SceneJournal.tsx 8706B / 66caf37fa7b7002ca40a9a7133e6551e467b4ddbddadbeb72d6272450173252c
- course-scene-draft.ts 2954B / 12773457d1229761de3003d614e289b1469d6198c2269c293565f0119fd92ef3

边界：实际Chrome布局/焦点及原物理存储、最终生产bundle/完整Create原文、缺资源/资格过期分支实际画面与真人理解度仍由根后续核；这里仅纯内存/actual handler/SSR和controller单元证据。没有切尺寸、浏览器、兼容、Git或共享引擎/P3/旧证据改写。原红档全部留存。
