# C1 UI contract 静态复核 R1

2026-10-23T15:14:41.795Z。只读复核上述owner近景/准备/原册/草稿及Root接线；未修改源码、运行测试/浏览器/Git，未作兼容检查。此报告不宣告整体UI或实际流程通过。模型生产源仍原冻结身份。

1. **P1｜受控目标A→B→外部A会复活旧B。提出，Root待修。** 观察于 CourseSceneChoice SHA633accb7d0e1d98cf36c07e5193a123e5dfa98ce458224d48856714ebe54b0c1、99行。A近景翻选B后local={source:JSON(A),value:B}；父onTarget切B。随后从外部本季书签明确选回A，current因local.source再次等于source而继续B。同工作室A/B均有效，账户/业务检查不会拒绝，主幕A而近景、样课命令指B。最小修复：onTarget存在的生产受控路径只读父target；不得保留可在旧source重现时复活的local覆盖。无回调路径另保正确外部prop更新语义。Root已认领最小修缮与真实handler红绿，本报告不预报通过。

2. **P2｜提交前许可草稿翻原册没有落到同许可槽。已提出，Root/mainline桥接处理中，尚未证闭合。** 许可页原目标仍为course A（许可尚无实体ID）。此前inspect仅传current，CoursePanel taskScope按course target选sample A，因此原册显示/修改的资源日期并非business+case许可槽。已复读确认近景许可scope现courseId:null，不能再把旧courseId:A半项列为当前缺陷。当前Root/近景已开始传纯UI courseDraftSlot，但观察CoursePanel SHA3606b4724db0b2f0d602b4c2f35ce1c2c2a68403cf7d0ef7cc9c1a86bbc262f9仍未消费，不能称桥接完成。最小修复：inspect显带原draft slot；原册严格匹配run/账户/业务及同course实际case，读相同license:kind:id、courseId:null槽，定位案例许可准备字段。该槽仅UI身份，不造licenseId、不入courseTarget/偏好/游戏档；失效明确重选，不用全局lastDraft。保存变更到另一实际对象时也应避免沿用旧槽，辅助同course许可则可保原语境。

其他已读部分未另发现确定新缺陷；没有把它们写成实测通过。原命令预览/确认、候选/只读门槛、历史sample只读、旧准备复用与有限退出仍需Root当前窗口及受影响检查独立验收。旁路inspect本身没有调用rememberFocus；本报告针对上面可由源码还原的目标/槽错配，不把明确显选新书签与普通翻阅混为一谈。

读取末次字节（并行owner仍在修缮，后续结果需另按新hash补读）：

| 文件 | 字节 | SHA256 |
| --- | ---: | --- |
| src/ui/CourseSceneChoice.tsx | 27827 | 633accb7d0e1d98cf36c07e5193a123e5dfa98ce458224d48856714ebe54b0c1 |
| src/ui/CoursePreparation.tsx | 7282 | 95f6c3f5c605615c92c8d03dc49a5ddbdebd70b53638ad0dd662bd84ad3b5b8b |
| src/ui/CoursePanel.tsx | 43784 | 3606b4724db0b2f0d602b4c2f35ce1c2c2a68403cf7d0ef7cc9c1a86bbc262f9 |
| src/ui/course-scene-draft.ts | 2954 | 12773457d1229761de3003d614e289b1469d6198c2269c293565f0119fd92ef3 |
| src/ui/App.tsx | 45264 | caeee092c5f865828f9811b3a7a6767fd219edeae6f82c1116c8395f65fa0ad3 |
| src/ui/OpeningMoment.tsx | 25557 | cfe7a7fb8be5319e8016cf81c3a10b810d2860eb1ca5adc3fae9b936b378f1ae |
| src/ui/NarrativeScene.tsx | 43295 | eff0b0ef7aedaca130ec331e93d8c9ad6be7e569bc75dfe219455bec7412295d |
| src/ui/game-types.ts | 2810 | e119ceeb3fa8f8020cb78b2b019aa214750fce893ec147c520b49c8df2ec9d45 |
