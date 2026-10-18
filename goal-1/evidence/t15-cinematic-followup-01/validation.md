# T15电影版首屏取证｜限定子范围通过，T15未结项

2026-10-19，接续D03的A长日重启，错误参考未采用。上一goal轮为实际progress，本轮继续T15内部串行步骤，不进入T16、不重建或缩小目标。

## 实际结果

[原始浏览器审核](startup-evidence-audit.json)核对C2三份顶层本机生产文档、Chrome155/1280×720/实际DPR2、可见状态的Performance/Navigation/Resource Timing；DPR2不是200%页面缩放证据。每份原console/AX/JPEG独立保留，没有用Node/tool用时换算。

| 样本 | 原生FCP | 首页主动作首次可用的观察时间 | 当前场景资源responseEnd |
|---|---:|---:|---:|
| [1](c2-sample1-console.json) | 400ms | 473.4ms | 215.1ms |
| [2](c2-sample2-console.json) | 328ms | 370.4ms | 187.3ms |
| [3](c2-sample3-console.json) | 428ms | 527.7ms | 212.7ms |

中位分别400/473.4/212.7ms。主动作时间是DOM中首页主按钮已启用且有布局的首次观察，不是TTI；场景resource只证明响应结束，不证明图片decode/paint。探针有小量请求/观察开销，缓存和网络未受控，3样本不是冷缓存/p95/线上/其他设备结论。现有合同没有数值预算，不擅自设阈值称性能整体验收通过。

## 已修复的取证缺口

[C1首样本](sample1-console.json)得到FCP404ms与主动作491.4ms，但sceneResource=null，[实际检查false](performance-native-checks.jsonl)保留。原探针只等待三核心条件就输出complete，未足以保证场景资源时序；[原字节](probe-before-resource-repair.js.txt)及[source1](source-freeze.json)/固定5235保留。C2只在诊断中补buffered resource观察与当前CSS场景资源完成条件，10秒仍有限清理，无法取得则不完整/null；不改变玩法或为了取证加载额外图片。

C2共4项实际性能检查（三普通＋[文字模式](c2-text-console.json)）均通过，另2项普通入口检查通过，C1旧false不合并成新通过。默认入口诊断script计数0、初始info/warn/error为0；[C2最终普通入口](c2-final-plain-script-state.json)恢复文本/减少动效false，无诊断脚本。各C2诊断console只有单次本地info，无warn/error。没有创建人生、发游戏命令、恢复或删除存档；仅本机显示设置暂开文本后恢复。

## 源、产物与检查

[原源保护](opening-source.json)的293文件中292逐字保持，唯一变化为index.html的显式本机query加载；新增独立public诊断JS，[C2冻结](source-freeze-c2.json)294文件。游戏所有React/规则/内容/存档/随机/权限/测试/配置及图片不改。诊断仅localhost/127.0.0.1/IPv6本机、明确performanceTest=startup-v1加载；默认不请求或记录，非本机/非匹配开关无DOM/Performance/console/存储访问。无SDK、遥测、持久记录、玩家文本、完整URL或网络上报。

[类型](typecheck-result.json)0、[C2语法](syntax-c2-result.json)0、[6场景×2入口隔离](gating-c2-result.json)0、[C2构建](build-c2-result.json)0。[产物比较](build-c2-comparison.json)：原35产物中34个JS/CSS/图片全部原字节保持，只有index变化与新诊断文件；新36资源[本机HTTP==disk](c2-production-manifest.json)。D03原5234的35资源和C1的36资源亦逐字核对，原固定目录不覆盖。没有把D03的500/60当本轮新执行；原游戏/测试未变，本轮没有重复跑它们。

## 本阶段美术与GJ/REPEAT

[诊断前普通入口](plain-entry.jpg)与[C2恢复后的入口](c2-final-plain-entry.jpg)实际目检：A场景、青蓝/暖光、纸本字体层次和主CTA保持，1280×720无横溢出，主CTA底563.19px可达；本轮未发现新美术缺陷，不为取证加产品面板或改原构图。持续美术复核保留，当前无美术素材/组件字节变化；移动兼容最后M01。

[杠精审查] 通过（首屏取证子范围）；T15整体仍待。修复真实采样缺口并留原false，不把代码读数当实际浏览器输出，不拿资源responseEnd冒充完整绘制，不拿三次本机缓存样本冒充通用加载预算。全部缺失范围明示。复用原browser-evidence/源冻结/固定构建/逐字保护，新增仅本项目取证工具，没有新Skill、代理、自动化、依赖、字体或外部资源。

## 剩余与恢复

本轮新鲜能力库存仍只有IAB与visibility/viewport；原生200%/离页仍待支持环境或实际人工结果，未重复旧快捷键/导航试验，未复用旧三轮计数。当前是恢复后首次同类外部门槛审计，独立首屏取证取得实际进展，不标blocked。实际FCP已从“无浏览器时序”推进到本机限定基线；完整性能预算仍未获数值/环境定义，不能据此勾T15/C15。

需要支持真实页面缩放的桌面浏览器核验200%与原生beforeunload的留在/离开、候选前后/旧物理提交原字节，按[原补验要求](../t15-browser-followup.md)执行；当前电影版生产5236、独立开发5233，实际普通入口→设置/人物/生活等操作与旧R3不同，不能只在旧纸本5217上补验后称当前电影版通过。开发storageTest=abort-life-work只在开发生效，生产无此故障开关。

T15/C15、T16正常24季度/结局、T17原PNG0/3/真人0/整体平衡、M01最低优先级移动与T18最终review继续未完成。phase记录/本地提交不等于远端交付，仍不push/部署/使用真实支付、模型、交易或融资。
