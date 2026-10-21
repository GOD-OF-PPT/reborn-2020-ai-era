# D09 生活邀请卡不可操作修缮只读审查 r4

本轮查看父代理指定原PNG、语义DOM与journal，并读取相关CSS及原分页实现。未修改源码/测试/配置/冻结计划，未执行测试、类型/静态检查或浏览器操作；未查询尺寸/边界/几何或开展兼容检查。唯一写入为本新报告。当前完整UI R7由父代理原进程处理，本轮未接管、重启或并行新增检查。

## 原实际缺陷证据

原life-invitation-r3-first-frame.png中可见唐萤邀请、接受与婉拒入口、原费用300元/1点/3日及2020-02-18期限；画面为2020-01-04、可花25,800元、行动3/4、已保存r3，尚无接受确认弹窗。这里核对可见内容与交互状态，没有测量画面几何。

life-accept-inert-r3-dom.txt保留同一邀请/当前页的语义button。该文件本身不是完整属性导出，不能单靠AX条目证明inert值；原native-progress的“actual visible invitation cannot be clicked before repair”观察明确记录接受button含inert，两个仅预览点击没有打开Dialog、日期/现金/保存版本仍为原r3。父代理另行原只读属性检查给出inert/tabindex-1。本轮没有重复点击或另创业务提交。

原r3已保存raw的公开状态只读提取如下，仍是实际共同活动完成后的offered，未接受/未兑现：

```json
{
  "origin": "normal",
  "revision": 3,
  "date": "2020-01-04",
  "schemaVersion": 13,
  "lifeJobs": [
    {
      "kind": "friend_visit",
      "personId": "tang-ying",
      "status": "completed",
      "startAt": "2020-01-01",
      "completeAt": "2020-01-04"
    }
  ],
  "lifePromises": [
    {
      "personId": "tang-ying",
      "status": "offered",
      "acceptedAt": null,
      "completionJobId": null
    }
  ]
}
```

## 修缮源码判断

旧single-screen.css生活专用scene-action>button / scene-choice规则设置min-height155、height:auto；其life层级specificity高于后来通用88px决策卡最低高度。内容与回响在同幕更新后，该额外空白最低高度仍会影响原分页对完整控件的可操作性判断。原ScreenBook要求当前页完整可用的控件才解除inert，不能把文本可见等同于按钮可交互。

scene-encounters.css末尾新增完全对应的生活专用selector，设置min-height:0；与原life selector同specificity，src/main.tsx又在single-screen/scene-decisions之后加载该文件，因此当前规则覆盖旧155最低值。原height:auto、真实内容与确认链继续保留，最小高度不再人为撑出空白。

该新增规则只触及生活scene-action按钮与scene-choice的最低高度，没有增加媒体规则、缩字、固定max-height、裁切、隐藏文本或滚动。原encounters中的说明仍为14px/1.85，原分页、章节、全部原册、键盘与inert守卫未修改；Wait卡自己的结构也未被这个selector改写。

源码修正针对这条已发现的当前正常游戏功能问题，方向符合保留完整文字和原页内互动的要求。没有发现这项CSS增量新增的确定源码缺陷。

## 修后Chrome仍待验证

本轮没有新的修后图片或点击，不宣称接受按钮已恢复可操作。新生产资源实际加载后，应在同一原r3人生核：接受/婉拒原邀请可操作、先核对未来费用/AP/期限、取消仍r3、明确接受后才新rev且0即时费用/0点、另行兑现才付300元/1点，原分页与全部文字仍可到达。不得重复此前已完成的见面，也不得将旧R5截图或组件测试当作修后点击证据。

## 读取时的原字节身份

原journal是本轮读取时快照，后续若父代理另有追加，保留各自原身份，不据此宣布该目录封存。

```json
{
  "src/ui/scene-encounters.css": {
    "bytes": 6174,
    "sha256": "17842be4137cee90ff0d5f52a61935075b0447296e2f9d6269d9d5e9a2f38ec6"
  },
  "src/ui/single-screen.css": {
    "bytes": 26893,
    "sha256": "50ff0d09ba4ee2d642a053766ed1bd902c034536c8774b69d0776042c81110e2"
  },
  "src/ui/scene-decisions.css": {
    "bytes": 10358,
    "sha256": "3772f90ee195d1753bb044a8cb78b2e0fd38e6f51a2a0423d966edb6eb05ca22"
  },
  "src/ui/ScreenBook.tsx": {
    "bytes": 9000,
    "sha256": "9ec810b63bc6d67831f145ea0b172ebc427d65ee90b629fc75d1da16d56a48f9"
  },
  "src/main.tsx": {
    "bytes": 1049,
    "sha256": "331a6646e19a3ef5bd78a2ed6ebcfcafcbf9f65895ce999139ce818d7c8b58fc"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-production-r5/life-invitation-r3-first-frame.png": {
    "bytes": 149882,
    "sha256": "0411bd464c1a3693fbef7c14b05eb8fdfaf7f960ae0508e0afc6597fa805010b"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-production-r5/life-accept-inert-r3-dom.txt": {
    "bytes": 4364,
    "sha256": "0e5a5699e49cb7ee36b5f86de49a1458fe0665e9fb6c15a7260156f9b892eb2a"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-production-r5/native-progress.jsonl": {
    "bytes": 12369,
    "sha256": "7c700f1a3bfc303b2bdb41fdfabc4047d76ddb5fa0085c79e3731e233272c51b"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-production-r5/life-original-r3-before-card-repair.json": {
    "bytes": 154648,
    "sha256": "80fa935e2793eadca279f88fb7c5552fa7111c5c7c210b7f2691c382dee9f66b"
  }
}
```

[杠精审查] 已区分实际旧画面/原行为观察、CSS级联与待验的新Chrome行为；没有通过去掉原inert守卫强行点击，也没有把功能修缮扩大成兼容工作。原失败证据保留，compatibilityDevelopmentTests=0。
