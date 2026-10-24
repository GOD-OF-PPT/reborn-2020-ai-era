U1 root28三文件已建立。授权实现窄共用动作binding及有意义回归，owned src/ui/CommandButton.tsx、ClockAdvance.tsx和新的shared-action.ts(若必要)/对应测试。建议可选children renderAction，输出同一binding给主按钮+物件；旧默认渲染与Clock Space/已知支出/先核对合同保留。绑定activation重核同run/revision/currentsnapshot和save/candidate/readonly，原App.request不改。不要改OpeningMoment(由root集成)、业务core、其它文件/masters。请尽快给使用接口并实施。所有兼容测试暂停，别跑book-layout。

接口补充：Root将新增OpeningAttemptAction桥接组件，renderprop用你的CommandButton/ClockAdvance.binding将main+OpeningObject共用activation。请现在告知精确renderAction callback类型，Clock需可给reviewNode保持先核对。意图用mainline opening-attempt.ts API action union。UI choose callback root将使用你shared-action guard可复用；请导出makeSharedAction(p,label,activate,..)或告诉明确API。无需改既有Spacehandler。

布局补充：接口确认。Clock renderAction会包整个room section+object，原div.clock-advance若继续包会影响布局；请renderAction分支root为div.shared-clock-action style={{display:'contents'}} ref={root}，默认原clock-advance DOM不变。返回mainNode保持.command.clock-main>button，root整幕可query；root桥接会把reviewNode+mainNode包原clock-advance clock-advance-room仅用于main按钮区域。Spaceeffect源码保持。

最终布局补充原话：
复核发现Clock的display:contents wrapper仍打断opening-room>.opening-object direct-child CSS，会在planned/running等态丢物件定位。请改更小接缝：CommandButton新增可选rootRef:Ref<HTMLDivElement>传给原div；Clock main CommandButton接rootRef={root}，默认clock outer不再ref(无DOM结构变)，renderAction分支直接return main，不新增wrapper。Space原effectquery '.clock-main>button'从main根仍能匹配其button。请用定向回归确认默认/bridge DOM和shared binding；旧Spaceeffect源码不动。
