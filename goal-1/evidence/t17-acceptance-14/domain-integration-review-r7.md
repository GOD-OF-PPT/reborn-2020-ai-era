D09 回响集成只读复核 R7

观察时间：2026-10-21T12:44:18.856268+00:00。本轮仅读源码和既有结果；没有运行测试、类型检查、浏览器、兼容或修改源码/配置/计划。该文件以 wx 创建，所有物理祖先与 sealed/link 守卫通过。

原确定缺口与当前状态：

- App 原先仅用回调 status=saved 创建文字 receipt，committedEcho 返回 null 只会省略数字帧；SceneEcho 仍显示“已保存”。主控已修：当前 App.tsx:59 在 committedEcho 非 null 后才创建任何 receipt；scene-result.ts:94 也先核同 run、revision 增加、saved、无 candidate，否则只返回中性未核定文字。此处静态确认修复，未冒充修复后运行验证。
- relay-scene-result.test.ts:210—221 原优先级用例仍要求 risk 回信出现时“不含28条原计量”，与本轮同次推进保留 first/risk/relay/domain 的明确合并要求冲突。该旧断言当前未改，主控说明保留原实际红后再补正并追加合并/单次 pause/global guard 用例。本审没有运行它或改写其结果。这是确定的未完成测试约定与覆盖责任，不宣称已修复。

当前 AdvanceTime 静态链没有发现新增漏掉原 first/relay/risk 的确定缺陷：原首单实际收款、首次待亲手提交、已完成 investigate、relayTimeResult、domainSceneResult 都追加进 parts；没有新域提前 return。domain 有实际变化且公开 pause 存在时，domain 尾部保留 pause，旧通用 pause 仅在 !domain 时加入；domain 无变化时旧 pause 仍在，因此此链只加入一次暂停说明。首单等待仅在原状态刚转为 awaiting_submission 时加入，避免沿用旧等待冒充本次新结果。

实际验证范围：

- domain-result-tests-r6：单文件 23/23，exit0，7份 normal 原样本与1份明确隔离 fixture；该23已经包含在下述61内，不能加算成84。正向退出只验证原隔离 fixture 的 helper 文案，不是正常投资正向验收。R1/R2错误前提、R3原18绿及三未覆盖边界、R4四条先红、R5原10000ms hook timeout（23 pending、0断言通过/失败）、R6原时限串行23绿均原样保留，精确分类见 domain-result-handoff-r6.json。
- checks-r3/current-scenes：实际7文件61/61，exit0、metadata/validation errors为空。文件/项数为 NarrativeScene 11、RoomMoment 6、SceneEcho 2、DeepSeek进度6、life进度9、market进度4、domain结果23。该批不含 relay-scene-result.test.ts，也没有直接验证 savedSceneResult 新旧域同时合并的专门用例；不能将61绿扩大成整条集成已全部通过。
- checks-r1/typecheck 实际exit2保留；checks-r2/typecheck 与 checks-r4/typecheck 均实际 npm run typecheck exit0。独立定向 domain-result-types-r5 使用原 tsconfig.app options、仅新两rootNames，0诊断。各次源码身份只按其 source-freeze；主控其后修改 App/scene-result，旧0不能自动证明新字节。
- checks-r4/game-ui：登记30个UI文件，包含原 relay-scene-result 与新 domain 结果；读取时尚无 complete.json 终态，不能声明通过。 原 book-layout 兼容文件不在本次清单。

本次末次读取的源 SHA256：

- src/ui/scene-domain-results.ts: 7eba60f0484eac95b79645b2962564e5eb8f3dc96d1f468d2ed418b79fb7cf89
- src/ui/scene-result.ts: 71748d2c1e4143fc8d21dd72fbf26795e117dd2547f5d59dc03487d3fc90079f
- src/ui/App.tsx: 4ddd19923097fc00630625a92e96f7d0c55042bbe4e29a4a218936ff72215ccc
- src/ui/SceneEcho.tsx: 58a439cbf7f540dfc62d21de638149608394938c32bcecf68b530b4f1c27dd7c
- src/ui/relay-scene-result.test.ts: 040955672b72c0a99c7a66c662ace144fd6d484d63bcd5c11ddc1c570e0d350c

与既有冻结的逐文件桥接（true只表示本次所读该文件原字节同，不扩大为整棵当前源验证）：

