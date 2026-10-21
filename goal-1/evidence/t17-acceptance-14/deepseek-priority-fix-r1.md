# DS 阶段优先级修复交回

仅按主控授权修改原两份新DS源码；未改接线/CSS、规则、输入或旧报告，未提交。旧r3源码和测试各另wx保存，字节均匹配当时r3 freeze；market-independent-review-r1.md保留发现身份。

先新增真实原流程回归：原邀请已尽调、原旧条款到期后，按合法不同terms再启动一份实际谈判；默认焦点应为当前terms与真实completeAt，原邀请仍可选但不active。另核实际签约后默认持仓不会被原邀请抢占。r4实际5过1红，失败正是invitation优先于running terms，未用伪造投影制造此缺陷。

修复为：同一邀请有closedAt null、未expired且当前未过expiresAt的原negotiation，或已有真实agreement时，原邀请保留所有资料和entityIds但active=false。已完成未回应的terms仍是当前决定，不自动签约/改变允许的其他原条款选择。

jobFacts同时明确为“任务基础成本/AP；原工资、维护和其他已承诺的支持另列”，并继续区分planned原预留、running实际进行、取消/中断已花成本。没有把固定基准当全部项目成本，也没有改金额或行动规则。

修后r5定向仅本文件实际6/6通过、exit0、两份源freeze未变。原费用、逐阶段收入、锁定/跟投原不付款、手选股数后转让应收、事务abort/同候选retry仍全过。其他检查/浏览器/完整正常Create审计留父统一，兼容开发测试0。

```json
{
  "sources": [
    {
      "path": "src/ui/deepseek-scene-progress.ts",
      "bytes": 19852,
      "sha256": "553c721abe79b9b2c02ab48be954a56a1ed0b0e9ad29bfb3097888f4ca65e2a6"
    },
    {
      "path": "src/ui/deepseek-scene-progress.test.ts",
      "bytes": 13531,
      "sha256": "5b18d1f359077064335d43813b3667427b5d49cb9907afc283790dbd91e77b92"
    }
  ],
  "originalR3Preservation": [
    {
      "path": "deepseek-source-r3.ts.txt",
      "sha256": "531ce989b1197fa491daf9e4fe85b5e9080e5f4260b6aa5319d5bbe9f7352803",
      "matchesR3": true
    },
    {
      "path": "deepseek-test-r3.ts.txt",
      "sha256": "424be6a5eebcf62fac8dd9b68f64170092f676c3ae45b05d55982f3422321f19",
      "matchesR3": true
    }
  ],
  "rounds": [
    {
      "round": 4,
      "code": 1,
      "sourceChanged": [],
      "finished": "2026-10-21T11:44:19.040Z",
      "tests": 6,
      "passed": 5,
      "failed": 1
    },
    {
      "round": 5,
      "code": 0,
      "sourceChanged": [],
      "finished": "2026-10-21T11:45:21.810Z",
      "tests": 6,
      "passed": 6,
      "failed": 0
    }
  ]
}
```
