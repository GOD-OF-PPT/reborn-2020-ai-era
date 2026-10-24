# 当前警示状态舞台修复

原candidate链已由根实际完成：旧91/物理旧91、candidate92/原retry物理新92分别同字节，当前已保存93且无候选。现在只修cinematic.css中3条旧room :has警示回退，排除opening-scene-active。保test-banner/真实警示与全部原声明，避免当前一屏场景被重新相对定位和收窄。

确定来源：App DEV aside.test-banner触发旧3条高specificity规则；single-screen的后续低specificity默认未覆盖。坏图引用chrome-atomic-r5/atomic-02-current-unopened-focus.png与atomic-05-original-retry-publishes92.png；正常对照chrome-normal-r5/normal-03-r5-original-period-closed118.png。没有把具体鼠标命中栈当作已测；只读调查见父聊天。

执行：三文件/完整前像和SHA先于CSS；只替换三个selector，不改任何声明、断点、尺寸、字号或其它UI/master/规则；PostCSS语法与AST限定差异、精确patch/终态后冻结。无浏览器/构建/测试矩阵；根随后当前自然窗口实际警示状态截图/鼠标/键盘和构建。回滚仅此selector补丁。
