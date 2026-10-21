# 当前财务原文独立审核 R1

限定审核发现缺口，见下方errors；不得视为通过。

读取current-finance-plan.md、finance-complete-r1.json及本轮T11格式财务报告，逐16原文按包含末尾LF的原文件核SHA；只为严格codec往返去掉工具追加的单个传输LF。F03/F05使用createCourseFixture对应codec，正常S02使用createCampaignCodec，没有用默认campaign codec迁移fixture。专用fixture工厂仅构造codec上下文，本审核未执行send/evaluateCommand、正常Create/前史/长矩阵、浏览器或任何页面兼容测试，也未改生产源码。

F03窗口起点2000000分，不等于fixture最早Create的1955000分；差额来自原付费前史。其200人/20退款/180保留、两段原收入引用与实际退款、5%原费及窗口成本独立核定。F05窗口现金0不等于赠送付费资产：原前史另存；其半交付释放保护后实际花200000分启动七日刷新，仍running，不冒充完成。两fixture无生活/玩家工资/雇员工资/公司维护窗口，不能拿其利润当正常开局收益。

正常S02是normal-course-s02-v1的两背景，非P3的t16-campaign-0。真实公司账户与个人分开，实际个人转入2000000分不是收入；20原视频身份、两段/原支持和一名实际补支持、退款窗后关闭均保留。36笔salary是玩家工资，不是雇员工资；本两局没有雇员，因此不能拿本证据声称验证员工计薪。关闭快照Apr16公司现金2800359分，与final Jun30的2770359分相差后续三次10000分维护，不混称同一日期。

本审核逐完整命令回执与snapshot前缀核对，不是再次执行这些命令。没有独立从Create重跑F03/F05/S02；其本轮实际执行来自finance-complete-r1的0/0终态及原collector，当前审核补充正确codec、原文字节和账务一致性。此结果不代表Chrome真实退款/原生abort、原378、真人、兼容或P4/5b整体完成。

以下是实际审核字段、全部16含LF原文引用及缺口，供独立读回：

