# R1实际失败保留

Root inline HTTP读回在5342进程身份比较抛RUNTIME_BINDING_MISMATCH:5342，未写final-runtime-resource-readback.json。原因是旧C1真实args使用绝对目录，本次测试错误地要求相对目录；ps61696实际目录/Users/gordon/githome/reborn-2020-ai-era/.delivery/t17-s3-c1-r5。不把R1未落盘HTTP计成功。R2重做全部请求并用真实目录canonical身份；不改/退役C1旧服务或构建。
