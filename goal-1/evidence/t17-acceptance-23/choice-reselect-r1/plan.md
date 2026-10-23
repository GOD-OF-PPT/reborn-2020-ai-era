# 未确认账号重选隔离

当前R6：账号radio经edit写入原A scope草稿，未确认合上后currentTarget仍A，draft.channelId已B；标题与实际原记录分离，重工parser可拒绝。独立模型代理只读确认。

只改VideoSceneChoice及一份新增事件级回归：channelPick单独记录radio预看，明确选择后才chooseTarget(B)并读B槽；合上再打开清未确认预看并保原A所有字段。创建账号原动作仍独立。保原caption/CSS/parser/guard/footer命令与共享12字段cache。

使用正常Create建立两个真实公开账号；纯React hooks/元素handler驱动原组件选择、关闭、重开、确认，禁止请求callback且raw不变。该隔离驱动不运行DOM/effect，不冒充浏览器；先在R6原组件见红，再最小修复见绿。单新case沿默认5秒，不改原任何时限/断言。定向严格类型及源对照后冻结，原生交R7。

不触rules/App/GameTypes/cache/engine/原证据/兼容/Git/浏览器。
