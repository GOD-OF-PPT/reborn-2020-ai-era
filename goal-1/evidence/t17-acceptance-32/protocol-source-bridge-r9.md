# R4 → R9 保存协议源桥与有限验收边界

结论：R4真实报名保存失败/原候选重试/新鲜物理旧新档/只读记录保留自己的R4界面身份；R9没有修改提交与保存协议，可由精确源桥继续引用其有限事实，不称在R9重跑。仅因本次日期clamp与公开退款copy，无需重复整套故障矩阵。R9新停点和新copy仍须自己的实际正常循环与重进，最终全部新原文另做完整Create审核。

## 权威绑定

以build-r4.source-before/after的562项为R4源；以type-r9和最终build-r9.source-before/after的564项为R9源。R4各自初末同，R9 type/定向组/最终build全部同集合且bytes/SHA/mode相同，本次当前564项集合及逐文件读回亦同。详细来源、完整11项关键源、26项P3及8+2差集见同名JSON。没有把source bridge写成新浏览器验证。

R9原type实际exit0/46364ms；原定向5文件21case exit0/36017ms；原build实际exit0/47761ms，目录.delivery/t17-u3c2-r9。这里仅重读这些已有终态，没有启动测试/构建。

## 8项既有UI变化与2项新增

- src/ui/course-teaching-art.css：R4 4466B / 0edf7b7d31aa65272f851d051b3a0768c7d413f587ac802d3eb8a179940ad74f → R9 4610B / 0e6329742a5a11a79f690305a850e8408c1c798a3926a2ecd9f917a82fb3c605，mode 420
- src/ui/course-teaching-continuity.ts：R4 4807B / fdb68916dab370552227395da2cc68e1cf641a50eff2a2582f1af93e6f360062 → R9 5645B / de7b61b3a2be2d09e637e271304dc6156c59261d579df8a3ca482803e1c48678，mode 420
- src/ui/CourseEncounter.tsx：R4 3450B / e0592de3892bbb2ec705a0ea286c9c323cecfce8571913bb56bbda210612d705 → R9 3570B / 1ed0257164f5abbe404aa9a0f4110bff1e987faf10af0ac34851410d1c1367e4，mode 420
- src/ui/CourseTeachingChoice.test.tsx：R4 21653B / 1be4fd49a2d3dc797be7795395f610ab1d20851ed1c32e1be9af7e48b2667457 → R9 21866B / 5abb5c13206a5e6c4fe3d526ebd96956e2ff287516c914464fa5b7deb99d6422，mode 420
- src/ui/CourseTeachingChoice.tsx：R4 53368B / c12ce42e60045000bf46bea5ba07652c6c11c198f787e65c8cecf05abcf2104c → R9 53821B / e6116bf81d275bb61295ef3b22b305aa3f516771faf71d3204e710aa37219ba3，mode 420
- src/ui/CourseTeachingContinuity.test.tsx：R4 7945B / 6e762f05ab3a1763ee499224edf9891b2afeecf8c5b40862b355159d574557a5 → R9 9169B / c3176d5f9377fabb3f600214d633fbf914e9626116631af3408dd55ede0f9170，mode 420
- src/ui/CourseThreadAction.tsx：R4 3588B / 32a1830f7805c5fb8893b665d3de1a831c22709d5ea8d8acce3747080fb43cbf → R9 3902B / 8068274eed8876d128a6a88cf2f87f0950be61928f3907372367b31aa6e50c9a，mode 420
- src/ui/OpeningMoment.tsx：R4 47674B / 3d0d3621e4a2ff6d8be5dd960767ee4ab86e845953971ff6f7ba98f85283a229 → R9 47998B / 988b3163dd7d624d0e234dac9158395e8fc2ceaa3bd7126f9d1f981fae4574c6，mode 420

- 新增 src/ui/course-wait-date.ts：1030B / a97aca8a9be9118d4df3c2db0d8ded811d05ea678d2a403cd6f2b6bb69624788，mode 420
- 新增 src/ui/CourseWaitDate.test.tsx：12001B / f1d6d18dfed9e51cac66ca2134cca511aff6f54b26ea5cf59ba5b90549b77520，mode 420

无删除、无非UI变化。日期helper只读取既有公开nextDate；旧AdvanceTime、字段/载荷验证、原子候选、持久化和原retry语义保持。公开money copy继续取原courseCohortFinancials。

