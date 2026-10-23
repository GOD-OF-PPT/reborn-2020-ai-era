# S3-V1 Chrome原文审核调用准备

状态：只完成准备。未运行verify_normal_browser_exports、codec导入、Create回放或任何游戏命令；未改共享工具/源码，未运行Git、浏览器或兼容检查。根稍后实际审核授权到达前不执行下列命令。

## 1. 最小记录合同

在root23的直接子目录chrome-<名称>/中保存exports.jsonl。工具只扫描第一层以chrome-开头的真实目录并按目录名排序；仅有exports.jsonl的目录参与。每行一份完整JSON记录，最小必须登记file、origin、source、bytes、sha256五字段。file为同目录单一ASCII文件名，匹配^[a-zA-Z0-9_.-]+\.json$，同folder/file不得重复；不能嵌套相对路径。原文用UTF-8完整可见pre内容，bytes为Buffer.byteLength(raw)，sha256为原字节SHA256，不trim、不美化或额外加尾LF。

字段含义：file是本次实际导出原文件；origin是证据来源层；source是实际UI取文入口说明，不是引擎source manifest。工具会核文件名、sha与bytes，但不会枚举/验证origin或source，甚至缺失标签也不会替你补证，所以记录者必须保持上述五字段完整。额外字段不参与审核。

| origin | source建议/原已用值 | 可证明和不能证明 |
| --- | --- | --- |
| saved | product_export（root22实际值） | 可见产品“导出已保存”完整原文；需另有保存徽标/物理读取/重进证据才能证明持久保存。 |
| candidate | candidate（root22实际值） | 可见“导出候选”原文；字节可从Create重放，但仍不是已保存结果，物理旧提交另核。 |
| import_buffer | 按实际可见pre入口说明；示例visible_pre_import_buffer，不是强制枚举 | 导入确认前的完整输入缓冲，不是新存档结果，也不是52条前史Chrome点击。工具仅此字面量计入inputBuffers。 |

原请求的input_buffer必须以真实工具协议import_buffer登记；input_buffer不会报枚举错，却会漏计inputBuffers，不能沿用。根已确认使用import_buffer。不要为得到更好计数把缓冲改标saved，或把候选改标已保存。准备时未见root23第一层chrome-*下已落盘的exports.jsonl；这不否定正在进行的Chrome动作，也不预报最终文件数。

一个准确rev53缓冲行示例（source值应保实际采集入口，不把本例称作已采集）：
```json
{"file":"ai-input-rev53.json","origin":"import_buffer","source":"visible_pre_import_buffer","bytes":720417,"sha256":"ae5104035c697a5084877145f999cc03a79660756492b5ee9b0f046bca1eb90e"}
```

其后通过产品确认导入、实际保存并重新“导出已保存”，应另存新file、origin:saved/source:product_export；内容与缓冲相同也分别保留真实阶段身份。候选沿原导出候选入口另存新file，origin:candidate/source:candidate。

## 2. rev53的原身份与本轮静态核定

原文件normal-prefix-r1/earned/rev-53.json：720417字节、717001个JS字符，末字节125，无尾LF；SHA256 ae5104035c697a5084877145f999cc03a79660756492b5ee9b0f046bca1eb90e。与create-replay/rev-53.json独立输出逐字相同。本轮仅读JSON与哈希，没有重新运行该前史；两次独立Create各58命令proposed及全响应相同属于该prefix既有结果。

runId normal-course-content_employee-453bb7c2；normal/player/content_employee/t16-campaign-2；wish autonomy、approach free；Create commandId=create，revision 0→1。rev53日期2022-08-29，53条receipt；其后52条receipt与original-commands-58.json前52个原封套静态逐项一致（0错配），末条normal-course-52为DecideVideoProgram，原Create signature/receipt亦与original-create.json相同。不是从rev59删除6条得到53。

版本schema13 / rules-t16-journey-v1 / world-journey-work-v1 / contentHash d2cb24af0ffcad3a172e28e0a6cf6612feb383e9c60db597f9491772d338530a / xoshiro128ss-1.1-sha256-be32-v1。原Create payload initialStateHash为08751a9188019dd654000416d9d2ea04ef050f0c59d4cc7f5c9c13a77d6a6646；初始原文143490字节/SHA a3e35589a49c54963df0687687db4385db6b8903252e7d8f6d8072057c7345fa。

该前史是合法图像辅助新单起点：既有手工原创系列1件，原image_rights实际任务完成并已读批准，有效2022-08-29至2023-08-29，尚无AI作品或视频商单；原可用1AP/86900元。不能把它称为空白视频局或生成式视频资格，也不能把旧rev59当作53之后的新UI进度。

