# R2实际首幕纸签修缮

依据实际view_image读取的goal-1/evidence/t17-acceptance-33/chrome-main-r1/r2-01-open-before-capital.png：原kit已在桌面区域；其下大绿框和stage/heading/line/长动作复述仍像软件面板。该图仅为修前证据，不称改后已通过。

冻结4文件：RelayServicePaper.tsx、relay-service-paper.css、OpeningObject.tsx、RelayServicePaper.test.tsx；精确hash见source-final.json，完整前像与changes.patch在本目录。原kit字节未改。

变化：撤整块copy绿底/边框，以透明承载区＋各字段独立暖纸签/墨字；夹扣接近图底缘，room仅合并原签与图间隙，未移动整个button。日期虚线、独立支持左条、原款双线、实际责任朱红折签、readonly/unsaved/unavailable保护各自可见，不隐藏或缩字。空的普通stage/title/detail/notes可不占块，但不删非空字段。Root将普通重复heading/line传空、stage写短真实状态。

API追加 RelayPaperLabels.actionHint?:string。仅非textOnly的视觉action用hint（未提供仍完整actionLabel），nativebutton始终保title+完整actionLabel，原actionId span的aria-label亦保完整actionLabel；textOnly恢复完整动作文案。绑定仍原onActivate/disabled，无规则/请求/保存改动。短hint必须由Root各真实action分支提供，不能由art phase猜命令；日期/支持/款项/责任全部原字段仍DOM可见。

独立静态复核捕到并修：通用notes>span会压专项材质（专项现显式notes>.字段提高优先级）；后导入opening-play对room art的filter/slot覆盖（现按原direct/nested层级限定relay）；text-mode receipt旧copy双边框（现限定relay纯文本撤整块框）。这些是cascade源码核，不冒称实际computed或渲染通过。

验证：新单文件6/6、exit0，maxWorkers1/原默认时限；87静态relative-import闭包初末同、owned同。PostCSS65规则/0错，scope/无at-rule/无font-size/裁切/scroll/整件transform静态扫描0问题。本轮无新红、无全type/build/浏览器/几何/兼容；原relay-art-r1早期transform红仍保留。

待Root新构建/当前自然窗口实际核纸签接触与全幕内容，不能由此静态修改称美术/人类理解通过。

[杠精审查] 通过限定源码/组件范围：去panel而保全部关键可见字段、原动作与全文AX/文本模式；未以隐藏/裁切/缩字删责任；实际改后图仍未验。
