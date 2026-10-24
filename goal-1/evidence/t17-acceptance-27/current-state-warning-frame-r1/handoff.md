# 当前警示状态的电影舞台修复

仅cinematic.css原第10行末尾3个旧room警示selector增加:not(.opening-scene-active)，保所有原声明和其它字节。App测试提示、警示内容、原四类:has匹配项均保留；没有隐藏提示或改为pointer-events兜底。新一屏场景不再走旧relative顶栏/HUD及收窄舞台回退，继续由原single-screen/opening样式定位。非opening旧行为保持。

原坏图为chrome-atomic-r5/atomic-02-current-unopened-focus.png和atomic-05-original-retry-publishes92.png；正常对照chrome-normal-r5/normal-03-r5-original-period-closed118.png，均保旧身份。只读诊断已核旧selector(0,4,0)覆盖后加载较低specificity单屏规则，DEV .test-banner可持续触发；真实生产警示也可能触发，因此修在同一警示接缝。具体鼠标命中栈仍没有冒称已复测。

PostCSS解析成功，静态限定正好3个rule的selector变化；全部声明、其它字节、文件mode0644不变。未改断点/尺寸/字体/规则/其它UI或master；未跑浏览器/构建/游戏命令/测试，未碰已结束的旧候选链。当前自然窗口警示层/实际鼠标与键盘、生产构建由根继续，不称本检查等于实图通过。

原input逐字264B，源前SHA98d73f66…；现31398B，SHA256 d50c07d109d694196b0d408741eac2e5435fb759f511f711eafc6d7a65dc02a0。已冻结，原图与506源证据不覆盖。
