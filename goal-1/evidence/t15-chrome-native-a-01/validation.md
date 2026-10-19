# Chrome原生补验：已推进，T15/C15仍待两项实际结果

用户已完成Chrome连接，本次实际使用extension/browser3新建的两个验证标签：生产5237/tab387926830，开发5238/tab387926837。旧Chrome不可用的审计仅保留历史事实；其requestedGoalStatus没有在用户新环境到来后执行，不作为当前阻塞。仍沿A长日重启，只做T15，不进入T16。

## 实际已取得

- 生产正常技术新局life-6835362e-ac19-4cd1-8d7d-0fe920389f96，种子t15-chrome-native-zoom-tech-1，2020-01-01/26000元/4点/保存1；[原导出](chrome-zoom-tech-before1.json)。
- 开发正常内容新局life-fea9b8fe-7986-402f-a08e-b5695dd2f0af，种子t15-chrome-native-leave-content-1。真实确认个人3000元/1点/7日改善工作环境后head.put成功再abort，旧1/26000元/4点/普通房间保留、付费动作停止。候选单独导出为未保存2；不是退款或免费工作。
- [完整正常前缀审核](replay-audit-01/chrome-prefix-audit.json)实际0：10份可见UI导出从完整创建身份/版本/命令前缀逐字重放，5个不同StartLifeWork命令为同一旧1上的真实未保存替代分支，**不是五次已提交采购**。四份旧物理/已保存导出SHA均fd73a5cfacc54825f92726e1f85000f09f03aa224000adab95484356178bd45f，原生刷新后仍逐字同旧1。
- [完整性快照](integrity-observation-01.json)核对294运行源未变、生产36资源HTTP==原固定build02，以及原始截图SHA。本轮未改游戏、内容、规则、素材、版本或依赖，未重跑未改的500/60并冒充新执行。

## 原生离页：真实事件已见，取消尚未通过

实际Chrome捕获Page.javascriptDialogOpening，type=beforeunload、hasBrowserHandler=true，随后Page.javascriptDialogClosed result=true：[首次事件](native-stay-opening-events.json)、[关闭](native-stay-follow-events.json)、[立即取消尝试](native-cancel2-immediate.json)、[同源location.reload](native-cancel3-script-navigation.json)、[正式Tab.reload/getJsDialog接口](native-cancel4-highlevel-api.json)。过滤事件均hasMore=false/truncated=false。

准确结论是：导航在工具能够完成取消前已经被接受，**响应方尚未核定**，不能用“接受离开”证明“留在页面”。getJsDialog未给出活动对象；处理取消曾返回No dialog is showing，或Raw CDP is unavailable while Browser Use is resolving a paused document response。保留原始结果，不绕过该边界、不关闭保护、不把应用退出框代替原生提示。文件名native-stay-dialog-tab.jpg是当时的尝试标签；实际截图显示接受离开后的入口，**不是原生提示截图**。

现已备好第五个未保存分支：[候选2e](chrome-dev-candidate2e-before-manual.json)，SHA0703250575b30eec28dc4d22f72e2fa1e86fb43e211ec7fb78331c86f3182165，旧1[再次物理读回](chrome-dev-old1-before-manual.json)仍fd73同。人工观察起点[事件游标264](manual-native-observation-start.json)已记录。异步问题请用户在该DEV标签用Chrome刷新并实际选择留在；只有核对真实关闭false、候选原字节同与后续离开/旧档结果后才能关闭此门槛。若提示被自动放行/未出现，应如实保留未通过，不要求用户勾成功。

## 原生200%：仍未通过

[实际Chrome环境](actual-browser-environment.json)的原始只读Runtime报告UA Chrome155/MacIntel。Page.getLayoutMetrics.cssVisualViewport.zoom最后观察为1、scale1；页面CSS zoom为1。Playwright Meta+Equal和Cua super+plus未改变原生zoom，不能算200%。曾为桌面基线使用1280×720布局viewport覆盖，随后[调用reset](viewport-restored-native-baseline.json)；它不作为原生200%证据。DPR、截图尺寸和布局视口分列，不从其变化推断原生缩放。

[Chrome协议定义](https://raw.githubusercontent.com/ChromeDevTools/devtools-protocol/master/json/browser_protocol.json)把VisualViewport.zoom定义为CSS到设备独立像素的page zoom factor；后续以原始字段和实际浏览器操作核对，不使用CSS zoom/Emulation pageScale等伪造。异步问题请用户把生产验收标签的Chrome菜单设200%。在取得实际2.0与当前页面操作/金额/期限/焦点等结果前，不判此项通过。

## 美术、工具错误与证据边界

[Chrome正常住处](chrome-normal-tech-room1.jpg)已实际目检，保持A场景/光色/层级，HUD与主CTA可见；header按钮右边最大1228.81<1280。没有为测试加产品面板，也没有新增美术缺陷的实据。照片均为工具返回的原始PNG/JPEG，未裁剪/缩放；转场截图或工具可见区域与布局尺寸可能不同，不能充像素精确窗口/菜单图。真实200%仍是桌面待验，美术持续优先、移动专项最后M01。

Chrome Playwright操作出现CDP dispatch/evaluate超时，原操作有时已生效；每次先查真实状态，成功的导出/游戏命令没有因超时重复。后改用当前可见AX控件及原生只读Runtime读取产品textarea，完整长度/原字节校验，未读取隐藏框架对象或注入游戏状态。Browser.getVersion在该通道不受支持，版本只按实际UA报告，不推断完整OS版本。所有工具失败与不同原生响应分列，不算游戏规则已失败或原生门槛已成功。

[杠精审查] 已验证子范围通过；T15整体待验：未把Chrome连接、原生opening事件、真实离开后旧档或Node回放冒充两项门槛完成。用户手动结果尚未核实，本次原生结果快照不包含未来操作。后续若当前目录已提交，新实际产物须用新目录并重新绑定现场，不向已提交journal追加。

完整24季度/结局、原PNG0/3、真人0、移动末位M01和最终review/候选继续待办。无真实支付/交易/模型、远端推送或部署。当前goal保持active，本轮只为T15阶段检查点，不勾T15/C15。
