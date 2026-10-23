# C1 最终艺术 / TA 只读复核 R1

当前有一项确定画面阅读问题需保留打回：R4许可已安排幕底部文字互盖。其余本次已读图片和源码未见新的确定状态/操作阻断，可以继续原正常小循环；不等于整体验收或真人理解/趣味性通过。未改production、开浏览器、跑测试、Git或兼容/尺寸/几何专项。

## 实际读取及证据边界

实际view_image：chrome-r4的R3 public-wait、definition-draft；chrome-r5的R4 course-rights-main、license-draft、license-confirm、license-planned、license-running、sample-zero-ap，另补sample-confirm（r4-09）。对照同名dom.txt。截图只证明该页可见内容，DOM/AX还列出其余分页，不把后页文字称作首图全部可见。

R3未开放幕旧标签“已经答应”与未到公开日矛盾；当前OpeningMoment已为course-unavailable使用“尚未开放 · 没有接受教学承诺”，这是源码闭合，R4十二月图没有重新覆盖开放前场景。R3定义纸页是2/2同意尾页，画面留白较多；名字/形式/主题/受众在前页及同次DOM可到达，不能据末页断言丢失。

## 当前确定阅读缺口

r4-06-license-planned.png中，左侧底部“本季行动点已不足…”与场景“普通出租屋…”底注相互叠字；该图没有清楚呈现“环顾房间”入口。DOM仍列该按钮，所以这里只确认当前画面读不清，未做鼠标试验，不能断言完全不可点。已即时通知根。

最小修法是课程planned幕减少反馈、moment.line与moment-terms间的重复叙述；保留真实日期、¥300/1点/7日、预留与实付区别、原责任和导航全文。不能缩字、裁切、隐藏警告或把它当兼容项目后置。相关源为OpeningMoment的moment-story/decisions及course-scene-progress.originalJob文案。该缺口未由本代理改源码或假称闭合。

## 已可保留的状态表达

- R4主幕用同名教案说明当前先核课程使用范围；费用/行动/等待日各有来源，主动作通往核对。房间、人物、纸本物件与轻HUD的分工清楚，画面已比多列管理面板更接近电影叙事场景。
- R4安排幕明确“已经安排 · 尚未实际开工”，显示原预留；运行幕明确“正在准备 · 尚未实际完成”。两图没有提前盖成样课或教学收入。0AP样课纸页实际显示¥2,500/1点/14日、预计与实际完成分开，按钮禁用，原因仍在。
- 许可确认截图1/2可见主体、¥300、开工季度1点、当前12月8日及所选12月9日，随后新说明标题；“本次素材案例”、资源与12月16日预计完成仅在同次DOM/后页可核，未在该首图全见。
- 样课确认r4-09首图实际可见课程名、形式/主题、¥2,500、开工季度1点及12月16日→2023年1月2日；资源、1月16日预计完成及两案例在后页/DOM。没有把跨季预览允许写成已经开工，也没有凭这张确认称样课ready。
- CoursePreparationDetails只读捕获payload和公开重匹配对象；Define/sample按所选顺序编号，独立License不猜课程局部编号。本单授权与课程许可进行中/已完成分开，日期只为COURSE_JOBS估计。OpeningObject仍为一张持久图加DOM状态与原生按钮，纯文本保全文；本轮未新增模式实际测试。

## 非阻断艺术残留

R4道具更贴近桌上纸本区域，没有盖住人物头脸或主操作文字；其暖纸材料与室内灯光协调。但底缘与桌面接触仍带贴图层感，局部与袖边/桌物的前后层级仍不够自然，不能称完全融入空间。

教案旁签仍像独立信息牌，人物没有新表演；标题、日期和等待标签重复，长条款及原生选择字段保留表单气质。R3定义尾页的留白也是阅读节奏残留。这些可作为后续艺术润色，不能靠更多发光、缩字或删条款宣称已经解决，也不据插画漂亮推断人类理解或趣味性。

当前源码SHA（后续补正需重读相关行/新实际图）：

```json
{
  "src/ui/course-play.css": "877ff75fd96fdc621446ab47a7dba79cae9ea89e9eda3633bdd32505e6768b04",
  "src/ui/OpeningObject.tsx": "312af7323e41dcbb7c6b1af4f414bfdfabeb4a761d3ba58632637f5c95351d0b",
  "src/ui/CoursePreparationDetails.tsx": "06a6763bbd2dd08dca5f6b36a50a5d4928a04733d527e1dd53091f0a593a39bc",
  "src/ui/OpeningMoment.tsx": "27bdd699feb7755917ce194449d28d6988f36a1caf67dce2838138e68751eea4",
  "src/ui/course-player-thread.ts": "8e573b821738ecc9600ff092cc21da6e5f99bc602ffa71428baf16adb9756620",
  "src/ui/course-scene-progress.ts": "d39323b527e955a6ebb1039338c2eda71a79bb8e98e11510623a3edc26fb2405"
}
```
