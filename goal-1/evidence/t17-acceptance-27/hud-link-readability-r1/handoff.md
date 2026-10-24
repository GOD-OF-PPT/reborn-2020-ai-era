# 原账账户链接悬停可读色

已view_image实际recover-02-r4-original-period-wait-readonly116.png：右上链接浅底浅字。根同次DOM观测hover=true/focus=false，color rgb(255,227,173)、background rgb(232,223,208)、opacity1，文字在DOM完整。旧R4/506证据不覆盖。

根因是styles.css全局button:hover:not(:disabled)的background #e8dfd0（specificity 0,2,1）高于本控件default规则（0,2,0）；原控件hover只设置浅色文字。现在仅opening-play.css的一条控件局部selector改为:is(:hover,:focus-visible)，显式background #15332e，保color #ffe3ad及原下划线/键盘焦点outline。该状态specificity 0,3,0覆盖全局hover，不改其它控件或默认状态。

PostCSS语法通过；静态边界确认只有这1条rule变化，唯新增声明background，其余规则逐条同。静态声明色对比约10.90:1，旧观测配色约1.06:1；这是颜色算术，不冒称修后浏览器computed style或实际观感。无字号、布局/geometry/compat/TS/全局/其它owner/新图/测试/build或浏览器操作。原input264B逐字copy（SHA4191274f…），前后CSS与patch/检查/终态全保。

生产CSS已冻结：1a3084efbae1cbf7bc6dd8c52033bf0e8ffa97cea29fc0f6feef81402c5bc6a1，25999B。Root接新build后在当前自然Chrome实际复看hover与键盘focus；旧写入锁/只读由原流程继续，本修复不操作存档或标签。