```json
{
  "scope": "Independent readonly evidence/codec/accounting review; no business command evaluation or normal Create/prefix/matrix/browser execution. Fixture factories instantiate their original codec context only.",
  "collectorExit": {
    "wrapper": 0,
    "driver": 0
  },
  "collectorSourceBindings": 349,
  "driverFrozenSources": 358,
  "sourceMismatches": [],
  "frozenMismatches": [],
  "rawSnapshots": 16,
  "snapshotBytes": 7537123,
  "report": {
    "file": "current-course-finance-r1/t11-course-evidence.json",
    "bytes": 135544,
    "sha256": "a80c6c080612fa44b9e4f0968f60773ecf39354c01d2a088a411b8604ef3b4e6"
  },
  "rows": [],
  "rawRefs": [
    {
      "file": "t11-f03-prehistoryInitial.json",
      "bytes": 6503,
      "sha256": "0675e4e02c4758c8b7437b2aa8faa511ac2efae38f98eb4f9ac9f983baf2e9ce",
      "stage": "prehistoryInitial",
      "origin": "fixture",
      "revision": 1,
      "date": "2020-01-01",
      "cohortMoneyChecks": 0
    },
    {
      "file": "t11-f03-initial.json",
      "bytes": 105878,
      "sha256": "21c9161abbeccc20a56aee1ed17a8d7461fcfd35d989f0aca1e8c843bf67471e",
      "stage": "initial",
      "origin": "fixture",
      "revision": 21,
      "date": "2023-01-01",
      "cohortMoneyChecks": 0
    },
    {
      "file": "t11-f03-prepayment.json",
      "bytes": 335952,
      "sha256": "3fc81d406c6e964eb6dfd0fc8c166edc27eff673b16addbc719f6b2624bb195e",
      "stage": "prepayment",
      "origin": "fixture",
      "revision": 27,
      "date": "2023-01-22",
      "cohortMoneyChecks": 1
    },
    {
      "file": "t11-f03-half.json",
      "bytes": 347775,
      "sha256": "28261615a33666cd6b43648dc7d3826946ba241ab5fdfaec95e96c2a4686da99",
      "stage": "half",
      "origin": "fixture",
      "revision": 29,
      "date": "2023-01-31",
      "cohortMoneyChecks": 1
    },
    {
      "file": "t11-f03-final.json",
      "bytes": 380940,
      "sha256": "b3583f4143ad8dde79166c83087e81e63d2be3f934c56f21729f4bf0699e83c9",
      "stage": "final",
      "origin": "fixture",
      "revision": 33,
      "date": "2023-04-16",
      "cohortMoneyChecks": 1
    },
    {
      "file": "t11-f05-prehistoryInitial.json",
      "bytes": 6497,
      "sha256": "25482c7dfcbbac7d26e152a6756cb2ad3a1a7e82229d85805a90d55ed1097ee0",
      "stage": "prehistoryInitial",
      "origin": "fixture",
      "revision": 1,
      "date": "2020-01-01",
      "cohortMoneyChecks": 0
    },
    {
      "file": "t11-f05-initial.json",
      "bytes": 145562,
      "sha256": "863c8a728fcbef3f507192aafabba9a605f720af4635aa2a0957673b04fef2d2",
      "stage": "initial",
      "origin": "fixture",
      "revision": 24,
      "date": "2023-01-01",
      "cohortMoneyChecks": 0
    },
    {
      "file": "t11-f05-final.json",
      "bytes": 200834,
      "sha256": "5ae06544b65d76ebfe7dc45012db4da89316a3537900916c3b384889cb2620a2",
      "stage": "final",
      "origin": "fixture",
      "revision": 30,
      "date": "2023-01-12",
      "cohortMoneyChecks": 1
    },
    {
      "file": "t11-s02-technical_employee-initial.json",
      "bytes": 143483,
      "sha256": "17c2fc2509a6c07ec54caae9406bdf34bda7d3a70a3472353aebf1793135c092",
      "stage": "initial",
      "origin": "normal",
      "revision": 1,
      "date": "2020-01-01",
      "cohortMoneyChecks": 0
    },
    {
      "file": "t11-s02-technical_employee-sliceInitial.json",
      "bytes": 838859,
      "sha256": "edd40b9b6e9f60da7d34034de2e47e573d960ed580a363acf3b03731d4fdd083",
      "stage": "sliceInitial",
      "origin": "normal",
      "revision": 68,
      "date": "2023-01-01",
      "cohortMoneyChecks": 0
    },
    {
      "file": "t11-s02-technical_employee-closed.json",
      "bytes": 991517,
      "sha256": "684c04138129a342624d698aedb43d036706b548d08974a2b437e5a49c84fb73",
      "stage": "closed",
      "origin": "normal",
      "revision": 85,
      "date": "2023-04-16",
      "cohortMoneyChecks": 1
    },
    {
      "file": "t11-s02-technical_employee-final.json",
      "bytes": 1030235,
      "sha256": "990bb7bc618f6c9b3ed7da1aa1475cadbb6563c870443e4f9e9468e8742152d0",
      "stage": "final",
      "origin": "normal",
      "revision": 86,
      "date": "2023-06-30",
      "cohortMoneyChecks": 1
    },
    {
      "file": "t11-s02-content_employee-initial.json",
      "bytes": 143469,
      "sha256": "fba5f2b12d8a7f18e97c6eeda5650e0f98c9b947486af66c07ba89d632a85465",
      "stage": "initial",
      "origin": "normal",
      "revision": 1,
      "date": "2020-01-01",
      "cohortMoneyChecks": 0
    },
    {
      "file": "t11-s02-content_employee-sliceInitial.json",
      "bytes": 838575,
      "sha256": "28ffdd97ebe0e1f91ddc43807ea119d45016206957cd701cc3ee8183c7700a15",
      "stage": "sliceInitial",
      "origin": "normal",
      "revision": 68,
      "date": "2023-01-01",
      "cohortMoneyChecks": 0
    },
    {
      "file": "t11-s02-content_employee-closed.json",
      "bytes": 991165,
      "sha256": "f8ac2a47f300a271920714fbb1702b865775a2a53271f504d8ec15ec34682f22",
      "stage": "closed",
      "origin": "normal",
      "revision": 85,
      "date": "2023-04-16",
      "cohortMoneyChecks": 1
    },
    {
      "file": "t11-s02-content_employee-final.json",
      "bytes": 1029879,
      "sha256": "57682609d1cc5d68e34bfd4a4b2d0fa99a5e12af600c8d1c390d923c8b0ecfe9",
      "stage": "final",
      "origin": "normal",
      "revision": 86,
      "date": "2023-06-30",
      "cohortMoneyChecks": 1
    }
  ],
  "errors": [
    {
      "case": "F03",
      "error": "Error: FIXTURE_PAYROLL_ASSUMPTIONS_CHANGED"
    },
    {
      "case": "F05",
      "error": "Error: FIXTURE_PAYROLL_ASSUMPTIONS_CHANGED"
    },
    {
      "case": "S02-technical_employee",
      "error": "RuleError: ACCOUNT_NOT_FOUND"
    },
    {
      "case": "S02-content_employee",
      "error": "RuleError: ACCOUNT_NOT_FOUND"
    }
  ],
  "passed": false
}
```