## 3. source绑定与P3/UI桥接

本次只读重核prefix/source-before.json（SHA256 02789f0803e424f214df83605a3bd3462b892c6d87552234872871a6d62fd2a7）：124 runtime TS + 2原审核协议脚本=126，当前集合无增删、哈希/字节0变化；另9 reference与4原input同样0变化，全部139绑定项仍同。不是凭版本字符串认为源相同。
```json
{
  "runtime": {
    "count": 124,
    "changed": []
  },
  "protocol": {
    "count": 2,
    "changed": []
  },
  "reference": {
    "count": 9,
    "changed": []
  },
  "inputs": {
    "count": 4,
    "changed": []
  }
}
```

原脚本verify_normal_browser_exports.ts为6618字节/SHA 68e7c16c6280c86060686c48554f4dc20481307f5988f972a11e390c03520f87；evidence-output.ts为2700字节/SHA f16d0d209946822daa44340307eb4fd5766a9b82b1548ef535346b202e01697d。工具无--source-manifest、--head或按origin过滤参数，不能把清单路径当CLI实参。未来执行会自己冻结并事后重核当时126源与所有实际输入，另须把报告sourceHashes与这里原126逐项/集合比较；若源不同，保原失败并解释，不偷换绑定。

原root23的415基线明确包含未完成P3 WIP，基线HEAD元数据f3633eedbbeba45fb8818afca89d744df3cbfaa7。准备时基线变化均在UI/相关测试，runtime126原字节保持；本次实时UI差分及新引用PNG如下。它是时点读回而非冻结的未来Chrome构建；根后续两处展示改动、最终构建source/resources/HTTP及实际消费身份必须另桥接。审核器本身不覆盖UI、图片、样式、HTTP或P3功能，不能将126通过冒充新UI/P3已验。
```json
{
  "at": "2026-10-23T10:17:00.805Z",
  "baseline": "goal-1/evidence/t17-acceptance-23/source-baseline.json",
  "baselineSha256": "e7e604e2db20f25476c46341d3519875c4d33bd2b5a2efa4c9e1f7d6f1b10f2f",
  "preExistingP3IncludedAndPreserved": true,
  "changedBaselineFiles": [
    {
      "path": "src/ui/App.tsx",
      "sha256": "9873db739c56f8dde0abfbea421ca762d69d8a3cbfde115fa1f8ed1113fca097"
    },
    {
      "path": "src/ui/NarrativeScene.tsx",
      "sha256": "4743dd712c4d82d7aba9f88d108be59ce1977ab553bd4d63a373000f60c54f37"
    },
    {
      "path": "src/ui/OpeningMoment.tsx",
      "sha256": "001b9964052172c91e1ed814540c360721d88f7ab606bd2e531502d0cac3f3ba"
    },
    {
      "path": "src/ui/OpeningObject.tsx",
      "sha256": "40630a9b5511e5cf00b24be5afa3149aed9397c32486dbe0947b7edbbb08ba0d"
    },
    {
      "path": "src/ui/RoomMoment.tsx",
      "sha256": "afc6919ebc08d90d9d53ff9b1ea7b5386b36d818700179a03f3ea908c5f0bd63"
    },
    {
      "path": "src/ui/SceneJournal.tsx",
      "sha256": "a8a45a58fca133eea4393e0b636004585196c6ccb0925585e24ea20870b5769b"
    },
    {
      "path": "src/ui/VideoPanel.tsx",
      "sha256": "764103781600246a28981a585aadb832682fa78b566807bc0e7d8de36145732e"
    },
    {
      "path": "src/ui/player-thread.ts",
      "sha256": "8400e06811fae0bc3cc4706bb36bcec93e88259b7a00b2a9004cf433529f9ed9"
    },
    {
      "path": "src/ui/season-focus-preference.test.ts",
      "sha256": "8b77295f66c4789be78f369cf8ef4b2d381557b31ba5dc06886b209b6493dad3"
    },
    {
      "path": "src/ui/season-focus-preference.ts",
      "sha256": "4d15adbd470d686e3c6175a98a03aff181bc7256a46e72b8a07b6609a54e7b55"
    },
    {
      "path": "src/ui/season-thread.test.ts",
      "sha256": "cdb2e123599c35c240a95bee216567db905e023bba8df37eaa0f56cefe5f3f8d"
    },
    {
      "path": "src/ui/season-thread.ts",
      "sha256": "2c0dc6736481bd133de909396fd02770bf0b2f4a49076cadfe008c49dfbe3ca7"
    },
    {
      "path": "src/ui/video-scene-progress.test.ts",
      "sha256": "09860a3692e6fe6992c7306df2089142d29c83711f38eab6ae35c373905d8aad"
    },
    {
      "path": "src/ui/video-scene-progress.ts",
      "sha256": "f630b12e6b9e7cb5b4daa998fdc8fe50cf3c4a7b7755594dedf7560ca050d4c6"
    },
    {
      "path": "src/ui/video-target.test.tsx",
      "sha256": "e4122b723d0bac06c26b05b83c5468ccbbc4d98e79a7d89afe679f3f9a28482b"
    }
  ],
  "addedUI": [
    {
      "path": "src/ui/App.video-focus.test.tsx",
      "sha256": "bc624eb826ac9279248f8cda4fc0c8a901739cf79eb8321301f484afd8a39447"
    },
    {
      "path": "src/ui/VideoSceneChoice.test.tsx",
      "sha256": "9ab73faeede0cbea1eeeedbc0a2d1984684fe14cc952f6c2c7c3f0a99ede5577"
    },
    {
      "path": "src/ui/VideoSceneChoice.tsx",
      "sha256": "81633e4b34bc7c02293641114e701c1a47d87d2689d8acf366466b24c0610730"
    },
    {
      "path": "src/ui/video-play.css",
      "sha256": "13806e85c3217da764488391d33f54b36211e8e3da15fd36e484d7b4170ef999"
    },
    {
      "path": "src/ui/video-player-thread.ts",
      "sha256": "3b1912d1ec2eb7043dec766c1f17ffc68aa506da7a763bb9e9461b9179ada2b2"
    },
    {
      "path": "src/ui/video-work-target.ts",
      "sha256": "df337f36704588a4a08959abb05c2bfa6bc57f6e414e30c64ff499195ce12218"
    }
  ],
  "addedReferencedAsset": {
    "path": "assets/ui-redesign/cinematic/props/video-making-kit-v1.png",
    "bytes": 1367224,
    "sha256": "9f50090511fa5a7ab2fb8f8514cc0560fb9c7909963519c32e6851c80359c3c4"
  }
}
```

