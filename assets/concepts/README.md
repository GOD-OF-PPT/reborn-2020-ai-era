# 概念图清单与待上传状态

2026-10-20已回溯确认：这里指的是旧ChatGPT聊天[《完善游戏创意玩法》](https://chatgpt.com/g/g-p-6acd9c938cd88191871d2b574df1de75/c/6acd9ca8-07fc-83ec-8d98-38bb0adc0576)里的三张概念图。该聊天先收到“先生成3个美术风格图片作为备选，确定美术风格”，随后用户偏向第三张；早期交付消息提供`reborn-2020-ai-era-project.zip`，并说明三图当时没有随文本资料上传GitHub。原图组与项目包入口现已定位，三张预览可查看；本轮下载尚未取得可验证原字节，不能据聊天声明把本目录标为已补齐。

**这不是2026-10-18的A/B/C备选。** 后来用户明确选定的A「长日重启」原PNG完整保存在[三方案目录](../../goal-1/game-art-options/assets-manifest.json)，三个原件均已和生成源文件/清单/Git逐字核对；正式普通住处PNG与所选A相同。当前正式美术沿用A，不需要重新选择。旧概念图仍按原manifest独立核验，不用新图或预览截图替代。

| 方案 | 原图目标路径 | 状态 |
|---|---|---|
| 01 动漫 | `assets/concepts/style-01-anime.png` | 待上传 |
| 02 像素 | `assets/concepts/style-02-pixel.png` | 待上传 |
| 03 半写实电影感 | `assets/concepts/style-03-cinematic.png` | 待恢复原字节；旧阶段用户偏好，当前正式方向见A |

[manifest.json](manifest.json)保留原文件名、尺寸、字节数和SHA-256，供补传时逐项核验。编号按风格内容，不按工具返回顺序。参见[美术规范](../../docs/05-art-direction.md)。

补齐三张原图后执行`python scripts/check_docs.py`进行完整校验；只有文本时可执行`python scripts/check_docs.py --text-only`，它不会把缺图说成资产校验通过。

本轮[追查结果与范围](../../goal-1/evidence/t17-asset-history-01/validation.md)保留来源、三张实际预览、下载限制和A/B/C字节检查。来源已由助手查明，不再把“提供本机PNG目录”当作当前用户待办；独立美术/交互与业务验收继续推进。
