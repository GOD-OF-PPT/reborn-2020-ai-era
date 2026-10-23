# 仅提案：codec pending重建局部优化

状态：未实施、未测性能改后结果。Root已核codec.ts/timeline.ts当前diff为空且不在26条P3 WIP清单；所有原WIP仍保留，不因本提案覆盖任何文件。先让Root做原两Vitest原5秒无浏览器控制复验，若仍红才决定。

具体触点仅RunCodec.#references现有pending重建：原循环对每个event调用queueEvent(reconstructed,event)，会对持续增长数组find/复制/排序；CPUprofile技术链queueEvent累计约20%，legacy此点不足1%，所以不能保证此改足以解决两个超时。

候选沿Root明确思路：每个首次ID的event都调用原queueEvent({原timeline属性,pending:[],receipts:[]},event)，完整执行原identifier/date/phase/priority/canonicalJson/clone/cursor校验；只在本次#references局部Map记录ID、原克隆和必要signature。重复ID时再调用原queueEvent({同cursor等属性,pending:[已存原克隆],receipts:[]},event)，保不同载荷EVENT_ID_REUSED与同载荷原幂等行为。收集unique克隆，循环尾只sort(compareTimePoints)一次；保原length和最终canonicalJson等值比较，故相同ID/相同载荷的重复最终仍按原INVALID_EVENT_QUEUE拒绝。

所有已有processedIds/payload.date/域handler/账户/动作/来源等逐项检查仍放原循环同序，不因Map命中跳过。原GameRun/schema/版本/checksum/receipt账务/签名/cursor/最终byte envelope不改；Map只能本次调用存活，不做跨run/revision或可变对象缓存。queueEvent原函数和实际时钟调度不改，克隆仍由原函数产生，不只验证后保输入别名。

证明与复验责任：先做单独前像/原负例红绿/身份绑定，再对同ID同载荷/异载荷、behind cursor、processed ID、phase/date/priority、顺序/账户/动作来源的原负例逐项确认原拒绝；原正常export重放/SHA与checksum相同；再按原两个原Vitest 5秒/断言、原支持业务范围复验。不能用diagnostic长timer或移除严格校验来拿绿。若需额外canonicalJson来保存signature，其成本应实际计量，不能预报节省；legacy仍可能主要受其他严格遍历/宿主状态影响。

不采用全局Session.view缓存：同revision flags会变、detached快照可被调用者自行修改，且测量贡献低，不适合作为本次根治。没有授权时停留提案，不改production/原tests/核心/原P3。
