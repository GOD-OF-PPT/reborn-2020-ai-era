# 当前财务原文独立审核 R2｜保留首轮错误后的补正

限定审核通过，未发现原财务证据缺口。 首轮R1原文件未修改：其中fixture零金额维护记录被误当有费用，以及在正常Create快照查询尚未开立的公司账户，均属审核器假设错误，不是已证的游戏财务错误。本轮按真实非零操作/原账户开立与sliceInitial核定，保留全部原错误。

16份snapshot逐文件保留末尾LF核SHA；严格导入仅移除工具追加的一个传输LF。F03/F05采用原createCourseFixture专用codec，默认campaign codec实际拒绝它们；S02两背景采用正常createCampaignCodec。全部原款/阶段退款引用与现金/保护/四点经只读helper及独立余额公式核对，完整命令及snapshot前缀仅比原回执，不重新执行。349份collector源码绑定与358份driver冻结在前后均无漂移；原16文件及叶集合保持。

F03是无生活/工资/实际维护费用的独立财务fixture：最初fixture现金1955000，原付费前史后窗口初现金2000000。原200人、20全额退款398000、180未退款helped、收入3582000/成本1279100/利润2302900/期末4302900/保护0，全部分开于正常局。零金额维护metadata确实保留，operationId=null，没有伪造为已付费用。

F05同属fixture：原340000起始及真实已付资产前史后窗口现金0；半交付后预款500000/收入500000、实际200000刷新费后现金800000/保护500000/可花300000。Jan12—19刷新仍running，未来Apr1自答疑仅planned/预留2AP，不声称已完成。

两正常S02是normal-course-s02-v1，而非P3 seed0。公司账户在原Create之后实际开立，个人真实转入2000000不计收入，没有虚构Create时已有公司余额。每局20名原视频学员、1名真实补支持、Apr16关闭、退款/预款责任结清；final Jun30的公司2770359比关闭时2800359少三次10000维护。技术/内容个人现金分别12790000/5590000；各36笔玩家salary实际到账，金额分别28800000/21600000，没有雇员/worker wage，不能据此声明员工计薪已验证。

本次不是正常Create/前史或长矩阵重跑；fixture工厂仅为取得对应codec构造原上下文，没有send/evaluateCommand。没有浏览器、原生保存abort、兼容或生产源码修改，不把此层等同P4/5b/T17/goal完成。

实际核定数值、16个含LF引用及首轮错误身份如下：

