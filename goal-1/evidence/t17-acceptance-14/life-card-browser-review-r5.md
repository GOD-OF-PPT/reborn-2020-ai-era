# D09 生活卡修后实际浏览器证据独立复核 r5

本轮只读原前后PNG、R7 AX、完整journal和原公开导出；没有操作浏览器、执行测试/类型/静态检查、查询几何/尺寸或修改源码。唯一新增文件是本报告。R5原失败人生与R7新正常人生分开保留，没有把旧r3回写、合并或冒充同一run。

## 此具体缺陷的判定

原R5前图有可见邀请文本，原DOM/journal保留该按钮inert、两次预览未响应且仍r3的失败。R7新局正常进入实际邀请后，原时间回响仍在；journal的第一次“核对条款后接受这项约定”操作从无Dialog直接进入同名原确认，observationError=null，现金/日期/保存仍是原r3。life-invitation-accept-preview-r3-ax.txt确有该确认、个人账户、0点和即时¥0，同时明确后续个人¥300/1点/3日与Feb18期限。

因此“同一实际邀请阶段可见按钮却无法打开原确认”的具体功能缺陷在R7这条正常路径已有修后实际证据闭合。这不依赖元素尺寸推断，也不宣称所有后续生活卡/所有人物/兼容场景均已通过。

## 一次真实生活小循环

| 保存提交 | 实际状态 | 现金/行动依据 |
|---|---|---|
| 1 | 2020-01-01，新正常Create | journal：个人可花26,000元 |
| 2 | 明确安排唐萤见面，尚在进行 | journal现金25,800；原job费用200元、1点，完成日Jan4 |
| 3 | Jan4共同活动实际完成，才出现offered邀请 | 首次接受预览不改变版本/现金；原确认明确0即时费用/0点及未来工作 |
| 4 | 玩家明确Accept，仍需另行兑现 | journal现金仍25,800；原档acceptedAt=Jan4，只有一个接受receipt |
| 5 | 另行Fulfill实际开始 | journal现金25,500；原promise_keep费用300元、1点，完成日Jan7 |
| 6 | Jan7原工作实际兑现 | PNG/AX：已保存6、可花25,500、可用2/4、预留0，主标题和时间回响明确实际兑现 |

修后life-fulfilled-r6.png实际显示唐萤与原关系、兑现回响及“完成不会返还行动、增加现金或改变合作权限”，完整记录/年度仍有入口。本轮查看这些可见内容，没有测量页面或切换显示条件。

## 原档交叉依据和观察错误

当前公开原档在随后研究完成后导出为r8（SHA 120c7364b5eb34b4f086ed540e094386f9120c4d14c95bcbece2598f26286895，174052B），并不是不存在的r6独立原文导出。它保留生活截至r6的两项实际完成job与fulfilled约定，receipt顺序为Create→StartLifeWork→Jan4推进→Accept→Fulfill→Jan7推进，之后才是ResearchMarket与Jan8推进。下列原命令ID均唯一；没有以多次确认重复扣费/多次兑现来使结果成立。

journal的若干实际确认/推进之后出现CDP Input.dispatchMouseEvent回包超时或旧selector已不存在；原记录同时保留了新已保存版本/后态，公开原文只有对应的一条原命令。这里将其记作观察层错误，未删除、未把它误判为业务未提交后重复操作，也不报告“全程无工具错误”。

