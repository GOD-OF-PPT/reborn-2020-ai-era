# U4-A relay paper handoff

四个源已冻结，详见 source-final.json；未改原 PNG、业务映射、动作绑定、Root UI、core/P3。

API：OpeningObject 新增 relayPaper?:RelayServicePaperState；component 导出 RelayServicePaper、RelayServicePaperNotes、RelayServicePaperState、RelayPaperPhase、RelayPaperSupportState。六组 union：preparation(choice/planned/running/ready)、permission(unread/read-pending/approved/declined)、commitment(choice/agreed/funded)、service(planned/running/ended/stopped)、audit(unmetered/reported/planned/running/reviewed/corrected)、result(receivable/received/closed/stopped)。共同字段 heading:string（可空）；dateLabel/line/supportLabel/responsibility/paymentLabel?:string；historical?:boolean；support?:pending|planned|running|completed|stopped。

Root 必须从同一已提交公开对象提供上述状态/短文；支持独立于服务/结果保持，responsibility 非空才有朱红图签。paymentLabel 自身不会改变图形为已收到，基金/充值不可当利润。组件不解析日期、不推断审核/收入/未知实计。Notes 在原 copy 中、纳入 aria-describedby，textOnly 保全；完整 title+action AX/native button/callback 不变。若主幕已有同文，Root 可传空 heading/不传附加字段，不必复述。

纸件保原图1536×1024，SVG各组形状不同。未读封口，未计量页空白，复核/更正没有收款票；服务结束、支持完成与实收分别表现。hasPaper/protection 包含 relay，保护不改业务 phase；CSS 仅 relay selector，完整透明按钮 default/hover/focus/active/disabled 与局部字色，不整件漂浮/旋转，无断点/字体缩改/裁切/滚动。

验证：新单文件5/5（maxWorkers1/原默认时限）exit0；87个静态相对import闭包输入在该轮初末完全同，4owned同；PostCSS56规则0错、限定扫描0项问题。首轮因新增SVG标签闭合错误 transform失败、0项执行，红档保留，只修标签后r2绿；未放宽断言/时限。未全type/build、未引擎/浏览器/几何/兼容。Root后续映射/全局集成/实际自然窗口图和交互仍待，不由SSR宣布美术或真人通过。

原图 SHA 5c4047dfaf691e497e8f89cdad1e454d418c21cd03068321345399d549fe3124，字节1731428，本轮不变。

[杠精审查] 本组件子范围通过：无TODO/假占位、无请求/存储/规则动作；六组不只换同一文字，关键未知/状态/责任与textOnly保留。整片U4-A仍待Root实际验收。
