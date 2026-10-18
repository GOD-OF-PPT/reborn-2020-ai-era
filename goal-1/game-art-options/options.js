'use strict';

const frame = document.querySelector('.game-frame');
const modal = document.querySelector('#scene-modal');
const content = modal.querySelector('.modal-content');
const image = frame.querySelector('.world-art');
const feedback = frame.querySelector('.feedback');
let direction = 'a';
let trigger = null;
let noticeTimer;

const directions = {
  a: { name: '长日重启', description: '电影叙事场景 / 物件探索 + 关键抉择', image: 'a-cinematic-room-v1.jpg', alt: '清晨的租屋，电脑、书架、床和通向城市的门', kicker: 'PROLOGUE / 序章', title: '如果人生，<br>可以再来一次。', sub: '窗外还是熟悉的城市。<br>这一次，选择权在你手里。', place: '出租屋 · 城市清晨', narrator: '你 · 内心独白', line: '你在旧房间醒来。电脑还亮着，日历回到了2020年。', aside: '一切还没开始。一切，都来得及。', cta: '从今天开始', spots: [ ['routes','电脑 · 经营',76,49], ['city','门外 · 城市',37,40], ['journal','书架 · 记忆',22,44], ['life','床边 · 生活',21,65] ] },
  b: { name: '街区人生', description: '等距城市经营 / 地点导航 + 空间成长', image: 'b-isometric-district-v1.jpg', alt: '等距中国街区，左上出租屋、中央咖啡馆、右上办公楼与右下小店', kicker: '你的第一处落脚点', title: '从一间出租屋，<br>走进一座城。', sub: '先安顿生活，再寻找自己的机会。', place: '城市街区 · 住所附近', narrator: '当前地点 / 出租屋', line: '从一间出租屋，走进一座城。', aside: '点击建筑，决定接下来去哪里、做什么。', cta: '进入住所', spots: [ ['life','我的出租屋',16,23], ['people','街角咖啡馆',60,45], ['work','办公楼',85,31], ['city','城市街道',44,63] ] },
  c: { name: '像素旧时光', description: '像素生活RPG / 街景互动 + 对话选择', image: 'c-pixel-neighborhood-v1.jpg', alt: '像素冬日街景，左侧租屋电脑、门口主角、右侧咖啡馆和公交站', kicker: '第一章 / 又见2020', title: '熟悉的街道，<br>新的存档。', sub: '', place: '老街 · 住所门口', narrator: '你', line: '……2020年？我记得，这一年才刚刚开始。', aside: '走近熟悉的人与事，重新选择自己的人生。', cta: '开始探索', spots: [ ['routes','电脑',20,48], ['life','回到家中',28,63], ['people','街角的人',66,50], ['city','公交站',87,52] ] },
};
const esc = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function setDirection(next) {
  if (!Object.hasOwn(directions, next)) return;
  direction = next;
  const d = directions[next];
  document.body.dataset.direction = next;
  frame.dataset.direction = next;
  frame.setAttribute('aria-label', `${next.toUpperCase()} ${d.name}游戏界面设计`);
  document.querySelectorAll('[data-direction]').forEach(button => {
    if (button.tagName === 'BUTTON') button.setAttribute('aria-pressed', String(button.dataset.direction === next));
  });
  frame.classList.remove('image-error');
  frame.querySelector('.image-fallback').hidden = true;
  image.src = `assets/${d.image}`;
  image.alt = d.alt;
  frame.querySelector('.chapter-kicker').textContent = d.kicker;
  frame.querySelector('h1').innerHTML = d.title;
  frame.querySelector('.chapter-copy p').innerHTML = d.sub;
  frame.querySelector('.scene-place').textContent = d.place;
  frame.querySelector('.narrator-label').textContent = d.narrator;
  frame.querySelector('.narrator p').textContent = d.line;
  frame.querySelector('.narrator small').textContent = d.aside;
  frame.querySelector('.scene-dialogue .main-action').innerHTML = `${esc(d.cta)} <span aria-hidden="true">→</span>`;
  frame.querySelector('.hotspots').innerHTML = d.spots.map(([key,label,x,y]) => `<button class="hotspot" data-open="${key}" style="left:${x}%;top:${y}%"><span class="dot" aria-hidden="true"></span><span class="hotspot-label">${esc(label)}</span></button>`).join('');
  document.querySelector('#direction-description').textContent = `${next.toUpperCase()} · ${d.description}`;
  feedback.classList.remove('visible');
  clearTimeout(noticeTimer);
}