```json
[
  {
    "scope": "checks-r2/typecheck",
    "freezeSha256": "b75c7f32cdd484b8e622489aec4e21d167cee27e801ee75884834485c256afe7",
    "matches": {
      "src/ui/scene-domain-results.ts": true,
      "src/ui/scene-result.ts": false,
      "src/ui/App.tsx": false,
      "src/ui/SceneEcho.tsx": true,
      "src/ui/relay-scene-result.test.ts": true
    },
    "frozen": {
      "src/ui/scene-domain-results.ts": {
        "bytes": 25033,
        "sha256": "7eba60f0484eac95b79645b2962564e5eb8f3dc96d1f468d2ed418b79fb7cf89"
      },
      "src/ui/scene-result.ts": {
        "bytes": 10609,
        "sha256": "fe218cfedd1592f9424900bca23b3472511ec82055a3ba9b5198e0362ee8c978"
      },
      "src/ui/App.tsx": {
        "bytes": 29336,
        "sha256": "097f36dac8963654060d6dd61039d88b421fd2e10a2530695584cd8fed2ca13c"
      },
      "src/ui/SceneEcho.tsx": {
        "bytes": 3295,
        "sha256": "58a439cbf7f540dfc62d21de638149608394938c32bcecf68b530b4f1c27dd7c"
      },
      "src/ui/relay-scene-result.test.ts": {
        "bytes": 16718,
        "sha256": "040955672b72c0a99c7a66c662ace144fd6d484d63bcd5c11ddc1c570e0d350c"
      }
    }
  },
  {
    "scope": "checks-r3/current-scenes",
    "freezeSha256": "bf716232fc35f18eac679d4a8507b42ea902b8b44354df81cef7cc29998472b2",
    "matches": {
      "src/ui/scene-domain-results.ts": true,
      "src/ui/scene-result.ts": false,
      "src/ui/App.tsx": false,
      "src/ui/SceneEcho.tsx": true,
      "src/ui/relay-scene-result.test.ts": true
    },
    "frozen": {
      "src/ui/scene-domain-results.ts": {
        "bytes": 25033,
        "sha256": "7eba60f0484eac95b79645b2962564e5eb8f3dc96d1f468d2ed418b79fb7cf89"
      },
      "src/ui/scene-result.ts": {
        "bytes": 10609,
        "sha256": "fe218cfedd1592f9424900bca23b3472511ec82055a3ba9b5198e0362ee8c978"
      },
      "src/ui/App.tsx": {
        "bytes": 29336,
        "sha256": "097f36dac8963654060d6dd61039d88b421fd2e10a2530695584cd8fed2ca13c"
      },
      "src/ui/SceneEcho.tsx": {
        "bytes": 3295,
        "sha256": "58a439cbf7f540dfc62d21de638149608394938c32bcecf68b530b4f1c27dd7c"
      },
      "src/ui/relay-scene-result.test.ts": {
        "bytes": 16718,
        "sha256": "040955672b72c0a99c7a66c662ace144fd6d484d63bcd5c11ddc1c570e0d350c"
      }
    }
  },
  {
    "scope": "checks-r4/typecheck",
    "freezeSha256": "06db772280a90ed09940ea151ec53737d0daa71aba063366241d7f2e78924163",
    "matches": {
      "src/ui/scene-domain-results.ts": true,
      "src/ui/scene-result.ts": false,
      "src/ui/App.tsx": false,
      "src/ui/SceneEcho.tsx": true,
      "src/ui/relay-scene-result.test.ts": true
    },
    "frozen": {
      "src/ui/scene-domain-results.ts": {
        "bytes": 25033,
        "sha256": "7eba60f0484eac95b79645b2962564e5eb8f3dc96d1f468d2ed418b79fb7cf89"
      },
      "src/ui/scene-result.ts": {
        "bytes": 10609,
        "sha256": "fe218cfedd1592f9424900bca23b3472511ec82055a3ba9b5198e0362ee8c978"
      },
      "src/ui/App.tsx": {
        "bytes": 29659,
        "sha256": "94c4f1e997cc5112cee0b4133e9d1935b6720364119bfa26c37aaf63b7a3ace9"
      },
      "src/ui/SceneEcho.tsx": {
        "bytes": 3295,
        "sha256": "58a439cbf7f540dfc62d21de638149608394938c32bcecf68b530b4f1c27dd7c"
      },
      "src/ui/relay-scene-result.test.ts": {
        "bytes": 16718,
        "sha256": "040955672b72c0a99c7a66c662ace144fd6d484d63bcd5c11ddc1c570e0d350c"
      }
    }
  },
  {
    "scope": "checks-r4/game-ui",
    "freezeSha256": "1109c37360405b365f9be40aad0d5957a6e6553c64907c7c2434f8cdd7e988a6",
    "matches": {
      "src/ui/scene-domain-results.ts": true,
      "src/ui/scene-result.ts": true,
      "src/ui/App.tsx": true,
      "src/ui/SceneEcho.tsx": true,
      "src/ui/relay-scene-result.test.ts": true
    },
    "frozen": {
      "src/ui/scene-domain-results.ts": {
        "bytes": 25033,
        "sha256": "7eba60f0484eac95b79645b2962564e5eb8f3dc96d1f468d2ed418b79fb7cf89"
      },
      "src/ui/scene-result.ts": {
        "bytes": 10829,
        "sha256": "71748d2c1e4143fc8d21dd72fbf26795e117dd2547f5d59dc03487d3fc90079f"
      },
      "src/ui/App.tsx": {
        "bytes": 29688,
        "sha256": "4ddd19923097fc00630625a92e96f7d0c55042bbe4e29a4a218936ff72215ccc"
      },
      "src/ui/SceneEcho.tsx": {
        "bytes": 3295,
        "sha256": "58a439cbf7f540dfc62d21de638149608394938c32bcecf68b530b4f1c27dd7c"
      },
      "src/ui/relay-scene-result.test.ts": {
        "bytes": 16718,
        "sha256": "040955672b72c0a99c7a66c662ace144fd6d484d63bcd5c11ddc1c570e0d350c"
      }
    }
  }
]
```

边界：本审是只读静态与证据分层。修复后全局门槛、多域合并、旧 relay断言补正及新当前字节的完整UI/type/build由主控继续核定；不代表Chrome、真人理解、正常正向退出、完整业务/T17/goal、原PNG、兼容或发布通过。未发现需在此轮另开新泛化修缮的确定问题。
