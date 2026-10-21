# D11 原对象导航实际缺陷与修缮增量 R9

结论：当前R9导航改动限定静态通过，新增实际画面/AX证明视频原作品卡与课程原定义已到达目标页；查看后的完整视频存档与输入逐字相同。本审未发现新的确定规则、权限、保存或导航阻断。R7原报告保留旧观察身份，其“当时未发现源码阻断”不能代替后来真实两次复现；以下新增事实纠正此前对自动定位可靠性的判断，不覆盖旧报告。

本审只读当前源码、冻结/原运行报告、原文、日志并查看已有两张PNG；没有运行新测试、浏览器、几何/兼容、服务、stage或commit。只在项目父目录guard通过后wx新建本文，旧报告/源/三文件不变。HEAD仍351f2f588c70aacdf8cd241e9599a81a6e1f6316；当前生产由根交回为R9 .delivery/t17-interaction-r9／5328。

## 原缺陷与最小修缮

- R6恢复后两次实际打开目标，虽然已选第二账号，原册仍page1且目标focus ID为空；原自动targetLink.current.click()会遇原ScreenBook将offpage链接inert而不派发点击。R6早先page4日志、SSR中的href/选中账号、旧PNG或静态检查不足以证明可靠自动定位。原video-exact-work-stable图/AX和全部旧记录保留。这个缺陷属于本轮承诺的同对象导航，不能以“查看没改钱”代替修复。
- R7→R8仅3份生产文件：ScreenBook、VideoPanel、CoursePanel。两panel调用revealBookTarget(from,id)，该函数向from最近.screen-book派发book-reveal-target，脱离inert链接click。书册只处理事件目标为自身、detail字符串且target实际在本book-flow中的请求；打开祖先details，用原bookPageCount/bookPageAt/turn定位，保留可见手动链接与原modifier/defaultPrevented边界。只读导航不调用request、preview或业务命令。
- R8课程目标在details展开后栏目才稳定，第一次定位仍可能沿关闭前页。R8→R9恰只ScreenBook：打开祖先details后用两次requestAnimationFrame等待原测量状态提交，再复用revealTarget。新请求先取消原pending frame，effect卸载取消，执行前重新核target连接且仍在本flow。原children保持挂载，草稿不卸载；tabindex/inert原值记录及恢复、手动翻页、页码夹取/原焦点逻辑保留。
- 不改布局或兼容政策：R7—R9的CSS、book-layout、尺寸/GAP、字体、分页策略均原字节。没有通过全局去inert、自动滚动、裁切、缩字或执行命令来制造定位成功。core/application/content/persistence/schema、依赖、原金额/AP/日期/授权/原子Session未变。既有CoursePreparation与保原册白名单／候选重试行为仍保持R7身份。

## 源码与技术结果

source-freeze-r9.json共376项，SHA256 79ae1a4b8ce60ce604ccc8d98e30af79e9f80688c2a284803429bd78f7c7b0ae，本审逐项重算漂移0。相对R8只有ScreenBook变，其他375项逐字相同；相对R7生产变更完整为上述三模块。原R7的13源码列表之外新增ScreenBook导航diff，不谎称旧生产构建可完全覆盖新导航。

R8构建exit0；R9 build记录原npm run build（tsc -b && vite build）实际exit0。build-r9说明onlyScreenBook的两帧修缮；构建不是浏览器或全规则通过。navigation-tests-r11为R8：5文件29过、exit0，不回写成R9执行。navigation-tests-r12.json已出现实际终态exit 0。原输出尾部：

>  RUN  v5.0.5 /Users/gordon/githome/reborn-2020-ai-era
> 
> 
>  Test Files  5 passed (5)
>       Tests  29 passed (29)
>    Start at  07:27:18
>    Duration  24.59s (tests 83%, import 12%, transform 5%)

原R3/R4/R7/R9/R10各测试、失败/timeout、20秒hook及精确重试的14未选身份仍按final-evidence-review-r7保留；本审不重跑、不加总为新的累计总数。原503/超时后的已有报告按原wx保留，未重写旧件。

## 实际画面、AX、原档与焦点边界

浏览器动作由根代理执行，本审仅检查留档：