function choices() {
  return `<h2 id="modal-title">今天，从什么开始？</h2><p>你带着对未来的记忆回来，生活却仍然需要一步一步往前走。</p><div class="choice-list">${choice('life','01','先照顾好自己','休整、居住环境与个人生活')}${choice('routes','02','看看新的机会','五条路线，各有自己的时机')}${choice('city','03','走进这座城市','工作、人物与生活的连接')}</div>`;
}
function choice(key, number, title, detail) { return `<button class="choice" data-panel="${key}"><span class="number">${number}</span><span><strong>${title}</strong><small>${detail}</small></span><span class="arrow" aria-hidden="true">›</span></button>`; }
function routes() {
  const items = [['stock','A股AI股票','模拟行情 · 研究与交易'],['video','AI生成短视频','内容积累 · 工具按年代开放'],['course','AI卖课','有案例后，再作教学承诺'],['relay','API中转站','供应许可、真实履约与旧义务'],['deepseek','DeepSeek生态 / 架空股权','2025机会 · 股权前提另验']];
  return `<h2 id="modal-title">小小的电脑，新的世界。</h2><p>机会有各自的年份和门槛。你可以提前准备，但不能提前拥有未来的工具。</p><div class="route-list">${items.map(([key,label,detail])=>`<button data-panel="route-${key}"><span>${label}</span><small>${detail} ›</small></button>`).join('')}</div><div class="dialog-actions"><button class="quiet-button" data-panel="choices">返回今天的选择</button></div>`;
}
function renderPanel(key) {
  if (key === 'choices') return choices();
  if (key === 'routes') return routes();
  if (key === 'life') return `<h2 id="modal-title">让生活慢一点。</h2><p class="lead">先把自己照顾好，再去追赶时代。</p><div class="choice-list">${choice('rest','01','给自己一次休整','个人支出 ¥0 · 1点行动 · 7日')}${choice('room','02','看看居住环境','实际改善完成后，场景才会变化')}</div><div class="dialog-actions"><button class="quiet-button" data-panel="choices">返回选择</button></div>`;
  if (key === 'rest') return `<h2 id="modal-title">给自己一次休整</h2><p>七天时间，放下手头的事。这是一段真正需要留出时间的选择。</p><dl class="preview-facts"><div><dt>个人现金 · 预览</dt><dd>26,000 <small>无需支出</small></dd></div><div><dt>季度行动 · 预览</dt><dd>3 / 4 <small>−1点</small></dd></div><div><dt>预计结束日期</dt><dd>01 / 08</dd></div></dl><p class="detail-note">设计演示：展示确认前的代价和日期。实际执行与完成仍需正式游戏命令。</p><div class="dialog-actions"><button class="quiet-button" data-panel="life">再想想</button><button class="main-action" data-demo-confirm>演示确认反馈 →</button></div>`;
  if (key === 'room') return `<h2 id="modal-title">这间小屋，也是人生的一部分。</h2><p>从现在的居住环境开始。新的灯光、书桌和房间细节，将由实际完成的生活选择逐渐改变。</p><div class="detail-note">当前仍是普通出租屋。样稿不预先展示已经改善的状态。</div><div class="dialog-actions"><button class="quiet-button" data-panel="life">回到生活选择</button></div>`;
  if (key === 'money') return `<h2 id="modal-title">口袋里的底气</h2><div class="money-lines"><div><span>个人现金</span><b>¥26,000</b></div><div><span>企业账户</span><span>尚未开设</span></div><div><span>未来到账</span><span>不计入当前可花现金</span></div></div><p>主画面只显示最需要知道的数；打开账本时，再看完整主体、保护占款与每笔来去。</p><div class="dialog-actions"><button class="quiet-button" data-panel="choices">回到今天</button></div>`;
  if (key === 'action-points') return `<h2 id="modal-title">一个季度，四次选择。</h2><p>当前剩余4点行动。行动需要实际日期，开始也不代表已经完成。</p><p>你可以用这些时间维持工作、准备机会、履行承诺，也可以留给自己的生活。</p><div class="dialog-actions"><button class="main-action" data-panel="choices">安排今天 →</button></div>`;
  if (key === 'city') return `<h2 id="modal-title">门外，是重新开始的人生。</h2><p>住所、工作与朋友，通过这座城市连接起来。地点负责引导，具体选择再告诉你需要付出什么。</p><div class="choice-list">${choice('work','01','继续工作','工资按实际在岗日结算')}${choice('people','02','去街角看看','人物需要共同经历，不能一键成为好友')}${choice('routes','03','寻找机会','五条财富路线都在这个世界里')}</div>`;
  if (key === 'work') return `<h2 id="modal-title">先让生活稳下来。</h2><p>工作是早期生活的一种选择。正式界面会在确认前展示行动占用、实际工作日期和现金预览。</p><div class="detail-note">工资按实际在岗日结算，不把未来工资变成今天的钱。</div><div class="dialog-actions"><button class="quiet-button" data-panel="city">回到城市</button></div>`;
  if (key === 'people') return `<h2 id="modal-title">这座城，还有未讲完的故事。</h2><p>唐萤、林舟、许澄、陈屿。你会在不同经历里与他们相遇；每个人也有自己的时间、目标与拒绝。</p><p class="detail-note">当前新局不假装已经结识所有人。选定风格后，人物立绘、场景出场与对话将统一制作。</p><div class="dialog-actions"><button class="quiet-button" data-panel="city">回到街上</button></div>`;
  if (key === 'journal') return `<h2 id="modal-title">未来，先留在记忆里。</h2><p>你记得时代即将发生变化，但记忆不是已经兑现的收益，也不能替代行动。</p><div class="detail-note">这里承载已揭示新闻、局部历史记忆和年度人生记录。未发生的真相不会因打开手记而泄露。</div><div class="dialog-actions"><button class="quiet-button" data-panel="choices">回到今天</button></div>`;
  if (key === 'obligations') return `<h2 id="modal-title">记得，答应过的事。</h2><p>此新局设计样例暂无已接受约定。正式游戏里的期限、退款、旧债与风险，会在这里持续提醒；不能被风景或普通消息挤掉。</p><div class="dialog-actions"><button class="quiet-button" data-panel="choices">回到今天</button></div>`;
  if (key === 'chapter') return `<h2 id="modal-title">重生2020：AI时代</h2><p class="lead">财富会改变生活。选择，也会改变你。</p><p>2020—2025，五条财富路线、人物与生活、历史分岔和可选的AI风险。每个季度，从有限的时间中作出自己的选择。</p><div class="dialog-actions"><button class="main-action" data-panel="choices">回到人生 →</button></div>`;
  if (key === 'about') return `<h2 id="modal-title">你更想走进哪个世界？</h2><p>三套都以场景为主入口；当前是可操作的美术备选，选定后再接入全部正式页面和游戏流程。</p><div class="compare"><button data-compare="a"><strong>A · 长日重启</strong><small>半写实电影感；物件探索、底部叙事、关键选择。适合重生与人物故事，推荐方向。</small></button><button data-compare="b"><strong>B · 街区人生</strong><small>固定镜头2.5D街区；点击建筑进入经营与生活，空间成长更直观。场景制作量较高。</small></button><button data-compare="c"><strong>C · 像素旧时光</strong><small>像素街景、生活RPG与对话选择；年代感和游戏识别度更强，需统一重制人物与动画。</small></button></div>`;
  if (key.startsWith('route-')) {
    const values = {stock:['A股AI股票','研究、资格、未来撮合点与模拟行情。涨跌仍由同一世界推进，不能看完结果按旧价交易。'],video:['AI生成短视频','从内容与案例积累起步，按实际年代和本局资格使用工具。播放量不会直接变成现金。'],course:['AI卖课','案例、受众、样课与真实交付逐步形成课程。预款、退款、支持和旧义务不会被一张成功卡片抹去。'],relay:['API中转站','先核供应许可与技术准备，再面对真实用量、保护资金和停站义务。便捷操作不自动授予AI权限。'],deepseek:['DeepSeek生态与架空股权','2020年尚未到达2025机会。生态服务与架空股权分开，资格、融资前提、锁定和退出另行核对。']};
    const value=values[key.slice(6)];
    if (value) return `<h2 id="modal-title">${esc(value[0])}</h2><p>${esc(value[1])}</p><div class="detail-note">设计样稿：这里比较路线入口与信息层次，不发起业务或提前解锁。</div><div class="dialog-actions"><button class="quiet-button" data-panel="routes">返回五条路线</button></div>`;
  }
  return choices();
}
function showPanel(key, element) {
  if (!modal.open) trigger = element || document.activeElement;
  content.innerHTML = renderPanel(key);
  if (!modal.open) modal.showModal();
  modal.scrollTop = 0;
  modal.querySelector('.modal-top button').focus();
}
document.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (!button) return;
  if (button.dataset.direction) setDirection(button.dataset.direction);
  else if (button.dataset.compare) { const next=button.dataset.compare; modal.close(); setDirection(next); document.querySelector(`.directions [data-direction="${next}"]`).focus(); }
  else if (button.dataset.open) showPanel(button.dataset.open, button);
  else if (button.dataset.panel) showPanel(button.dataset.panel);
  else if (button.id === 'about') showPanel('about',button);
  else if (button.hasAttribute('data-demo-confirm')) {
    modal.close(); feedback.textContent='选择反馈演示结束 · 现金、行动与日期保持原样'; feedback.classList.add('visible');
    noticeTimer=setTimeout(()=>feedback.classList.remove('visible'),5000);
  }
});
modal.addEventListener('close',()=>{ if (trigger?.isConnected) trigger.focus(); });
document.querySelector('#text-mode').addEventListener('change', event => document.body.classList.toggle('text-only', event.target.checked));
document.querySelector('#motion-mode').addEventListener('change', event => document.body.classList.toggle('reduced-motion', event.target.checked));
image.addEventListener('error',()=>{frame.classList.add('image-error');frame.querySelector('.image-fallback').hidden=false;});
image.addEventListener('load',()=>{frame.classList.remove('image-error');frame.querySelector('.image-fallback').hidden=true;});
setDirection('a');
