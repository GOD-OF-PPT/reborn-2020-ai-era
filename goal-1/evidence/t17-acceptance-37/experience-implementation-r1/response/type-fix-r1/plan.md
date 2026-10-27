# 单测试只读props补正

只将停止支持public fixture的p.view赋值改为新props变量，原alter结果保成scoped，p={...scoped,view:{...scoped.view,operations:...}}。不改GamePanelProps只读合同、不加断言绕过，不变原13case与所有expect/真实setup20s/it默认5s。先保前像/原R20实际结果，再apply_patch该两行，静态精确差异和保护源identity复核，freeze交Root+art；工程/Browser/codec脚本/Git0。
