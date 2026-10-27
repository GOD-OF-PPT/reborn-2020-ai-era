# 新期日期P1修后限定复核

当前结论：原唯一P1已按最小式修复，当前限定源码无剩余确定P1/P2，可接Root统一最终工程/当前构建实际经历和正式收口。旧next-service-contract-independent-r1中P1结论保原发生时间，不能再作为当前未修结论。没有执行工程/Browser/codec/候选或回放，不发最终GO、不关闭U4-B。

1. helper当前3658B/SHA44a2466c670b7e21688cb041ff614ffa8e5e781305e57a9fde36e1042d8b5e77，只有minimumTermEnd:addDays(to,-1)改为addDays(from,v.catalog.serviceDays-1)。逆替全文3635B/SHAaeca4d025e8d549946ff7709dad328002c95cac4bee8cdfbaf1bf30a4a9c25ce，逐字等date-fix/helper.before.ts。原serviceDays先正safeinteger，故该实参非负；28天fromApr10→toMay8/minTermMay7，与原core to<=termEnd+1严格等价。原core日历/期限、未知/失效/尾声上限/只读候选门槛没改。

2. Journey新driver真正展开RelayNextServiceConditions、ResponseEditor、RenewFields、CommandButton等实际consumer。当前3case清楚分层：第1明确public-view覆盖夹具把一位原合同延May31，声明不是已续签/新存档/真实原Controller许可；原6checkbox空稿/显选原customer2/同memory内容/取消重开/inspect(business,service)/无choose/pin和raw不变职责保。第2用未改真实115，所有合同short→无ServiceChoice/无自动客户→radio显选原客户2→原Renew空期/模式/信用→显填May31/后付100、完整payload及confirm=true/原preview allowed→取消条件保稿/重开同值/合上，0request/不改旧period pin/raw。第3完整保指定missing period不回落另一business。此driver适配解决原旧2case按真实115直接进入ServiceChoice的失配，没有把夹具冒正常新历史或删旧草稿保护。

3. 新contract14case当前15976B/SHA20d72f7380bd99d45b4ba0086b0148d7bf9bfa0b1329fb3cfa011f887c74767b，当前可见变更是invalid catalog=0的test-only unknown→PlayFeatures结构桥及说明，仍保duration未知/window:null/不covers/0request/rawexact断言。该类型边界不是产品gate放松。RelaySceneChoice仍28768B/c2357d8d…，core calendar1916B/d252630c…、core relay55571B/b29dc600…同原审。

4. 已只读引用Root真实既有结果：u4b-today-contract-r15.stdout显示5文件39passed/39，result exit0/signal null/error null/sourceCount620/sourceUnchanged和extraSame true；u4b-type-r24.result exit0/signal null/error null/sourceCount620/sourceUnchanged和extraSame true。这是Root实际检查身份，本独审未运行检查，也不将其扩成当前活whole119UI通过或新R9/正式facts绿。

剩余仍须Root已声明的whole119UI实际终态、最终当前构建/R9自然Chrome、完整正式Create与freshR7/R8/R9公开读回、C-S4-R和主线/美术实际范围。候选R5仍not_run，R8缺三组画面职责须由真实R9补，不倒改旧cut或填未来输入。
