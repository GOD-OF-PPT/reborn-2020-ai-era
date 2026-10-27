# 第6种原义务回应（Root后续授权）

R1静态交回之后，Root明确追加已有共有PayObligation接线，并先写入implementation-seams-r1的末节。本组据此解冻三个自有新文件，旧R1源分别保存pre-pay-r1/，原manifest/review按当时身份保留。本R2不代表运行验收。

新增mode pay与subject obligation；原当前workbench.finance按精确account+obligation ID读取，amount空，显选填全部或部分；仅0<amount<=当前remaining，payload为{accountId,obligationId,amountFen}并confirm:true。原义务date可以未来，不据此增加原规则没有的支付禁令；可花/保护和真实许可仍由原preview。

原business明确同本站可核；business=null则须同受控公司账户唯一，或同run/revision/date的ready casebook原条目逐字段一致且scopeBusinessId唯一归本站。保原business空值不伪造声明；跨账户/他业务/重复原单/歧义公司账户拒绝。customer target仅自身合同欠款；period/meter/audit仅由原source/operation/原job及原计量链唯一关联，本站旁账需明确站级目标，不能冒成本期。已结历史不再从当前未结列表得到写动作，原历史由Reader保只读。

未依赖casebook的新明细可用性来禁止base已经足够核的合法命令；缺失或过期casebook不能凭空赋权。补充公开snapshot tests验证未来due不被UI禁、部分金额payload、owner/重复/子对象边界及原preview拒绝伪造债务。原86静态共有97条历史义务、当前remaining>0为0，因此这些新增pay反例不冒真实新债/实付或Native；Root仍须用真实未结分支实核。

共有PayObligation是既有UI能力，本次从服务Reader复用，不倒混原RelayPanel33，也不算首次接线的CorrectRelayUsage/CollectRelayReceivable两API之一。没有改原Obligations.tsx/任何已有源/P3/规则/schema/存档。

R2手工静态审：六mode的subject组合/原归属/空值/显选金额/原确认及canonical草稿齐，保全额与部分原能力；无due硬禁、无旧金额随revision重置、无自动换主体。原CommandButton及Root保存链仍拥有最终权威。产品三文件再次冻结，tests/type/build/Browser/Git运行均0，待Root统一验证。
