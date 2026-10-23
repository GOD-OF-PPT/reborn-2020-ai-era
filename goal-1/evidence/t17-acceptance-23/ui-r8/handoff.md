# R8两处实际文案问题修缮交回

仅src/ui/VideoSceneChoice.tsx。新hash为006dddcdbaf5f8ac785ce2dcc9c6586ee52532de7bd6f705a43f7f9ad8f418e4，准确diff见display-caption.diff，原像/后像与final-source.json保留，源码已冻结。

根当前Chrome R3发现两个确定问题：未执行任何命令的制作方式页却显示失败口吻/内部码，且时代原因重复；已选商单manual/original的安排页仍先列不适用的热点价目矩阵。

videoModeCaption只读公开reasonCodes，把两个年代原因合并一次、访问资格原因合并一次，未知码中性指向完整记录；不再用命令失败翻译器。mode.from、radio及原资格预览完全保留，不禁未来选项、不提前批准资格。

videoScheduleCaption从权威VIDEO_JOBS取costFen/actionPoints/durationDays：commission按commercial组成job id，sample沿已选产品；授权素材的费用已在job成本，不再另加300；marketing/rework/price|scope分别用video-marketing/video-rework/video-negotiate。条件未齐先引导，日期有效时用isoDate/addDays说明预计完成日；文案强调预计不是实际完成、人工核对、客户验收/应收/实收及谈判失败/旧期限费用等边界。

scope-check.json通过精确逆补丁证：除两新增展示helper、其imports、两处caption外，整份源字节可还原原像；payload parser函数逐字一致，原mode.from/radio/事件回调/guard/页脚/金额与日期推进规则都未改。14项纯展示小检查通过，覆盖年代/权限去重与未知码、商单空product、授权成本不重复、样片/AI辅助/推广/返工/谈判job、空条件和坏日期；使用实际权威内容与日期函数，游戏命令执行0。首个展示runner因data URL无法解析文件系统绝对import而提前停止，错误说明与生成模块保留，改用保存模块file URL后通过；未借此改产品规则。

未运行长链、strict、浏览器或任何兼容/几何专项，未改资产/测试文件/其他源码。根负责随后R4统一type/build与当前窗口实际文案验证；本轮小检查不能冒称整单或新生产画面已通过。
