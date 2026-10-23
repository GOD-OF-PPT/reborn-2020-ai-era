# R6局部间距修缮交回（已冻结）

唯一生产文件src/ui/opening-play.css：23941B/SHA1b74906db46803f602be12938557d78beccb4c88cca747ea64bf10239784cc47，mode0644；修改前23952B/SHAb861b4da69f99b5422558f6465c08b9aef5ea18293ea029f917b4786ad801e87。完整before/after、opening-play.css.patch及result.json保留。

已实际看两张Root指定R5图并读同次DOM：完整交付110的探索与地点仍叠字；running109重进主幕文字更短。选择保原层级的四项局部留白收紧：

| 选择器 | 属性 | 原→新 |
|---|---|---|
| .cinema-app .opening-room:not([data-exploring=true]) .room-current-moment | gap | 13px→8px |
| .opening-room .opening-room-stage | margin | 0 0 10px→0 |
| .opening-room .room-current-moment .moment-line | margin | 0 0 12px→0 0 8px |
| .opening-room .room-current-moment .moment-feedback | padding | 10px 0 10px 13px→6px 0 6px 13px |

原因是收回标题/状态/正文之间及回响框内部的重复留白，让同一份完整承诺与下方动作维持阅读顺序；没有把文字或责任移走。标题与小字字体/字号/行高、动作min-height与padding、原框线及反馈左padding13、场景/物件inset/尺寸、z-index、overflow/scroll/crop、所有断点/减少动效/纯文本规则均逐字保持。按before精确替换四值后与实际after全文相同（result.onlyTheseFourChanges=true），没有其它生产或资产改动。

没有执行测试、类型、构建、浏览器、几何/尺寸或兼容检查，未使用Git；不报告实测节省像素，也不从CSS推称重叠已经关闭。Root接R6生产构建与同长真实交付/退款画面及探索mouse实点，实图失败时保原R5红图另记新补正。

额外画面边界：running109重进这张参考图中教案主体插画没有完整显出，只见状态标记与文字旁签；本次仅将其作为叙述间距参考，不据此归因/改资产或称素材已齐。最终R6艺术图应保真实插画载入后的身份；原道具接触/局部人物轮廓残余与真人/原PNG缺口仍不冒称关闭。