```json
{
  "passed": true,
  "scope": "Readonly snapshot SHA/strict codec/financial review; no business command replay, normal Create, matrix, Chrome or compatibility execution. Exact fixture codec factories constructed their own fixture context only.",
  "priorFailedReview": {
    "file": "current-finance-independent-review-r1.md",
    "bytes": 7961,
    "sha256": "bebf9fdf870c4a72405710edce24549f308009e3ec032167be9355aaa334fc8a",
    "status": "retained_failed_audit_assumptions",
    "corrections": [
      "Zero-amount maintenance metadata is not paid maintenance expense.",
      "The normal initial Create has no future company account; use the real sliceInitial account and verify original later opening/owner transfer."
    ]
  },
  "collectorExit": {
    "wrapper": 0,
    "driver": 0
  },
  "sourceBindings": 349,
  "driverFrozenSources": 358,
  "beforeDrift": {
    "collector": [],
    "driver": []
  },
  "afterDrift": {
    "collector": [],
    "driver": []
  },
  "snapshots": 16,
  "rawBytes": 7537123,
  "financialReport": {
    "file": "current-course-finance-r1/t11-course-evidence.json",
    "bytes": 135544,
    "sha256": "a80c6c080612fa44b9e4f0968f60773ecf39354c01d2a088a411b8604ef3b4e6"
  },
  "rows": [
    {
      "id": "F03",
      "origin": "fixture",
      "rulesVersion": "rules-t11-fixture-v1",
      "seed": "course-fixture-v1",
      "snapshots": 5,
      "recordedCommands": 32,
      "windowSource": "initial",
      "windowDate": "2023-01-01",
      "windowCashFen": 2000000,
      "finalDate": "2023-04-16",
      "accountId": "personal",
      "cashFen": 4302900,
      "heldFen": 0,
      "availableFen": 4302900,
      "metrics": {
        "incomeFen": 3582000,
        "costFen": 1279100,
        "profitFen": 2302900
      },
      "prepaidFen": 0,
      "recognizedIncomeFen": 3582000,
      "students": 200,
      "refundPeople": 20,
      "refundFen": 398000,
      "helpedRetained": 180,
      "closedAt": "2023-04-16",
      "feeFen": 179100,
      "playerSalaryPayments": 0,
      "playerSalaryCashFen": 0,
      "employeeWagePayments": 0,
      "maintenanceRows": 4,
      "paidMaintenanceRows": 0,
      "maintenanceCashFen": 0,
      "windowCashDelta": 2302900,
      "defaultCampaignRejection": "RuleError: INCOMPATIBLE_RULES_VERSION",
      "originalFixtureOpeningCashFen": 1955000,
      "quarters": [
        {
          "quarter": "2023-Q1",
          "spent": 4,
          "reserved": 0,
          "actionIds": [
            "crs:4094f32c899ed3b42521af1a0815aa1e",
            "crs:504a47b966410cbb7d1029eccdd37006",
            "crs:5cb357738e5ed2cbe1df6a477256f099",
            "crs:b172b30f16c290d2159effb967fba6e7"
          ]
        },
        {
          "quarter": "2023-Q2",
          "spent": 1,
          "reserved": 0,
          "actionIds": [
            "crs:f03eda6bd41b3a79c6d3b63632cc9e6e"
          ]
        }
      ],
      "refunds": [
        {
          "people": 20,
          "undeliveredFen": 0,
          "deliveredFen": 398000,
          "operationIds": [
            "crs:f872577e687445cec3572dfa96f6477a",
            "crs:2509fc21dd2de0a7455a5dad9c6c246d"
          ]
        }
      ]
    },
    {
      "id": "F05",
      "origin": "fixture",
      "rulesVersion": "rules-t11-fixture-v1",
      "seed": "course-fixture-v1",
      "snapshots": 3,
      "recordedCommands": 29,
      "windowSource": "initial",
      "windowDate": "2023-01-01",
      "windowCashFen": 0,
      "finalDate": "2023-01-12",
      "accountId": "personal",
      "cashFen": 800000,
      "heldFen": 500000,
      "availableFen": 300000,
      "metrics": {
        "incomeFen": 500000,
        "costFen": 200000,
        "profitFen": 300000
      },
      "prepaidFen": 500000,
      "recognizedIncomeFen": 500000,
      "students": 20,
      "refundPeople": 0,
      "refundFen": 0,
      "helpedRetained": 0,
      "closedAt": null,
      "feeFen": 0,
      "playerSalaryPayments": 0,
      "playerSalaryCashFen": 0,
      "employeeWagePayments": 0,
      "maintenanceRows": 1,
      "paidMaintenanceRows": 0,
      "maintenanceCashFen": 0,
      "windowCashDelta": 800000,
      "defaultCampaignRejection": "RuleError: INCOMPATIBLE_RULES_VERSION",
      "originalFixtureOpeningCashFen": 340000,
      "refresh": {
        "status": "running",
        "startAt": "2023-01-12",
        "completeAt": "2023-01-19"
      },
      "supportJobs": [
        {
          "status": "planned",
          "startAt": "2023-04-01",
          "completeAt": "2023-04-15",
          "actionPoints": 2,
          "costFen": 0
        }
      ]
    },
    {
      "id": "S02-technical_employee",
      "origin": "normal",
      "rulesVersion": "rules-t16-journey-v1",
      "seed": "normal-course-s02-v1",
      "snapshots": 4,
      "recordedCommands": 85,
      "windowSource": "sliceInitial",
      "windowDate": "2023-01-01",
      "windowCashFen": 1982259,
      "finalDate": "2023-06-30",
      "accountId": "ops:410a7bc61916ad67229d817efdd2079a",
      "cashFen": 2770359,
      "heldFen": 0,
      "availableFen": 2770359,
      "metrics": {
        "incomeFen": 1998000,
        "costFen": 1209900,
        "profitFen": 788100
      },
      "prepaidFen": 0,
      "recognizedIncomeFen": 1998000,
      "students": 20,
      "refundPeople": 0,
      "refundFen": 0,
      "helpedRetained": 20,
      "closedAt": "2023-04-16",
      "feeFen": 99900,
      "playerSalaryPayments": 36,
      "playerSalaryCashFen": 28800000,
      "employeeWagePayments": 0,
      "maintenanceRows": 7,
      "paidMaintenanceRows": 7,
      "maintenanceCashFen": 67741,
      "windowCashDelta": 788100,
      "actualAccountOpeningOperation": "ops:86562eccde768766a1243fc32ac11b5c",
      "ownerCapitalFen": 2000000,
      "initialCompanyAccountPresent": false,
      "playerFinalCashFen": 12790000,
      "companyCashAtClosed": 2800359
    },
    {
      "id": "S02-content_employee",
      "origin": "normal",
      "rulesVersion": "rules-t16-journey-v1",
      "seed": "normal-course-s02-v1",
      "snapshots": 4,
      "recordedCommands": 85,
      "windowSource": "sliceInitial",
      "windowDate": "2023-01-01",
      "windowCashFen": 1982259,
      "finalDate": "2023-06-30",
      "accountId": "ops:410a7bc61916ad67229d817efdd2079a",
      "cashFen": 2770359,
      "heldFen": 0,
      "availableFen": 2770359,
      "metrics": {
        "incomeFen": 1998000,
        "costFen": 1209900,
        "profitFen": 788100
      },
      "prepaidFen": 0,
      "recognizedIncomeFen": 1998000,
      "students": 20,
      "refundPeople": 0,
      "refundFen": 0,
      "helpedRetained": 20,
      "closedAt": "2023-04-16",
      "feeFen": 99900,
      "playerSalaryPayments": 36,
      "playerSalaryCashFen": 21600000,
      "employeeWagePayments": 0,
      "maintenanceRows": 7,
      "paidMaintenanceRows": 7,
      "maintenanceCashFen": 67741,
      "windowCashDelta": 788100,
      "actualAccountOpeningOperation": "ops:86562eccde768766a1243fc32ac11b5c",
      "ownerCapitalFen": 2000000,
      "initialCompanyAccountPresent": false,
      "playerFinalCashFen": 5590000,
      "companyCashAtClosed": 2800359
    }
  ],
  "files": [
    {
      "file": "t11-f03-prehistoryInitial.json",
      "bytes": 6503,
      "sha256": "0675e4e02c4758c8b7437b2aa8faa511ac2efae38f98eb4f9ac9f983baf2e9ce",
      "origin": "fixture",
      "revision": 1,
      "date": "2020-01-01",
      "strictCodec": "createCourseFixture"
    },
    {
      "file": "t11-f03-initial.json",
      "bytes": 105878,
      "sha256": "21c9161abbeccc20a56aee1ed17a8d7461fcfd35d989f0aca1e8c843bf67471e",
      "origin": "fixture",
      "revision": 21,
      "date": "2023-01-01",
      "strictCodec": "createCourseFixture"
    },
    {
      "file": "t11-f03-prepayment.json",
      "bytes": 335952,
      "sha256": "3fc81d406c6e964eb6dfd0fc8c166edc27eff673b16addbc719f6b2624bb195e",
      "origin": "fixture",
      "revision": 27,
      "date": "2023-01-22",
      "strictCodec": "createCourseFixture"
    },
    {
      "file": "t11-f03-half.json",
      "bytes": 347775,
      "sha256": "28261615a33666cd6b43648dc7d3826946ba241ab5fdfaec95e96c2a4686da99",
      "origin": "fixture",
      "revision": 29,
      "date": "2023-01-31",
      "strictCodec": "createCourseFixture"
    },
    {
      "file": "t11-f03-final.json",
      "bytes": 380940,
      "sha256": "b3583f4143ad8dde79166c83087e81e63d2be3f934c56f21729f4bf0699e83c9",
      "origin": "fixture",
      "revision": 33,
      "date": "2023-04-16",
      "strictCodec": "createCourseFixture"
    },
    {
      "file": "t11-f05-prehistoryInitial.json",
      "bytes": 6497,
      "sha256": "25482c7dfcbbac7d26e152a6756cb2ad3a1a7e82229d85805a90d55ed1097ee0",
      "origin": "fixture",
      "revision": 1,
      "date": "2020-01-01",
      "strictCodec": "createCourseFixture"
    },
    {
      "file": "t11-f05-initial.json",
      "bytes": 145562,
      "sha256": "863c8a728fcbef3f507192aafabba9a605f720af4635aa2a0957673b04fef2d2",
      "origin": "fixture",
      "revision": 24,
      "date": "2023-01-01",
      "strictCodec": "createCourseFixture"
    },
    {
      "file": "t11-f05-final.json",
      "bytes": 200834,
      "sha256": "5ae06544b65d76ebfe7dc45012db4da89316a3537900916c3b384889cb2620a2",
      "origin": "fixture",
      "revision": 30,
      "date": "2023-01-12",
      "strictCodec": "createCourseFixture"
    },
    {
      "file": "t11-s02-technical_employee-initial.json",
      "bytes": 143483,
      "sha256": "17c2fc2509a6c07ec54caae9406bdf34bda7d3a70a3472353aebf1793135c092",
      "origin": "normal",
      "revision": 1,
      "date": "2020-01-01",
      "strictCodec": "createCampaignCodec"
    },
    {
      "file": "t11-s02-technical_employee-sliceInitial.json",
      "bytes": 838859,
      "sha256": "edd40b9b6e9f60da7d34034de2e47e573d960ed580a363acf3b03731d4fdd083",
      "origin": "normal",
      "revision": 68,
      "date": "2023-01-01",
      "strictCodec": "createCampaignCodec"
    },
    {
      "file": "t11-s02-technical_employee-closed.json",
      "bytes": 991517,
      "sha256": "684c04138129a342624d698aedb43d036706b548d08974a2b437e5a49c84fb73",
      "origin": "normal",
      "revision": 85,
      "date": "2023-04-16",
      "strictCodec": "createCampaignCodec"
    },
    {
      "file": "t11-s02-technical_employee-final.json",
      "bytes": 1030235,
      "sha256": "990bb7bc618f6c9b3ed7da1aa1475cadbb6563c870443e4f9e9468e8742152d0",
      "origin": "normal",
      "revision": 86,
      "date": "2023-06-30",
      "strictCodec": "createCampaignCodec"
    },
    {
      "file": "t11-s02-content_employee-initial.json",
      "bytes": 143469,
      "sha256": "fba5f2b12d8a7f18e97c6eeda5650e0f98c9b947486af66c07ba89d632a85465",
      "origin": "normal",
      "revision": 1,
      "date": "2020-01-01",
      "strictCodec": "createCampaignCodec"
    },
    {
      "file": "t11-s02-content_employee-sliceInitial.json",
      "bytes": 838575,
      "sha256": "28ffdd97ebe0e1f91ddc43807ea119d45016206957cd701cc3ee8183c7700a15",
      "origin": "normal",
      "revision": 68,
      "date": "2023-01-01",
      "strictCodec": "createCampaignCodec"
    },
    {
      "file": "t11-s02-content_employee-closed.json",
      "bytes": 991165,
      "sha256": "f8ac2a47f300a271920714fbb1702b865775a2a53271f504d8ec15ec34682f22",
      "origin": "normal",
      "revision": 85,
      "date": "2023-04-16",
      "strictCodec": "createCampaignCodec"
    },
    {
      "file": "t11-s02-content_employee-final.json",
      "bytes": 1029879,
      "sha256": "57682609d1cc5d68e34bfd4a4b2d0fa99a5e12af600c8d1c390d923c8b0ecfe9",
      "origin": "normal",
      "revision": 86,
      "date": "2023-06-30",
      "strictCodec": "createCampaignCodec"
    }
  ],
  "errors": []
}
```
