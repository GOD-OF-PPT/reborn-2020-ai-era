# U6 场景文案与 Today 选择：限定验证

当前问题是主幕、阶段签、物件与按钮反复解释同一件事；打开生活预看还会提前替换原书签。本组将常驻阅读改为短情境、短动词与必要数字，完整解释继续留在原手记/原确认，并让新生活关注只在原保存成功后发布。仍是原U6第10项的一个内部组，不代表整个游戏文案、美术或U6完成。

## 最终实现与来源

最终431/969份冻结输入，10 owned源（5产品5测试），以原416/967为底，只覆盖明确UI源，不带工作树P3。其余959份原输入不变。产品为App、CinematicRoom、OpeningMoment、TodayScene与scene-language：32个阅读短名、45个阶段短名，未知/动态业务文案原样保留，不按长度截断。短名进入可访问名称开头，完整原名留作语义说明；资金、日期、AP、身份、风险和拒绝原因没有靠AX或裁切隐藏。

首单主幕区分报价、拟制作投入、实际0付款/0占用、预留、已付、确认收入、实收与净额；长版firstOrderFacts仍在手记。仅sceneMeaning已确认同id/唯一公开个人rest/workspace、running/completed的job可用一条日期/实付/已用行动/中断不退或无收入的事实句；人物、未知、失效、中断及强制责任沿原完整显示。标题与物件不把安排当实际完成。

Today预看个人生活/模拟选择不再调用onPrepare(free)。只有原五类显选安排可登记下一关注；所有原request/preview/确认/command/store/重试均保持。CinematicRoom捕获原controller/runtimeSession、完整原view/features、kind/payload、focus/Today及阅读context；同原下一次已保存对象、当前view、无候选/只读/忙才换UI关注。新读处、外部阅读epoch、Root后续鼠标/键盘或运行会话变化退休旧回调；原独立App确认和自动候选处理仍可接原retry。原业务保存不会因UI退休取消。

Core、规则、钱、日期/AP、RNG、权限、codec/存储、依赖、CSS、图/声均0变更。最终业务Worker仍938836B/SHA968363c0d0025db3c5d9699dc79f1ed8e41e5ec6d7804e48c2adefe1a34de2ed，逐字节同416/397。

## 工程与边界

431类型207263ms、构建6147ms通过，六个完整文件29/29功能补验通过。新测试使用正常Create、原Controller/codec与fake IDB真实head.put后abort/原retry，另核取消、读处变化、运行会话、Root鼠标/键盘和外部阅读context；不冒Native故障注入。427四文件21/21、429三文件16/16分别保其输入身份，不相加成一套最终全批。

本组功能补验明确串行、testTimeout60000/hookTimeout180000；未改仓库原测试配置。原R418/R420的7个5秒时限红，以及Today-relay初始化20秒导致8项未执行仍保，未计为通过。早期真实文字定位、旧手工React缺ref驱动、错误改到未变化近景的断言、类型输入过窄等失败全部留原报告；修后当前相关断言通过，不倒改原输入来消红。旧405/410时限与长档慢、原global docs红及P3正式62/22本轮未跑仍保。不称一次默认全批绿、性能通过或真人理解/趣味/美术认可。

## 当前 Chrome 实际经历

扩展断开后采用Chrome原生App，同当前窗口检查，未改尺寸/缩放/浏览器。截图见本会话工具返回，未另存新PNG，不把它们当原三PNG。

独立5533从空列表正常Create新1（Jan1/26000/AP4），核首单短报价/0实付/0占用/两截止日，信件直达原答复并取消，手记长版及Esc回原焦点；0额外新1业务命令。与以下旧94分支不拼一局。

原94从封存reader94-final413-unchanged.json经原文件入口、检查与确认导为独立人生。预看生活取消再回书签，在421下错误回空日历；426后真实回同一closed分账，日期Apr1/94/企业0/AP2保。之后实际原确认休整0/1点，保存95后才转新job；原Clock经96/Apr3、97/Apr5、98/Apr8才完成，现金276280.55/AP1保持，完整原文下载native98.json：1224642B/SHA12d872932c4cd1dbb6a96619f7808db16a8fdf187c0266836cd3eae65d9495ca。codec往返原文、原94 receipts前缀/run/seed/actor/controlled accounts全等。

最终431从同98重进，再显选workspace3000/1点/7日：真正99保存才跟新workspace，现金273280.55/AP0，房间仍普通；原100/Apr10、101/Apr15推进后才换改善住处、标题、纸件与完成事实。原AP与费用不返、不新增收入，0AP仍可等原反馈。native101.json实际由原UI下载，1237468B/SHAe8e8f6eb235a2ccc4bbdaf501768ab8afcf9ed571e7a2a8f0bbcaf69f5c2aec1，完整codec原文往返同、原98 receipts前缀同、现金恰少3000、workspace completed及scene.workspaceCompleted实际为true。原94→101是同run连续7条新增Native Core（2生活+5原时间），不是正常董事417或主129。两次等待各一次原确认，内部真实保存日期全部保，未跳结算。

Main5415最终431实际重进原129，Oct1/270137.33/AP4/预留0/2812股/已改善住处仍在。原UI真正导出main129-after431.json，1317268B/SHA82f3147aa4684334f032886300292fd906050af25e873c1ded5a69c87b5621e7，全部字节与原qa129-before408.json一致；0Main新业务Core/导入/设置/季度书签选择。263HTTP文件逐字同，430的249非index资产保（416的236亦保），新index原子替换、旧index两份备份可回退。

最终原Main阅读层全合、工作/休整enabled、server97290留运行。仅自有QA标签已实际关闭、20885 exit130，5533两人生DB和原档保；用户新标签/Main保。所有页面兼容开发/测试0，未启动M01。

## 保留责任与回滚

本组不结束完整U6原17动作/5共享/正常board/全深态/最终全审。417仍固定416、同原305规范输入与v2策略继续，不能重启/换seed/改钱或封存活输出。后续仍U7/U8→C-UX12完整U4-B/U5/U6，U9后原组合、T17余；原PNG0/3、真人0、P3正式62/22未跑、M01待明确恢复、T18最后、整个goal ACTIVE。

UI可按本组精确owned提交回退；Main仅恢复本组备份index并保所有旧资产，不触游戏DB/用户存档/其他WIP。原48旧完整封存加417诊断一份、P326/132markers/2links、旧19/35、input61B、未接线model及三master原前缀/插入持续保护。REPEAT复用既有冻结/封存/来源核验工具，无缺失的高置信度全局资产需要新建；未写全局memory/skill/自动化。

[杠精审查] 本片短文案、真实代价/等待/保存、取消/返回/原回调所有权有据成立；未删原合法动作或字段，没有裁切/缩字/滚动藏操作。原未验与外部标准保持。本地owned提交和逐blob/模式读回另记，不push/部署/外发或委派。
