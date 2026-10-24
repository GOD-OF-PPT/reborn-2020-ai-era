# qualified同日下架回归候选交回

本目录仅文本，未改任何src/测试，未起Node或执行测试。使用 qualified-unlist-regression-final-r1.patch（before/candidate/patch SHA见patch-status）。原test三定义块共4case的全部断言/20000ms逐字不变，另append一个默认5秒F02 case；不放宽旧时限。

新增真实F02原链：两次样片原发布反馈→原affiliate申请/实际完成/读批准→第三份原制作/Review→原Publish affiliate→同日原Unlist→原Advance到测量。原夹具默认批准参数明确，未重设seed/规则/资金/资格；不称正常挣资格。platform helper仅新增可选false默认下架分支与最后测量前官方PlayingView，以便新helper读原实际transition；旧调用原命令序不变。

新case确认qualified=true/0views/cohortId=null/同日下架/无settlement，再用soft assertions同时收focused/legacy无窗口、focusOpen=false、helper实际反馈不虚构观察；原raw/public投影不变。当前冻结生产旧条件应逻辑红，但0实际运行，不预报实红或绿。Root可在171终态后先只应用此测试patch，精确跑新case留红；随后应用review-r2既有两生产patch，再同case及必要受影响原文件绿。

Today在F02缺完整正常journey，故本候选不伪造全PlayFeatures来冒充正常Today证明。Today当前video classification直接沿videoFocusOpen；如Root要求直接显示层反例，应另建明确bounded public display case，不编码/提交该variant、不称正常资格。无新增生产接口或原测试门槛修改。

逐祖先lstat/wx写保护沿review-r2的禁Node纯Python合同；源码7项before/after逐bytes/SHA/mode同，原生产patch也仅只读引用，所有候选未应用。