## 4. 后续授权后的唯一原调用

在仓库根目录，输入为root23，输出使用本轮新专用目录；runner可先创建并保存命令/日志，normal-browser-export-audit.json标记必须尚未存在，父目录不得封存或已提交。此处只提供待执行合同，不执行：
```sh
rtk proxy env NATIVE_EXPORT_INPUT_DIRECTORY=goal-1/evidence/t17-acceptance-23 node --experimental-strip-types scripts/verify_normal_browser_exports.ts --output-dir goal-1/evidence/t17-acceptance-23/normal-export-audit-r1
```

原参数边界：环境变量必须给；进程参数必须恰为--output-dir <path>。输入真实路径须在goal-1/evidence内，任何原文件真实路径不得逃出输入目录；原evidenceDirectory会拒绝已存在report marker、已登记的父证据根/已提交marker，以及封存、非目录或符号链接目录；仅有旧日志而无report marker的旧失败目录可能不由工具自动区分，本轮仍须新目录保留原失败，不借缺marker覆盖旧证据。先浏览器父guard；后运行仍服从原工具保护，不绕开。若r1已被旧轮次或失败占用，在仍可写的同一父根另选r2，不清旧失败；若整个root23已被Git登记或祖先封存，换root23下r2也会拒绝，输出须另用新的同级证据根，输入仍可只读指向root23。不要把runner本轮预建日志目录误当旧失败或要求删掉它。

完整Create审核对每份normal原文按原Create身份重建，再依原receipt载荷签名/commandId/revision顺序重放；相同完整前缀可安全复用，最终原文逐字等于输入才算该份通过。executedUniqueCommands包含前史命令，不是本轮Chrome点击数；creations按原Create签名/ID/版本合并，不是页面/标签数量。来源/输入在审核中变化会拒绝，不能只拿source字段文字当绑定。

原工具内部会运行只读Git：evidence-output中的ls-files、cat-file，报告中的rev-parse HEAD。根已确认未来实际审核授权可包含这些原内置只读元数据读取；不含stage/commit/reset/push。本轮准备没有运行它们，也不为此改工具或询问用户。

root22实际先例：normal-export-audit-r1/command.json同一环境变量/唯一output参数；result退出0、11.029秒；既有报告4 creations/24独特后续命令/21原文（20 saved、1 candidate、0 import_buffer），126源/24输入，全部逐字同。这仅作调用先例，不移算成本轮完成。

后续收口必须保留命令、stdout/stderr、退出/耗时和源/输入比对；若未到终态不报计数或通过。当前仅准备完成，Chrome小循环/实际审核/S3-V1/T17/goal未由本文件关闭；全部兼容开发测试0，原P3/62正式0/22例行/PNG/真人/M01暂停/T18责任保持。
