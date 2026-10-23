# 未确认账号重选修复交回

R6确定P2：账号radio通过edit写原A草稿，未确认合上后A实体仍在，草稿channelId已B且client/cohort清空；重开混用B标题与A对象，原返工可被parser拒绝。R6源和handler级红完整保留。

最小修复：独立channelPick只预看，不写原草稿；明确确认才chooseTarget，读取对应B槽；重开丢弃未确认pick、A完整草稿保持。创建动作、12字段memory、展示caption/CSS、parser、guard、footer命令与原confirm流程均保留。唯一生产文件VideoSceneChoice；另新增VideoSceneChoice.reselect.test。

最终5/5（新handler case＋4纯Map），严格类型0，准确源见final-source.json/source/。R1真实bug红和R2 strict新test初值红保留；未放宽默认5秒或旧任何时限/断言。全部检查终态日志齐。

测试使用实际正常Create/两次原OpenVideoChannel，输入客户/cohort仅未提交UI草稿，不证明其业务合法；驱动真实React组件的handler与状态槽，未运行DOM/effect/鼠标。覆盖预看/关闭/重开/确认B、A/B两槽与raw不变，不能替代根R7原生复验。R6源424对照只有VideoSceneChoice变化，其余字节/mode同；原规则/P3保留，Git/兼容/浏览器0。
