# U1首单艺术组件交回

生产范围已冻结：只改OpeningObject.tsx/opening-play.css，新增FirstOrderPaper.tsx/FirstOrderPaper.test.tsx；精确身份见owned-source-final-r3.json及owned-final-r3.patch。早期owned-source-final.json/owned.patch为R2历史，最终以r3为准。未动Root/模型/其他路线生产文件、位图、master或旧证据。

接口：OpeningObject导出FirstOrderArtState、OpeningObjectProtection。可选firstOrder为letter/planned/running/delivery/feedback/non-success或paid+receipt{receivedFen,receivedAt}，可另dateLabel；protection为readonly/unsaved/unavailable。日期原样呈现，图层不解析日期、不算金额、不调用规则。主button仍原onActivate/disabled，实际共享动作由Root供给；button真实属性data-first-order-phase。

七态分别增加委托便笺、夹住的虚线约定、工作页/剪辑条、整理好的待提交作品、发出封套与回信槽、独立实收票据、收起的原工作。复用原first-attempt-v1，不伪造客户/成片/百分比或收益；paid金额/日期在语义DOM且textOnly保留，非paid没有收据。保护层保committed phase，readonly文案最终为“只读·原记录保留”。短displayTitle仍有全文aria-label；日期/票据/保护纳入描述。减少动效不靠运动辨状态。

首单CSS独立锚定桌沿方向、贴底阴影、纸页旁签与纸边聚焦，取消其整物件hover上浮；没有重画背景或新bitmap。此为已接线的构图实现，实际自然窗口尚未目检，不能声称人物手部接触或画面无浮空已验收。

验证：最终target-r3原默认时限/单worker 4/4通过、exit0、4源前后同。R1首轮3/4：SSR日期attribute输出dateTime大小写与test期望不同；原红、原测试前像保留，改断言大小写不敏感，不改生产逻辑。R2 4/4保旧身份；R3仅收紧readonly词与相应断言。CSS PostCSS解析通过，58新selector都含data-first-order-phase，旧25999B完整前缀逐字保留，无新增@rule/裁切/缩字/滚动/zoom；三TSX语法0。Root统一semantic type/build，不把transpile语法当严格类型通过。没有浏览器/兼容/几何专项或新engine命令。

只读Root接线结论及当前7源身份见root-wiring-review-r1.md/json：主念头和物件同binding、原接拒略/提交/Clock/终态显选仍保，未见新增确定命令分叉。实际确认/候选/七态画面和原完整循环由Root继续验，U1/T17/真人与整个goal不预勾。
