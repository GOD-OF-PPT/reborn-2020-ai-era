# U4-A 同物件六组纸件

只改 RelayServicePaper.tsx、relay-service-paper.css、OpeningObject.tsx 和新 RelayServicePaper.test.tsx。复用原 relay-service-kit-v1.png，状态与文字由父组件显式传入；原动作与业务映射不在本组件。六组 discriminated union，未读不泄露、未审计不画实计、支持独立、停止责任仅真实非空。保护保旧 committed phase。完整按钮 AX/原生键盘/textOnly 保留；局部 hover/focus/disabled 明确定色，无全件移动。

验证：仅单文件组件 SSR/原生 handler 的 meaningful cases，maxWorkers1/原默认时限；CSS parser 与静态限定扫描。无全套/类型/构建/浏览器/几何/兼容/新位图。最终画面待 Root 当前自然窗口截图。回滚只回 owned 前像/删新增3源，不触原图或业务。
