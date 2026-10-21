# LI-01 具体原工作导航目标修复

本轮仅修改src/ui/SceneJournal.tsx、CinematicRoom.tsx和现有life-scene-progress.test.ts；本说明为唯一新增证据。未修改App/NarrativeScene/game-types/RoomMoment，由父代理统一实施LI-02/目标协议并最终检查。未运行任何测试、静态/类型检查或浏览器，避免与另一个原时限检查争用CPU；没有兼容开发/测试。

## 实际改动

- sceneWorks明确返回SceneWork[]；SceneWork/SceneWorkTarget为类型化原记录保留screen、实际日期/状态/成本及可选accountId/personId/lifeSelection。排序仍是原end/id，不改原工作和账目。
- lifeWorkTarget直接读取原job.accountId/personId/kind：人物工作只在原personId非null时带personId及person模式；个人rest/workspace仅带实际个人模式，不伪造唐萤或其他人物。该纯函数不执行命令、设置日期或新增工作。
- 原operations jobs从对应原business读取accountId；首单回执归原个人账户，原准备/故事工作沿其原accountId。没有缺失business时擅造企业账户。
- SceneJournal当前胶片“走近这件事”及完整原日历各条“查看原工作”均转交真实目标；FirstChapterTrail、全部本季安排出口、空状态、翻页、compact和完整Dialog保留。
- CinematicRoom桌上每条running生活工作复用同一lifeWorkTarget，不再丢失非唐萤人物或个人模式。
- 在原真实正常测试中增加sceneWorks目标断言：实际唐萤/陈屿工作、个人workspace/rest无personId、原首单ops记录账户。没有删除或宽化原断言，仍为原9测试与原每项20秒时限；本次新增断言尚未执行，不能拿此前life-check-r4的9/9冒充本源已通过。

## 仍须主流程验证

父代理扩展NavigateScene并统一lifeMode导航所有权后，实际从先前唐萤/休整模式打开陈屿原工作、个人workspace/rest原工作，核主场景对象/原个人账户一致；另核胶片与完整日历两种入口、取消确认草稿/分页、只读和候选不提交。该验证属于当前功能，不运行尺寸/缩放/跨浏览器/原生离页兼容。

当前14份旧review身份保留；本修复只处理LI-01的源接线，不宣称LI-02或原多Dialog/键盘已体验通过。

## 本次三源实际身份

```json
{
  "src/ui/SceneJournal.tsx": {
    "bytes": 6511,
    "sha256": "f805730c0eecda8ebd1ea6547fe369bbfdfab357c2dfd17894adfc5990aa18ae"
  },
  "src/ui/CinematicRoom.tsx": {
    "bytes": 11820,
    "sha256": "e1c9900e1fd0d5de20b98089e013041cf95bfe6b52fe6ee336dc5308da6803fa"
  },
  "src/ui/life-scene-progress.test.ts": {
    "bytes": 16222,
    "sha256": "460dc6efc09b32f20e99c2ae87e974166697a0172e63d87cdfb0a664737a3757"
  }
}
```

[杠精审查] 限定实现交回：目标从原job/business读取，未仅在默认唐萤上换标签，个人模式不带伪人物；两种具体日历路径均接线。全局类型、原时限测试和当前Chrome待父代理统一实做，未把源码自检当运行验收。compatibilityDevelopmentTests=0。
