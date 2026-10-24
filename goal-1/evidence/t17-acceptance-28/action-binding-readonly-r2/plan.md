# 稳定read_only UI绑定修缮

仅shared-action.ts。保身份/陈旧snapshot及busy/candidate/conflict检查；明确允许纯UI时，双方readOnly=true且状态read_only作为稳定只读，不授游戏命令权限。命令收到真实只读原因。原测试/expect/源码时限不改；只串行运行shared-action单文件，CLI60秒仅实际controller/store链等候上限，不作为性能验收。Root负责其原生键盘与全UI整合。
