# R11限定文档检查交回

三条实际终态：scoped docs exit0/344ms；原check_plan exit0/157ms；原check_competitive_design exit0/175ms。runner session37969最终exit0；各argv与原stdout/stderr见同目录command/result/log。

文档provider仅6份：docs36、root32 plan/tasks及goal-1 input/plan/tasks。通过原check_docs.check(text_only=True)显式替换project_files provider，原检查函数/断言未改，未枚举Native/provider全树。另保原manifest/backlog资产/任务图检查；原3PNG缺失提示仍在（present0/3），不能宣称wholeDocs0、原旧23/当前25缺口关闭或PNG通过。实际425次本地链接目标存在性依赖在docs.before/after.json中，全部初末同；这不是全仓链接/JSON扫描。

R11权威manifest：goal-1/evidence/t17-acceptance-32/build-r11.source-after.json，104545B/SHA4143bf98aaf8f39ba1e1d29a2a9eb395af3065675caa1c4d1419637899794f50。每步564源bytes/SHA/mode均匹配manifest、初末同；所有实际检查输入与helper也初末同。docs36为75590B/SHAa8455fbc4aa12073bed2ca75f4350ef8b749e82470dd702d3c2e4bcb4b68ec52；根之后若追加收尾文字，应另明确核新输入，不把本结果外推。

首条内联准备命令parse exit1及原错误保bootstrap记录，未到写文件/checker阶段；随后仅修新adapter字符串构造。没有改原checker或降低断言。没有业务、兼容、原生或126审核执行；没有修改src/master/docs或旧证据。记录完成即停止writer，等待根下一授权。
