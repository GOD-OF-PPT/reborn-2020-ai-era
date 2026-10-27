# 新期合同覆盖与显选续签：静态冻结

当前115原客户全部期限不足，首步直接显示Apr10—May8最早服务窗口及原合同最低May7（原to<=termEnd+1边界），逐原6 ID/原序号解释期限。没有自动填日期、没有默选客户/收款方式；有至少一份已核合同覆盖则原ServiceChoice直接保留，仍全部客户显选、原preview裁定实际选择。

新增helper仅公开target/date/serviceDays/customer合同和activeTerms；unknown/非法日期/失效归属明确理由，不0兜底。coverage只是合同可覆盖最早窗口，不承诺资金/供应/AP/实际后续日期已可执行。当前有效价/source/企业资金AP/保护/供应资产/原应收仍可读，旧单不重算。

原续签由一位显选原customer进入RelayResponseEditor renew，原command/preview/confirm/request沿用；新的局部选择不调用onTargetChange。取消局部回原企业条件；原册调用inspect business,service，原scope/generation与response subject memory保稿。显选客户后来失效明确停住，不能退回另一位或另一服务。

静态自审修正：未知期限不追加“已过期限”判断；失效renew subject在有其它cover客户时也明确核对，不静默回service；readonly/候选/冲突/stale复用makeSharedAction和原CommandButton。本片未改RelayServiceChoice/ResponseEditor/scene/response-draft，四保护源首末hash同。未改原tests、config、core/P326/其它产品源。

新增独立14case仅写：实际正常115 Controller/public producer+实际SceneChoice/Conditions/Response/Service/CommandButton展开；全short/日期/6原ID、空续签稿、取消与原册remount双草稿、原Renew payload+preview、最早边界May7可覆盖不强制续签、四保护/五unknown反例、选中续签对象失效不代换。setup20s、it默认5s。没有运行工程/Browser，未把新test写完称通过。

实际后验：Root统一type/定向及构建后，用新R9当前自然窗核首步阅读量、6位合同与续签按钮实际可达、取消/原册往返/主pin保、新合同后原service继续；R8编译617原画面是旧身份。兼容/几何0；非task完成。