```json
{
  "origin": "normal",
  "schemaVersion": 13,
  "runId": "life-5fedff3b-eda7-46e6-91cc-2b2959ed0085",
  "retainedExportRevision": 8,
  "retainedExportDate": "2020-01-08",
  "recordedExportMatchesActualBytes": true,
  "lifePrefix": [
    {
      "revisionBefore": 0,
      "commandId": "create-c955ef8e-b68a-4f3f-a65e-8e496b50794e",
      "kind": "CreateRun",
      "payload": {
        "backgroundId": "technical_employee",
        "initialStateHash": "a0235bb66f0bdcce40e22eb08a9cd88f82f93ef23a5f33966413de3f62917310",
        "origin": "normal",
        "playerProfile": {
          "approach": "free",
          "wishId": "autonomy"
        },
        "seed": "seed-312c703a-07b0-4f99-b56c-1a8256031101"
      }
    },
    {
      "revisionBefore": 1,
      "commandId": "command-15d57e1a-93ea-4bf0-af7d-32fe27126ec1",
      "kind": "StartLifeWork",
      "payload": {
        "kind": "friend_visit",
        "personId": "tang-ying",
        "reference": null
      }
    },
    {
      "revisionBefore": 2,
      "commandId": "command-8fd20602-23dd-4740-8f8d-d9038b722db1",
      "kind": "AdvanceTime",
      "payload": {
        "date": "2020-01-04",
        "phase": "snapshot"
      }
    },
    {
      "revisionBefore": 3,
      "commandId": "command-a9b6b304-8428-4737-941d-7f2cf383f37f",
      "kind": "AcceptLifePromise",
      "payload": {
        "consent": true,
        "promiseId": "life:41f85a063e4bfab5e46a9eefe283ae77"
      }
    },
    {
      "revisionBefore": 4,
      "commandId": "command-0d5cff84-69dd-468b-8a4a-0b066a815412",
      "kind": "FulfillLifePromise",
      "payload": {
        "promiseId": "life:41f85a063e4bfab5e46a9eefe283ae77"
      }
    },
    {
      "revisionBefore": 5,
      "commandId": "command-460ae720-7211-445d-8cda-b35fca6377f5",
      "kind": "AdvanceTime",
      "payload": {
        "date": "2020-01-07",
        "phase": "snapshot"
      }
    }
  ],
  "kinds": {
    "CreateRun": 1,
    "StartLifeWork": 1,
    "AcceptLifePromise": 1,
    "FulfillLifePromise": 1,
    "AdvanceTime": 2
  },
  "uniqueLifePrefixCommandIds": 6,
  "lifeJobs": [
    {
      "id": "life:c096f81b76463b0d36b15a6410bec371",
      "kind": "friend_visit",
      "personId": "tang-ying",
      "accountId": "personal",
      "startAt": "2020-01-01",
      "completeAt": "2020-01-04",
      "status": "completed",
      "result": "shared_experience",
      "costFen": 20000,
      "actionPoints": 1
    },
    {
      "id": "life:ba888eef650cb483962abbbd97f310a4",
      "kind": "promise_keep",
      "personId": "tang-ying",
      "accountId": "personal",
      "startAt": "2020-01-04",
      "completeAt": "2020-01-07",
      "status": "completed",
      "result": "promise_fulfilled",
      "costFen": 30000,
      "actionPoints": 1
    }
  ],
  "lifePromises": [
    {
      "id": "life:41f85a063e4bfab5e46a9eefe283ae77",
      "status": "fulfilled",
      "offeredAt": "2020-01-04",
      "acceptedAt": "2020-01-04",
      "resolvedAt": "2020-01-07",
      "deadline": "2020-02-18",
      "costFen": 30000,
      "days": 3,
      "actionPoints": 1,
      "sharedJobId": "life:c096f81b76463b0d36b15a6410bec371",
      "completionJobId": "life:ba888eef650cb483962abbbd97f310a4"
    }
  ],
  "marketOrderCount": 0
}
```

本轮只核原文的记录身份、receipt/job/约定与浏览器观测相符，没有执行完整Create重放或新的codec/规则检查；该审核仍由主流程统一承担。

## 明确保留的未完成部分

R7原档market.orders数量为0，原序列仅到公开研究7/8；未包含PlaceStockOrder、PlanStockOrder、真实成交或卖款交收。市场两步Dialog沿用旧页的实际缺陷与后续key={page}修复是另一项责任，本报告不把未跑的市场链说成通过。

本次也不替代NPC自主撤回、其他人物/材料/个人生活、只读/候选失败与原重试、reload持久化、当前最终构建、完整QX或真人理解度/趣味性验收。当前新图/实际链只是唐萤这一条新正常人生；兼容开发/测试仍为0。

## 读取时原证据身份

journal/exports以本轮读取时字节记录，后续若另有追加需保留相应身份，不宣布目录已经封存。

```json
{
  "goal-1/evidence/t17-acceptance-14/chrome-production-r5/life-invitation-r3-first-frame.png": {
    "bytes": 149882,
    "sha256": "0411bd464c1a3693fbef7c14b05eb8fdfaf7f960ae0508e0afc6597fa805010b"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-production-r5/life-accept-inert-r3-dom.txt": {
    "bytes": 4364,
    "sha256": "0e5a5699e49cb7ee36b5f86de49a1458fe0665e9fb6c15a7260156f9b892eb2a"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-production-r7/life-invitation-accept-preview-r3-ax.txt": {
    "bytes": 2141,
    "sha256": "ad4d1f32db3d25ae0943df4b8ef3f2ef419a8c27f122e5eacb9caeaaf64f6fce"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-production-r7/life-fulfilled-r6.png": {
    "bytes": 148622,
    "sha256": "ee6af9948997eb553120ab5d36a943b4fb9c4f2ebbefbf9df360a444ef58e5ca"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-production-r7/life-fulfilled-r6-ax.txt": {
    "bytes": 3467,
    "sha256": "201b5974f4e5c6b46db1d6488fbfaf68c4ae8dee44a6663194028782a44f7ce8"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-production-r7/native-progress.jsonl": {
    "bytes": 20216,
    "sha256": "870753ef40a342cd0e5e7afc0c86e1a914e9de6fbf31ab4cb6907ea7d63a8d1b"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-production-r7/exports.jsonl": {
    "bytes": 470,
    "sha256": "ee82082d7ce83a2049555af204bcf28869153785792e97ce36705c890e744df9"
  },
  "goal-1/evidence/t17-acceptance-14/chrome-production-r7/normal-life-research-r8-before-step-repair.json": {
    "bytes": 174052,
    "sha256": "120c7364b5eb34b4f086ed540e094386f9120c4d14c95bcbece2598f26286895"
  }
}
```

[杠精审查] 用第一次原预览确实打开、后续各保存阶段、实际图片/AX和唯一原receipt共同核定此bug，不以CSS源码或绿色组件测试代替浏览器交互。未把r8后续研究的原文当成r6新导出，也未偷换成市场已完成。
