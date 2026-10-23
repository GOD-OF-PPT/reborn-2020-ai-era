# invalid-existing模块防线交回

只改season-thread.ts与season-thread.test.ts。seasonFocusAfterSave在任何candidate推断前，以previous公开playerThread核existing；若invalid则返回同existing引用。这样shape合法但业务错绑/账户或种类错位/缺失对象不会被旁路真实保存自动修复或换成新关注，须由正式UI显选。无新增规则/钱/AP/游戏raw/时限。

新增测试实际正常Create→StartFirstOrder生成manual-content业务→独立偏好解析loaded但个人market entry错绑该business被public-invalid→实际PlaceStockOrder保存成功→helper仍toBe(existing)、当前public仍invalid、读后游戏导出不变。原默认5秒/maxWorkers=1精确项1/1过，11 skipped；严格TS0。before/after源hash相同，结果和命令见各json/txt。未跑全仓/浏览器/兼容/Git，不代替App最终运行或Chrome。

源码现冻结。R1旧模型原文与独审R1未改；根App全局gate/SceneJournal同对象导航另由根修改验证。
