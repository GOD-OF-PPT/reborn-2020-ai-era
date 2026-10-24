# U1首单状态物件

仅修改OpeningObject.tsx和opening-play.css的首单限定scope，新增FirstOrderPaper.tsx及对应小型组件检查；上游root负责实际阶段与共享主动作，不改OpeningMoment。先保存原源码完整前像/哈希，再实现七态原生纸页/封套/独立实收票据，复用现有位图。

phase来自committed投影，dateLabel不解析推算；paid须带实际金额/日期。readonly/unsaved/unavailable旁层保旧phase，物件native button用原onActivate。原其它路线无firstOrder时保行为；不新增动作/钱/日期/资产/框架。短旁签仍有全文AX，纯文本保日期与收据，减少动效保静态形状。

检查：限定组件语义（非paid无收据、paid实际值/日期、保护不改已提交阶段、原native handler、旧route无新层）、CSS语法与selector边界；root统一type/build/当前自然Chrome逐态核真实接触与动作。此处不做浏览器、兼容、尺寸、缩放或几何专项，不重跑长链。回滚仅新增首单prop分支与scoped CSS，不改存档。

[杠精审查] 计划通过：不是只换文案/钟标，提交前后/收据/非成功轮廓分开；不把静态层或绿色组件当美术验收。
