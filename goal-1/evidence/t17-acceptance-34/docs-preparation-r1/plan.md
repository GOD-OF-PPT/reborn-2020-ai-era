# C-UX06文档检查候选（尚不运行）

保留原check_docs.py的check(root,text_only=True)与实际退出，provider只限定本片/root34及AGENTS/docs36/三master，不做全repo枚举。两个CLI模式分别fresh输出docs-scope-rN、docs-authored-rN，wx拒已有目录；作者Markdown排除受保护input.md，并显式加入先前scope classification JSON。

运行前必须实际captures/audit终态（passed/exit0、同审计input-after快照）及Root明确writers-stopped；当前Native/collector未完所以本轮绝不运行。源绑定cux06-build-r1.source-before578+extra149、实际runner R2；输入及本片完整文件/引用始末同，精确排除已声明当次自输出，不忽略其它新文件。

只精确分类实际返回的input.md: broken local link <原GameStudio绝对路径>；其它broken link、invalid JSON、asset诊断均保原错误，原PNG pending另列仍未完成，scope实际exit1必须保1。原input绝对链接不改。候选与旧helper只读内存语法核，不import/evaluate、不执行Python检查/Git/测试/build/browser，不改scripts/src/master/旧sealed。
