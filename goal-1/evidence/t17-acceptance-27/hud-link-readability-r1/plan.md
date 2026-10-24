# 顶栏原账入口可读色修复

实际view_image已见recover-02-r4-original-period-wait-readonly116右上浅底浅字；根同次DOM为hover true/focus false、color rgb(255,227,173)、background rgb(232,223,208)、opacity1，文字完整。仅owned opening-play.css中opening账户链接hover/focus-visible明确深底浅字。

来源：全局styles.css button:hover:not(:disabled)背景#e8dfd0的specificity(0,2,1)，高于局部default(0,2,0)；局部hover仅设color未设background。补同控件的hover/focus-visible background，保默认字号/布局/轮廓，无全局/TS/其它owner/图片/尺寸或兼容改动。

验证只做PostCSS语法及差分属性/选择器边界、静态颜色对比；低影响样式不写镜像测试。Root后续生产build/current Chrome实际hover及keyboard focus另核；不因静态检查宣布实图通过。回滚为本CSS局部差分，原R4/506源与取证保留，不写旧seal/chrome-*。
