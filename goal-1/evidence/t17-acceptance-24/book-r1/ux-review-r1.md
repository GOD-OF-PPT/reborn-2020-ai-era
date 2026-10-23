# 唯一待许可接续：只读复核

结论：拟修合理，是同一已选课程内的确定案例接续；保持以下边界，不会破坏shared slot/onInspect。未修改源码、运行测试或浏览器。

当前确定问题：CourseSceneChoice.tsx:140对missingLicense过滤后的数组用index+1编号；原course.cases为手工1/授权video2时，唯一video被误称案例1。当前activate:113把rights-required落到record，许可入口在记录之后，根Chrome观察需翻页2才看到。翻页位置由根实测提供，此次未代验画面。

最小修缮：

1. 仅无显式intent、current.kind为course且确有该course、contextReason/invalidReason/historical均无、progress.phase为course-rights-required、公开missingLicense恰1时，激活同时设置licenseCase完整kind/id与page=license。不得改current target、onTarget、资金、资源、开工日或提交命令。缺失/不公开来源不猜case；多个许可仍明确显选。
2. 按course.cases（selectedCases）原顺序findIndex(sameCase)+1统一按钮与许可页编号；许可页同时显示该case的公开label，不能仅泛称这份案例。不要用全局v.cases位置或许可实体不存在的caseKind。
3. 维持courseDraftCommand:67–71公开同business/同case/同course校验、既有planned/running/completed许可不重复安排；submissionLock、readonly/candidate/冲突、原预览与确认均保留。直接打开编辑页不代表已授权。

共享草稿核对：Choice:106–107许可槽仍为license:<kind>:<完整id>、courseId:null，run/account/business不变；setLicenseCase和setPage在下一次render一起切到对应槽，须不清空旧稿。Choice:116编辑页inspect传current course和slot；Panel:38–42按known prefix切完整ID、核同course case后读相同槽，并定位原case行，所以现有桥接自然适用，无需造尚不存在licenseId。明确intent仍原路径；合上再开复用槽；失效或旧sample attempt继续门槛，不自动更换对象。

验收界限：单缺video案例2显示正确编号/公开标签，直接见资源日期且尚未提交；两项缺许可保持显选；同slot已有未来资源日期不变，原册往返仍同稿；保存失败仍旧场景，现有许可不得重复。这些是修后需根定向/实际Chrome核对的预期，本次只读不能宣称已过。

复核读取身份：

```text
src/ui/CourseSceneChoice.tsx 28054B SHA256 a26856c7d7db997a5a062f1bd5724baa395e466c39349071a8784538073bae58
src/ui/CoursePanel.tsx 47741B SHA256 3874c2cb4810a35e238122cfede959135b32b267dbc26a87d69cf2ceb10ce9eb
src/ui/course-scene-progress.ts 32624B SHA256 d39323b527e955a6ebb1039338c2eda71a79bb8e98e11510623a3edc26fb2405
src/ui/course-scene-draft.ts 2954B SHA256 12773457d1229761de3003d614e289b1469d6198c2269c293565f0119fd92ef3
```
