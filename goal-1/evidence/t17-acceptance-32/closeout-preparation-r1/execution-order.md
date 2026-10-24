# U3-C2 收口候选：只准备，暂未执行

唯一CLI：closeout-final-r1.candidate.mjs。原old25lib只读复用。baseline HEAD=56923404f3afba65a566055df66b45a737fdc8cb；当前own metadata=1206B/SHA0f06978a4b1b177cad944ec513f87a632f08831d5f35614e846586e5b37267ce，helper运行时从own.rows核长度/SHA，未硬编码1206或旧1513。

Root须先完成实际Native、唯一完整Create审核、最终source/build/资料/validation与所有root32 writer，才决定运行。prepare绑定**实际最终成功build的完整files manifest**，UI差集与source集合动态枚举，不以准备时source数量/旧green代替。feature白名单=动态src/ui变化＋docs36增量＋root32精确payload/marker；AGENTS不在当前白名单，若本片需更改它应先另出明确候选，不静默stage。

未来命令（尚未执行）：

~~~sh
rtk proxy node goal-1/evidence/t17-acceptance-32/closeout-preparation-r1/closeout-final-r1.candidate.mjs prepare goal-1/evidence/t17-acceptance-32/<ACTUAL-FINAL-BUILD>.source-before.json
rtk proxy node goal-1/evidence/t17-acceptance-32/closeout-preparation-r1/closeout-final-r1.candidate.mjs seal-root
rtk proxy node goal-1/evidence/t17-acceptance-32/closeout-preparation-r1/closeout-final-r1.candidate.mjs stage-feature
rtk proxy node goal-1/evidence/t17-acceptance-32/closeout-preparation-r1/closeout-final-r1.candidate.mjs commit-feature
rtk proxy node goal-1/evidence/t17-acceptance-32/closeout-preparation-r1/closeout-final-r1.candidate.mjs cli-probes
# 实际browser probes、独立feature/空白分类/最终记录均写尚未封存的post。
rtk proxy node goal-1/evidence/t17-acceptance-32/closeout-preparation-r1/closeout-final-r1.candidate.mjs prepare-record
# prepare-record之后停止所有post writer，才可seal-post。
rtk proxy node goal-1/evidence/t17-acceptance-32/closeout-preparation-r1/closeout-final-r1.candidate.mjs seal-post
rtk proxy node goal-1/evidence/t17-acceptance-32/closeout-preparation-r1/closeout-final-r1.candidate.mjs stage-record
# Root单独授权实际record commit，输出不得写入已封的root32/post。
rtk proxy git commit -m "docs(goal): record class teaching validation"
rtk proxy node goal-1/evidence/t17-acceptance-32/closeout-preparation-r1/closeout-final-r1.candidate.mjs verify-record <ACTUAL-RECORD-SHA>
~~~

新post仅由prepare未来创建：goal-1/evidence/t17-u3c2-class-post-commit-01。三master只在record选baselineHEAD原blob＋本U3-C2完整后缀；唯一原P3插入2304B/14LF不进blob，工作树不改。初始own后缀必须一次且完整保留；prepare-record还要求其后已有真实完成记录，不能拿初始未完块当完成。record普通路径及feature均NUL绑定，master用明确blob/cacheinfo与逐blob/mode核验。verify-record开头/返回前均重核root32 seal，post seal亦核，stdout另行保留。

Cua只能import独立browser-probes.mjs，不能import带process.argv的CLI。封根前保当前实际root32 Native绑定，封后传其现有实例：

~~~js
var c2ProbeModule = await import('/Users/gordon/githome/reborn-2020-ai-era/goal-1/evidence/t17-acceptance-32/closeout-preparation-r1/browser-probes.mjs');
await c2ProbeModule.browserProbes(actualRoot32Native, 'existing root32 Native capture binding');
~~~

13入口＝4wrapper显式stub（delegations必须0）＋9实际bound Native保护入口，不是13次游戏动作。两个原CLI按原IMMUTABLE错误/目标未建核，原日志按字节保留。普通118旧marker身份与exactset、2 marker symlink target字面/准备期mode分开；root19完整树和baseline.lastSealed两payload严格重核，不能把marker身份当全部旧payload重验。

原26P3工作字节及原tracked/untracked index状态、root19精确1197普通110目录、原input61B都保持。封存只自排其根marker，记录文件/目录/mode/SHA并拒symlink。空白诊断按本轮实际路径/原console或统一diff分类，不裁数据、不复制旧计数；no-index exit1且无诊断只表示差异。当前三份新JS仅syntax0及文本自审，不代表以上mode实用成功，更不代表Native、人类、整个goal或兼容验收；兼容仍0。
