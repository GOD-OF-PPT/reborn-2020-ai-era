# R4当前画面局部支撑托面修缮

依据前轮真实view_image读取的3张R4 jpg（原图身份见before.json）：当前kit偏高，木桌承托不清；不能将去panel视为接触已经通过。

本轮只改RelayServicePaper.tsx及relay-service-paper.css。新增纯装饰native SVG小木托面（顶面、厚前沿、细木纹和自然接触影），置于原PNG与原状态图层之下，盒、票夹和纸条共用一个基面；无文字/金额/学员/灯或假后台数据。当前room静态锚点top由32%下移为41%，保160艺术行与自然签组，贴夹缘的margin/夹扣保持。没有hover整件位移或旋转，没有常驻大块UI面板。

全部business phase/state、根传heading/date/support/payment/responsibility/protection、actionHint、AX和绑定完全不改；新增SVG仍在原aria-hidden艺术层，textOnly不渲染艺术，根text-mode也沿既有隐藏艺术规则。未新增任何动效，减少动效沿原无transition的纸件规则。OpeningObject/测试/Root映射与原bitmap未改。

静态检查：PostCSS77规则，0错误；TypeScript只解析此TSX语法，0条parse诊断。限定无at-rule/字号/裁切/滚动/非relay选择器/非none transform。无测试/typecheck/build/浏览器/尺寸几何/兼容执行；上轮6/6为历史证据，不称本轮新运行。原kit SHA 5c4047dfaf691e497e8f89cdad1e454d418c21cd03068321345399d549fe3124，字节1731428未改。

最终hash见source-final.json，完整两源前像与changes.patch已保。源码冻结，交Root统一构建与实际一帧判定；该支撑面是否自然/是否落桌，仍待新图，当前不声称浏览器或美术验收通过。

[杠精审查] 限定装饰源码通过：真正添加共同支撑而非只换字/发光；不删关键字段，不凭图形造已发生结果。实际效果未验。
