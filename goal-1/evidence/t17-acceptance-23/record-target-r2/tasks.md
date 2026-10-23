# 任务

- [x] 1 原失效显示case新增未知账户无target回归并原时限见红。
  - 实际：R1精确case exit1/仅1失败2跳过；错误确为未知账户仍显示个人创建表单，原控制台/源SHA保留。
  - [杠精审查]：通过；未改原20秒时限/旧断言，未以长链或类型替代缺陷复现。
- [x] 2 同步门槛小修及同case定向见绿。
  - 实际：VideoPanel新增一行无target未知账户早返，文字指向App原册上方已有账户下拉。R2精确case 1/1通过、其余2项跳过；不露创建/制作命令与输入、不调用选择回调、原raw逐字不变。
  - [杠精审查]：限定通过；有target原失效机制保持，未自动改个人或默认账号；SSR不冒充真实点击/Chrome。
- [x] 3 strict-owned/最终source交回；全面检查-debug。
  - 实际：strict-owned exit0，同handle终态；final-source与R2检查同源，两文件已复制source/并冻结。未跑normalchain/124回放/全6套或全仓。
  - [杠精审查]：限定通过；只改授权两文件，不触App/GameTypes/Chooser/cache/engine/compat/Git/浏览器。R4统一构建与真实原册往返由根继续。
