# S2独立UI关注偏好模块

仅新增src/ui/season-focus-preference.ts和season-focus-preference.test.ts。root22三文件建立并全读后实施；未修改App、continuation、controller、核心/profile/runSchema/rules/contentHash/游戏回执或P3。全部页面兼容开发测试0，未浏览器/Git/全仓测试。

## 确切接口

```ts
SeasonFocusPreference = { version: 1; runId: string; quarter: string; focus: OpeningFocus }
SeasonFocusPreferenceStorage = { getItem(key: string): string | null; setItem(key: string, value: string): void }
SeasonFocusPreferenceScope = { runId: string; quarter: string }
SeasonFocusPreferenceGate = SeasonFocusPreferenceScope & { saveStatus: SaveStatus; hasCandidate: boolean; busy: boolean }
seasonFocusPreferenceKey(runId: string): string
loadSeasonFocusPreference(storage: SeasonFocusPreferenceStorage, scope: SeasonFocusPreferenceScope): LoadSeasonFocusPreferenceResult
saveSeasonFocusPreference(storage: SeasonFocusPreferenceStorage, record: SeasonFocusPreference, gate: SeasonFocusPreferenceGate): SaveSeasonFocusPreferenceResult
```

key为reborn-2020-season-focus-v1:<encodeURIComponent(runId)>，与display/last-life及游戏存档库分离。只存UI版本、run、季度与完整OpeningFocus身份，不存金额、预览、结果、草稿、权限或命令载荷。原文上限16384 JS文本长度单位；严格JSON/字段/联合kind/身份格式，正常季度仅2020—2025的Q1—Q4；同run必符，未来季度拒绝。公开对象存在性及account/business/entityKind/selection关联交给调用者playerThread重匹配，loaded不等于可执行。

load的status为missing、loaded、invalid、unavailable，均有reason/message；loaded有record/raw/quarterStatus(current|previous)。旧季度保持原quarter并给明确说明，不自动改到本季。invalid保raw，不删除、不归一化写回；不支持版本/未来kind、损坏、过长、异run、未来季度均明示。

save的status为saved、blocked、invalid、unavailable、preserved，均有reason/message；preserved带raw。candidate/busy/saving/unsaved/conflict/closed在偏好I/O前阻止写入；稳定read_only允许纯UI偏好保存，仍明确人生只读。save要求record当前run/季度；继续旧对象必须由显式选择构造本季record，不因AdvanceTime改stamp。旧schema合法但公开已失效的身份可由明确重选覆盖；原坏/未来/不支持文本返回preserved，当前窗口仍可保持模型核过的新选择，不增加备份/修复流程。

## App最小接线与风险

- 延迟storage适配器方法内部再访问localStorage；直接把window.localStorage求值当参数可能在进入模块前抛异常。getter/getItem/setItem真实异常已覆盖。
- 仅playing加载，按run/quarter读一次；内存override先按run过滤，不依revision重载。当前App的runId reset effect会清focus，需与加载后的scope选择协调；continuation仍只选人生，不承担关注恢复。
- loaded必须playerThread(p,record.focus,record.quarter)重匹配；previous明确回看/继续，invalid或unavailable不能静默null转另一默认执行对象。已有有效内存关注可保留，否则给显式重选门槛。
- 显选和实际saved新对象后调用save；浏览、打开原册、阅读、普通新消息和AdvanceTime不改关注/quarter。候选与冲突仍显示旧提交。新对象只有提交成功后可写，原retry不执行第二次命令。
- blocked/invalid不得先应用新active focus；saved/unavailable/preserved可保留已显选且模型核过的内存选择，后两者明确只在本窗口。只读用独立偏好notice，不改游戏已保存徽章或启用命令。
- 不在render/useMemo或setState functional updater中写偏好；选择事件/已核保存回调使用独立副作用。偏好异常不走App.fail/setLocalError/controller.notice，不阻断游戏submit或更改回执。

## 验证和剩余责任

npm run test:unit -- src/ui/season-focus-preference.test.ts --maxWorkers=1：1文件9项通过，3.04秒。包括跨run隔离、严格身份/超长/损坏/未知版本种类、1900/2026非法域、旧/未来季度、真实读取getter/安全/配额异常、候选gate、只读偏好、显选替换，以及正常Create上的真实head-write abort→原retry→只读偏好写入，完整游戏导出字节/回执不变。

全项目npm run typecheck退出2，原错保留在typecheck-stdout/stderr：当时App/OpeningMoment/SeasonRecollection还缺season-thread.ts，另RoomMoment.tsx:77有playing收窄比较；未改这些他人文件，未冒充全项目通过。按tsconfig.app原严格选项、仅本两文件及其导入创建TypeScript Program（去掉写build-info的选项）核对，0诊断。两文件哈希与source-index一致。根在S2并行实现接齐后须做最终整体类型/构建及当前窗口实际恢复验证。

[杠精审查] 通过本模块范围：状态/原文/季度/作用域与游戏保存分开，失败不发布候选，不自动覆盖坏偏好；自动测试不冒充真人理解、实际浏览器存储或完整S2验收。
