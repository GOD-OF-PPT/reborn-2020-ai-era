# 测量入口修正

首次C2启动给既有evidenceDirectory额外传了--source-freeze，但其标准接口只接受--output-dir，因此在运行准备链前终态1。原preparation-output/result保留，不计性能结果。C1已提交脚本不改；C2复制同一测量体，仅调整相对路径/默认冻结文件，用标准参数在preparation-v2新目录运行。游戏源未因此更改。