## 11项关键保存/确认源完全相同

| 文件 | 字节数 | SHA256（R4/R9 type/R9 build/当前同） | mode |
| --- | ---: | --- | ---: |
| src/application/game-controller.ts | 12213 | 866879d0db9343e97afd5c500a4c40c63786fc53d63a91efe0e0b327882487c7 | 420 |
| src/application/session.ts | 12821 | 4b413b56eb6a18fa90c8e730d518394dfb0b7bbd6fc559c432a518d8a5d7d72f | 420 |
| src/persistence/codec.ts | 20916 | 1bf625fbc6da65c3167d19fdd1548e18954a50bd88af87bce407a9e06aa40c8f | 420 |
| src/persistence/indexeddb.ts | 18462 | 978209e115e087256e81b60c39080ec029d9c067252beb1451817dc0c3f480dd | 420 |
| src/persistence/writer-lock.ts | 1553 | b5eb19e5beba9b7262cbfce046bdd8e413f8742a77a491184fcbbbd7a96498df | 420 |
| src/core/commands.ts | 20764 | eb050a803ad47778a66cee1a04508ad1c64d024f2eada4cbdd592d8fdc7169c3 | 420 |
| src/application/course-commands.ts | 3000 | d495eff57e0ee36d087715fa6a5c8a810218ba6a339883fe99f9dfdc74dbd195 | 420 |
| src/ui/App.tsx | 54598 | cf74e13a3fff3639fa535577af733e69be11b89b8804e98a1ca37c3eed17c643 | 420 |
| src/ui/CommandButton.tsx | 1928 | 85027bd69586619720a0fb0ffb4952543784b46d42e146e1f3d2f84567b85b51 | 420 |
| src/ui/ClockAdvance.tsx | 3495 | 919ec76c3c762f0ab428e47233c468784f9c18ff51bda007fe8d38d634110f2f | 420 |
| src/ui/CourseTeachingDetails.tsx | 12597 | eb16c882a8239b616e4f81b7652e2d2681591fc832c070ba6c8d27c8074ad3de | 420 |

原26 P3按root32开工工作树基线逐项核bytes/SHA/mode全部同，不把它们换成裸HEAD身份。JSON逐项列baseline/current；其中不在src/asset/config census中的script保null/不适用，不伪造R4冻结条目。

## R4真实事实保留自己的身份

旧88：921355B / f8007427dc65c480aed39303e049327ebd2a4f12753eeeb296005b287a67067d；候选89/原retry89/新物理89：930483B / 4ff1cebd491f72a5ad00a5c4ffc48e080eb89350ddd87c56f182e884e4177225。此次只重新读6份原raw、登记源/角色和头的字节关系，没有执行原head.put abort或独立浏览器读取。候选合法与字节相同不能倒推其在失败时已经保存。

R4证据可继续证明R4源下：旧已提交88未发布学费、候选89不冒保存、原retry保存同候选且新物理档同、只读有效报名不能写。此桥支持保存/确认关键源未变的有限结论，不支持R9完整界面重跑、退款首层copy或默认等待已修的Native结论。

## R9有限补验

1. 从真实97明确导入的独立R9分支，实际主操作/物件/核对Clock先到已有公开节点；Mar14第一次看到H004并保Mar21期限未defaulted，同班、Apr1原任务、费用/AP持续正确。
2. 同轮把累计预款/已实际退款/保护/教学收入与当前原班账对照，旧半退款状态995/199/398/398不误称新收入或余额，之后随真实交付/退款更新。
3. 继续原更新与班期义务，保存重进一致；最终全部新raw在停止写入后统一做原完整Create审核。原失败R8到Mar31的98保其失败身份，不被修后分支覆盖。

R9定向测试保main/object/review/record同日期及候选/只读/日期/季度等门槛，当前5/21是自己的执行身份；不代Native/真人。只有后续改动上述保存/确认源、候选发布门槛或发现具体新失败，才重新打开受影响命令的定向故障验证；不启动泛化矩阵。全部兼容开发/测试仍0，完整T17/goal/真人责任不关闭。

[杠精审查] 限定通过：逐SHA/mode桥接、原P3和R4 Native角色保持，源码证据、测试、Native及最终审核分层，不扩成R9整链全绿。