1. r8-video-target-visible.png实际显示“作品、人工核对与交付”、作品1原卡、Jan2—Jan9日期与原“推进到本项制作完成／中断此制作”等操作，第4/6页。配对AX保留第二账号“当前作品 · 街角短片”已选、原账号“日常记录”仍可选及该作品内容。不是此前停在介绍页的video-second-channel-target.png。
2. 恢复后原journal两条记录明确首账号切换已成功，并重新读到原账号IDvid:e94b0536859ba339da4456c052a05f41、revision4；不重发旧超时业务。后续公开产品完整导出video-view-only-r4.json为173390B，SHA256 ec935f6771e60d72d205fada6ea3f4280de28d970acc8647e076e2f0c2d66b5e，本审与two-channel-prefix-text-before-import.json直接Buffer比较完全相同。该后导出是新增product结果，原input仍是buffer，二者不混称两个独立人生。
3. R9 r9-course-target-stable.png/AX/journal实际是课程64、Dec9、原“用已付案例定义一门新课”details已展开，第4/5页，课程名称／形式／主题表单在目标页。没有自动创建课程、招生或扣款；journal仍revision64。原R8课程图/AX保留旧身份，不替代最终R9图。
4. **只确认目标页到达，不声称目标元素已聚焦。** 当前focus空ID，不能把journal旧action中的“and focus confirmed”当成目标ID验证通过。本轮原书册焦点可用；可见原卡及定义的到达由PNG+AX+页码证明。没有新增目标焦点矩阵或兼容检查。

两份图片仅证明当前实际画面与对应状态，不证明真人理解、趣味或其他尺寸。R6课程60→64、真实License99→100保草稿／仅原册dialog1、只读物理63与原Activate disabled及Node真head.put abort5项等仍沿原r7报告限定身份，不因导航修缮被重复计验。

## 复用完整Create字节审核的限度

full-create-audit-r1原实际exit0、11份原文（4buffer/7product）、3Create/165uniqueCommands、全部byteEqual仍保留。125项引擎审核sourceHashes与当前逐项相同；本次新增video-view-only-r4与已审核的原buffer逐字同，所以可以桥接该存档的同一Create字节结果，无需声称又跑了审核器或增加一次新Create。它不验证新导航UI本身，也不替代新的图片/AX/交互事实。

## GJ / REPEAT 与剩余范围

[杠精审查] 限定通过：承认并保留前次静态/SSR未能检出的真实自动定位问题；修在原分页导航层，保留原长内容、所有操作、全账号与草稿、原guard及失败候选。用最终真实目标卡/已展开定义与后导出核验，未把空ID说成focus通过。

[REPEAT] 复用ScreenBook已有锚点揭示、原测量和事件生命周期、原browser_evidence_guard／freeze／raw hash审核，不新造第二分页器、全局去inert工具、业务API或兼容流程。

本增量不关闭T17/goal、原5c六身份/288核心/62关键/22例行或其他后续。真人0、原PNG及M01/T18保持责任；兼容开发/测试、geometry、切尺寸/zoom、跨浏览器、原生离页专项均0。不push/deploy。最终R12终态和资料/封存/真实Git提交由根代理负责。

## 本次关键身份 SHA256

| 文件 | SHA256 |
|---|---|
| src/ui/ScreenBook.tsx | 28ae3b773855a59341b53359e15cc374bd587c81cf6117401f996591004c3ab8 |
| src/ui/VideoPanel.tsx | 995c18c4a6a7dd3df458560cc58a362dd63ad2e90a61a4468c1ceea58331bb0d |
| src/ui/CoursePanel.tsx | ee661891173e548cd3f356774ec7f06ad0ac2e4c033ef04e072065657842ce05 |
| final-evidence-review-r7.md | c6ff5ee5730b3467020b8e33ef2ab8e9cdea07ad47430e47732b5281cee8698f |
| native-followup-r6/chrome-production/r8-video-target-visible.png | c4d7d85c0ac73e26ee00c2b54cac9cebf4e9180132124dc47ba243d5ced22fae |
| native-followup-r6/chrome-production/r8-video-target-visible-ax.txt | 72cd8de85c44b28813351abd0fcf3cf04657dbcc77e94836e961bd7f8d0ac4e0 |
| native-followup-r6/chrome-production/r9-course-target-stable.png | deafea2673578baf9349450e9ecca3f1486811c5d77fa11fb4864d8d4b6d9977 |
| native-followup-r6/chrome-production/r9-course-target-stable-ax.txt | 15488c5eaf1cc973a1be6c8690f24afe8037428fd130eb7e04ed3776d58aeb61 |
| native-followup-r6/chrome-production/video-view-only-r4.json | ec935f6771e60d72d205fada6ea3f4280de28d970acc8647e076e2f0c2d66b5e |

本文写前后376冻结项、上表原件、三文件、旧报告与本次读回的既有结果均不变；root16父guard通过后唯一wx新写。
