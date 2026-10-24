# 视频退出确认：源码冻结交回

Root Native实际发现“新增费用0/0AP”没有讲清原900预款退款。本轮只修改VideoCommandDetails.tsx、CommandDetails.tsx和原video-command-details.test.tsx；前像/输入/计划先于代码，写前均实际fresh guard。没有CSS/core/master或其它生产变更。

## 实现

ExitVideoCommission独立分支从捕获view校run/revision，匹配唯一同contract/channel/work、原business/account与公开finance.contracts行，检查balance归属及prepaidFen。missing、陈旧、重复、混账户或原单已不能退出时只提示返回核对，不取第一单、不fallback原报价/initial prepayment。退款读RevenueBalance.prepaidFen；金额与“将退还、尚未执行”、不足仍退款欠款、已耗成本/AP不退、未开工计划取消释放、进行中断/声誉影响分开，不把退出当收益或已退款。

CommandDetails从其原捕获view与features.workbench.finance传入。新增props为optional，旧Accept/Publish正文与原3case内容保持，原命令/preview/guard不改；最终实际退款以原保存后的账务为准。

## 定向证据

unit-r1.result.json实际exit0，唯一文件5/5（原3+新正常Controller计划/已开工两项），单worker/default5000ms，无时限放宽；实际wall9.271677s，不作性能结论。原stdout/stderr留完整字节。

两个新短链均经正常Create/真实推广与询价/原接单，再原Exit：计划取消后实际退900并释放未用1点；已开工后实际退900，预算保持已消耗状态/任务interrupted。计划case通过完整CommandDetails渲染核实际view/finance接线，渲染本身raw不变。

缺账、混账户、陈旧revision、重复商单，以及退款ledger450/现金0的边界是从同一正常public身份构造的纯呈现反例；不是手改正常存档，也不冒称正常流程实际造出欠付。它们核了不fallback initial900、不因现金不足删原退款/欠付说明。

本unit仅绑定7份源码/规则/类型，初末同；不是547整树审核。全547、全局类型、R6build和真实DEV6原确认/退款/保存复验由Root另做，本轮没有抢跑这些，也没有Chrome/兼容/几何测试。Root已要求立即冻结，当前3源与本次5/5时的身份末核相同，不再修改。

## 最终身份

- src/ui/VideoCommandDetails.tsx：4421B / 83215a17c9623d2d506dfc0a1b78d2bf5592ff97ea2c3de61566d28a5446bf62 / 0o644
- src/ui/CommandDetails.tsx：12853B / 94d81ecc345d78bc6b9b3c46e3274eba6782c59caa619eeef62233774af715c2 / 0o644
- src/ui/video-command-details.test.tsx：8474B / 1eb36929a8ac930a5f264c34b595bd6b149efb05687d21e3f7c9f29d7783f5cc / 0o644

详见source-final.json与owned.patch。当前只有源码确认补正交回，不等于R6画面/Native/全C-UX03或人类认可；等待Root真实回执。无Git操作。
