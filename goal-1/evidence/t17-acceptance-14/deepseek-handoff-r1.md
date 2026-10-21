# D09 DeepSeek当下抉择交回

已在全读root14 input/plan/tasks后，仅新增两份UI源码/测试；未改NarrativeScene、RoomMoment、App、scene-result、CSS、核心规则、配置或依赖，未提交。兼容开发/测试0。

## 接口

export deepseekSceneProgress(deepseek,date,preferredId?)返回null或DeepseekSceneProgress：phase/title/line/choice、source（ecosystem或counterfactual-equity）、active/priority/publicDueAt、nextDate、entity（kind/id/businessId/accountId）及entityId/entityIds/entityIndex。首选真实公开记录ID；无效preferredId回到当前排序；无记录给opening且active=false，不自动开企业/开启架空。

默认active先于历史，优先到期原回款、明确跟投期限和待提交/拒绝等责任，随后实际工作、未到期应收、已知准备/客户事项。锁定无当前决定和纯历史active=false，原历史仍可通过entityIds选择；真实未结预款/应收/应付不因已完成/取消合同丢失。父组件按runId重置选择，RoomMoment只在active时提升全局焦点。

只有三类固定且公开的原简单命令：SubmitEcoDelivery(contractId)、CollectEcoReceivable(deliveryId/amountFen)、CollectEquityExit(exitId/amountFen)，confirm=false沿原Panel规则，不新增额外确认。收款仅到期且remaining>0，按钮明确本笔原金额，预览/原子保存仍由父原CommandButton拥有。其他choice均原选择入口，尤其不自动签署融资、跟投、输入股数/金额、选资源/日期/scope或扩大权限。

尽调/谈判/退出/治理先检查实际job状态及report/response/resolved日期<=当前date，尚在planned/running时不叙述预冻授权、融资意愿、买方或价格；不读actual隐真相、未来报价或随机。元数据nextDate仅原未来日期；父仍须playableAdvanceDate与原AdvanceTime屏障。

## 实际定向验证

仅运行新增文件一次次定向测试，最终r3为5/5、exit0且两源冻结未变。案例包括正常新局实际Controller查看无架空开启；隔离原合同实际生产/提交/客户复核80%/实际支持20%/到期收款；原条款/锁定/跟投0付款；原买方工作/手选50,000股后真实Session到期收款；真实head.put成功后abort保持旧可见原场景/物理档，再retry同字节候选。

DeepSeek复杂路径采用既有明确隔离fixture（固定结果和资金），不能称为本轮正常2020全Create或真人/浏览器验收。一个冻结报价压力例是明确有界display projection，不保存、不冒充正常campaign。正常当前schema13实际原档路径和完整Create审核仍由主控统一收集。

r1的4红是测试错误地把不存在的optional command键与显式undefined做toMatchObject；改为独立toBeUndefined，没有放宽无命令要求。r2余1红是测试把已经到期的生产应收误当作未到期；改为明确选实际尚未到期的support原应收，再按真实dueAt收款，没有改生产/支持日期、金额或helper。红输出/元数据及当时原测试快照保留，两个红源SHA均匹配原freeze。

类型、全suite/全部UI、接线、场景美术、浏览器、完整Create审核、独立后续复核未由本子任务完成；不能把5项测试扩为D09/T17/整体完成。

## 源码与实际轮次

```json
{
  "sources": [
    {
      "path": "src/ui/deepseek-scene-progress.ts",
      "bytes": 19448,
      "sha256": "531ce989b1197fa491daf9e4fe85b5e9080e5f4260b6aa5319d5bbe9f7352803"
    },
    {
      "path": "src/ui/deepseek-scene-progress.test.ts",
      "bytes": 12151,
      "sha256": "424be6a5eebcf62fac8dd9b68f64170092f676c3ae45b05d55982f3422321f19"
    }
  ],
  "rounds": [
    {
      "round": 1,
      "code": 1,
      "sourceChanged": [],
      "finished": "2026-10-21T11:34:02.347Z",
      "tests": 5,
      "passed": 1,
      "failed": 4
    },
    {
      "round": 2,
      "code": 1,
      "sourceChanged": [],
      "finished": "2026-10-21T11:35:15.055Z",
      "tests": 5,
      "passed": 4,
      "failed": 1
    },
    {
      "round": 3,
      "code": 0,
      "sourceChanged": [],
      "finished": "2026-10-21T11:36:13.183Z",
      "tests": 5,
      "passed": 5,
      "failed": 0
    }
  ],
  "preservedRedSources": [
    {
      "path": "goal-1/evidence/t17-acceptance-14/deepseek-red-r1.test.txt",
      "bytes": 11723,
      "sha256": "e4c4df898ddc45924f9307fa2616b41ac57deb9e66f0f859fbebe205ebc667a7",
      "matchesOriginalFrozenTest": true
    },
    {
      "path": "goal-1/evidence/t17-acceptance-14/deepseek-red-r2.test.txt",
      "bytes": 12130,
      "sha256": "bfa726169387969ca5c06d23078f16420cec46975a2a5c54812cab4d03a347f7",
      "matchesOriginalFrozenTest": true
    }
  ]
}
```
