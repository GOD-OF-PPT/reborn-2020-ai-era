# D09 全面检查-debug1 R4记录

R3 current-scenes真实7文件61/61，原417冻结同；R4类型真实0，但仅当时App/MarketChoice，不含稍后整个receipt门槛。R4完整30UI真实214项=211通过/3失败，229.7509秒，完整console/JSON/source与修改前源码均保留。不将旧61或定向23相加称完整通过。

确定源码问题：LI04同幕展开life原册被navigate重置，App openWorkspace捕获并恢复mode及correctpane；未上市/null报价仍讲可用限价，MarketChoice只open+knownprice展示，stockUnavailable阻Place/Plan；App原committedEcho仅挡frame不挡文字，现先非null才创建receipt，scene-result入口也统一同run/新revision/saved/无candidate。不删原命令或权限，原源均保全review-source-r3。

R4三个红结果与修复：
- RiskSceneChoice显示夹具把事实加入同revision，新增全局门槛正确拒绝；改为明确新revision显示夹具，保留全部主体/100元/1点断言，并加同revision不能显示实际支付。仍不冒充真实风险保存。
- relay-scene-result旧“回信优先且不含计量”断言与本任务同时保留实际变化要求冲突；原first/提交/pause/独立回信断言都保留，改计量应同时保留，追加pause一次与各successkind统一保存门槛。原红与源码不改写。
- 新D09 domain人物综合case以单个默认5000ms串行构建四个独立正常人生/导入/执行，在R4实际5016ms超时。R3同case已通过但不据此忽略失败。现按四个独立行为拆为明确拒绝、NPC撤回、已接受后失约、原期限兑现，各自保留原raw、run标识、全部命令/断言/清理和默认5000ms，无增加单项时限/删断言/改业务。它们不是性能基准，不把拆分说成游戏提速。若独立case仍超时，继续诊断，不能标通过。

直接集成验证补入现有真实domain合并与暂停case：savedSceneResult仍含market/eco/life三事实，原暂停一次，不多跑/篡改游戏命令；原domain断言全部保留。新全局类型/完整30UI/20规则保存/生产与Chrome均待新源实际终态，不预判。全部兼容开发测试0，原book两多宽用例暂停。

[杠精审查] 本检查点不因类型绿或独立源审关闭D09；真实旧失败和原字节保留，已确定问题修复后再新轮实际验证。原T17、P1、PNG、真人、M01暂停和T18责任不减。
