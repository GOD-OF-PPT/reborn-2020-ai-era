# R3当前镜头静态构图修正

实际已view_image读取R3 jpg，身份见before.json；该图说明kit落在椅旁、短纸签在桌外，不能作为修改后的通过图。原大绿框已去除的R2结果保持。

静态原因：旧room的top/bottom撑满＋首行minmax(0,1fr)，art靠该行底缘；纸签变短会增加空余首行，kit随之向下。

本轮只改relay-service-paper.css，精确前像/changes.patch/hash已保存。room relay改成现有160px艺术行＋自然签组，align-content:start/bottom:auto；当前镜头top32%静态锚定到木桌区域，签组margin-top:-12接图底边，保夹扣。nested原wrapper同域处理。不对整个button加hover平移/旋转，不改PNG、文字、money/date/support/responsibility/保护、AX/actionHint/onActivate/disabled。

textOnly及根text-mode显式grid rows:auto/copy margin0 padding0，无图不保留160艺术空行；其它路线与route普通流不改。

验证：PostCSS71规则0错，限定扫描0违规；独立只读复核认为新direct/nested/:has规则优先级压过后导入opening-play，文本覆盖又高于正常构图规则；关键字段仍独立DOM。3其它owned源逐字同R2，新CSS SHA 1f418df258798941a076991356f588ac0051ba32c6ff25a9dc9267cf6c3f4592。纯样式修缮未新写镜像测试、未重跑既有6组件case/全type/build。无浏览器/几何/兼容/窗口测试。

限制：是否真正落桌、夹扣/纸签接触是否成立，须Root R4自然实际图再判；此交接仅源码修正，不能称美术通过。仅text-mode class无法替代textOnly prop控制JSX全文；当前既有调用合同应同步传textOnly，未另扩模式。

[杠精审查] 源码范围通过：根因按内容流锚点修正，不只加影；关键文字/原控制不删不缩不裁，实际图效果留Root复验。
