'use strict';

// All data below are design frames. No storage, game runtime, network or command API is used.
const assetRoot = '../../../../assets/ui-redesign/';
const stages = [
  {name:'发现',date:'2020 / 01 / 01',title:'电脑里，多了一封委托。',kicker:'第一幕 / 一份手工剪辑与资料整理小单',line:'有人想请你剪一条短片。先看看报价，再决定要不要为它留出日子。',fact:'最迟1月5日答复；报价 ¥1,300，制作 ¥500、1点。接受不是完成或到账。',kind:'letter',object:'一封新委托',detail:'客户尚未具名 / 待你读过',caption:'一封还没有答应的来信。',available:4,reserved:0,used:0,choices:[['翻开发来的报价','confirm'],['先把工作与生活想清楚','work']],note:'可以不接。工作、生活和其他路线仍可同时安排。'},
  {name:'核对',date:'2020 / 01 / 01',title:'答应之前，先留好余地。',kicker:'走近来信 / 承诺尚未作出',line:'你将用一份时间，试一试手里的本事。先核对开工、成本和交付日。',fact:'最迟1月5日答复；固定当天开工，1月19日完成并提交。',kind:'letter',object:'摊开的报价',detail:'还未接受 / 还没有花钱',caption:'拿起报价，核对这一次承诺。',available:4,reserved:0,used:0,choices:[['核对钱与日子，再决定','confirm'],['再想一想，先不答应','back']],note:'本分镜不预选接受；确认纸片中仍可返回。'},
  {name:'安排',date:'2020 / 01 / 01',title:'日历上，为它留了一段空白。',kicker:'示例分镜 / 已安排，尚未开工',line:'1月5日再动手。现在留好成本和1点行动，还没有做出作品。',fact:'示例预留 ¥500、1点；未实付、未交付、未收款。',kind:'calendar',object:'留出的日子',detail:'01.05 开工 → 01.19 完成',caption:'安排留下了，成果还要等真实日子。',available:3,reserved:1,used:0,choices:[['复看1月5日的开工分镜','frame:3'],['等候时，看看别的人与事','life']],note:'翻到下一幅只是复看设计；正式游戏仍须经过原日期与费用结算。'},
  {name:'开工',date:'2020 / 01 / 05',title:'这条短片，开始一点点成形。',kicker:'示例分镜 / 付出以后，仍需等待',line:'制作已经开工。让这份作品慢慢做完，也可以把余下的时间留给别的事。',fact:'本分镜实付制作成本 ¥500、使用1点；预计1月19日完成。',kind:'waiting',object:'进行中的作品',detail:'已开工 / 等1月19日完成',caption:'尚未完成，也还没有交给客户。',available:3,reserved:0,used:1,choices:[['复看1月19日的作品分镜','frame:4'],['等待时，翻看生活与工作','life']],note:'等待有对象。原生活费、工资日、期限与其他义务不会被跳过。'},
  {name:'做完',date:'2020 / 01 / 19',title:'作品做好了。还差你的决定。',kicker:'示例分镜 / 实际完成，尚未提交',line:'文件已经留在桌上。要不要把这一份交给客户，仍由你亲手决定。',fact:'制作成本已付 ¥500；提交不再占行动。完成不等于客户验收。',kind:'work',object:'完成的短片',detail:'等待你提交 / 还未收款',caption:'做完与交出去，是两个不同的时刻。',available:3,reserved:0,used:1,choices:[['核对并提交这份作品（分镜）','submit'],['先翻看原委托','records']],note:'这一幅不自动发送作品；可复看、再核对，原交付期限仍保留。'},
  {name:'提交',date:'2020 / 01 / 19',title:'作品交出去了，等客户回信。',kicker:'示例分镜 / 已提交，复核尚未发生',line:'这次不必反复提交。下一处反馈是客户复核，示例时间为1月20日。',fact:'报价仍不是收入；未形成实收。本分镜行动点不再扣一次。',kind:'waiting',object:'已经发出的作品',detail:'01.20 客户复核 / 待实际发生',caption:'发送记录留在这里，回款还没有到来。',available:3,reserved:0,used:1,choices:[['复看客户复核分镜','frame:6'],['先去看看生活里的事','life']],note:'此教学单满足真实交付条件后固定接受；逾期、中断另行处理，后续订单不保证盈利。'},
  {name:'复核',date:'2020 / 01 / 20',title:'这份示例作品，客户接受了。',kicker:'设计示例 / 同次已保存结果的阅读顺序 1/2',line:'1月20日一次推进同时确认验收与付款。先读验收事实：按时交付已被接受，¥1,300也已随同次结果收到。',fact:'这是同一结果的拆读；不新增等待，不存在额外收款动作。',kind:'work',object:'客户的复核回信',detail:'验收与收款同次成立 / 先读验收',caption:'同次回执，分开读清验收事实与实收记录。',available:3,reserved:0,used:1,choices:[['另读同次回响中的实收','frame:7'],['翻看复核与原账记录','records']],note:'此教学单满足真实交付条件后固定接受；本幅不是可停留的应收经营状态。'},
  {name:'到账',date:'2020 / 01 / 20',title:'一笔小小的回报，真的留下了。',kicker:'设计示例 / 同次已保存结果的阅读顺序 2/2',line:'收到客户付款¥1,300。减去这单已付的¥500，留下¥800；它只是这一单的结果。',fact:'收到客户付款 ¥1,300 − 制作成本 ¥500 = 本单净额 ¥800。',kind:'receipt',object:'一张收款凭证',detail:'实收 ¥1,300 / 本单净额 ¥800',caption:'工资、生活费、持仓与别的生意，不混进这张凭证。',available:3,reserved:0,used:1,choices:[['把这份手艺，再试一次？','continue'],['先安顿本季工作与生活','work'],['查看别的路','routes']],note:'原子结果示例的第2层阅读，不是另一次保存。没有保证下一单，也没有额外行动点。'},
  {name:'再想',date:'2020 / 01 / 20',title:'下一季，想把什么继续下去？',kicker:'设计提问 / 此刻仍在第一季',line:'这次尝试，离你想要的生活近了一点吗？可以延续手艺，也可以调整安排。',fact:'这是为季末预留的问题，尚未进入下一季；旧日期、费用和责任仍需经过。',kind:'portfolio',object:'留给自己的问题',detail:'继续 / 调整 / 留给生活',caption:'收好这一单，不必立刻把五条路全走一遍。',available:3,reserved:0,used:1,choices:[['把这份手艺，再试一次','continue'],['先把工作与生活安顿好','work'],['翻看别的路，再作打算','routes']],note:'愿望引导取舍，不设必做路线；正常流程仍需走完本季再进入下一季。'}
];

const people = [
  ['唐萤','tang-ying-cinematic-v1.jpg','人与人的关系，要从实际相识与共同经历开始。'],
  ['林舟','linzhou-cinematic-v1.jpg','对工具与合作的判断，需要自己的准备和实际选择。'],
  ['许澄','xu-cheng-cinematic-v1.jpg','同行有自己的作品和边界，不是免费的生产资源。'],
  ['陈屿','chen-yu-cinematic-v1.jpg','合作、权限与责任，应当分别核对。']
];
const routes = [
  ['A股AI股票','market','先读公开产业线索，再研究模拟委托；价格、撮合与交收分别发生。','查看投资首幕分镜','investment'],
  ['AI生成短视频','video','先做当时能力支持的作品，付出时间与成本，再面对客户或平台。','回到手工小单分镜','manual'],
  ['AI卖课','course','从真实案例、大纲与样课开始；招生、预款、教学和退款各有责任。','留作可选路线',null],
  ['API中转站','relay','从许可、供应与客户承诺开始；客户充值不是利润，服务之后才核账。','留作可选路线',null],
  ['DeepSeek生态与架空股权','deepseek','生态合作与明确架空权益分开；实际年代、资格和对方意愿须各自成立。','留作可选路线',null]
];
const years = [
  ['2020','怎样先站稳？','想把多少时间留给工作，多少留给一次自己的尝试？'],
  ['2021','什么值得继续？','回看真实做过的事，再决定是否重复；不预示未来收益。'],
  ['2022','新工具值得我投入什么？','把学习、材料、资金与时间摆在一起，不把热度当收入。'],
  ['2023','我想怎样参与变化？','选择自己的作品、服务或生活，不要求走同一条路。'],
  ['2024','什么能重复，什么边界要亲自守？','例行与代理都来自明确授权，也可以选择不采用。'],
  ['2025','这些年，留下了什么？','回看财富与生活，旧合同、应收和义务仍要分别收好。']
];
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let branch='manual', frame=0, paperKind='', paperIndex=0, returnFocus=null;
const notes={manual:'先试一份手艺，也把生活留稳。',investment:'先理解产业，也给生活留下余地。',free:'先把时间，留给自己在意的事。'};

function currentScene(){
  if(branch==='manual')return stages[frame];
  if(branch==='investment')return {name:'投资首幕',date:'2020 / 01 / 01',kicker:'另一种起步 / 先看投资',title:'先看产业，再留一个仓位。',line:'记得一些趋势，也不能知道明天的价格。先研究公开线索，留好生活的钱。',fact:'模拟股票分镜：研究 → 明确委托 → 后续撮合 → 交收。不演示保证成交或收益。',kind:'portfolio',object:'窗前的一本笔记',detail:'公开线索 / 尚未研究或下单',caption:'翻阅不等于交易；这条路也能成为第一幕。',available:4,reserved:0,used:0,choices:[['翻看研究与委托的分镜','invest'],['也想保留这一季工作','work'],['先不下单，看看别的安排','free']],note:'投资分支只展示步骤与边界；真实价格、费用、资格由正式规则核验。'};
  return {name:'自由首幕',date:'2020 / 01 / 01',kicker:'另一种起步 / 自由安排',title:'这一次，先决定怎样过日子。',line:'不必立刻接单或买股。可以保留工作、看看生活，也可以暂不新增承诺。',fact:'四点是时间的取舍。工作与副业可以组合；阅读与探索不消费行动。',kind:'calendar',object:'还没写满的日历',detail:'工作 / 一次尝试 / 自己的生活',caption:'空白也是选择，原生活费用与期限照常。',available:4,reserved:0,used:0,choices:[['先看工作与生活的底线','work'],['把一段时间留给生活','life'],['暂不新增承诺，环顾别的路','routes']],note:'这些念头只打开分镜，不替你接受工作、付款或安排任务。'};
}

function renderScene(focus=false){
  const s=currentScene();
  $('scene-date').textContent=s.date;
  $('ap-dots').innerHTML=Array.from({length:4},(_,i)=>{const state=i<s.available?'available':i<s.available+s.reserved?'reserved':'used';return `<li data-state="${state}" aria-label="${i+1}：${{available:'可用',reserved:'预留',used:'已用'}[state]}"></li>`}).join('');
  $('ap-caption').textContent=`示例 可用${s.available} / 预留${s.reserved} / 已用${s.used}`;
  $('intention-text').textContent=notes[branch];
  $('scene-kicker').textContent=s.kicker;$('scene-title').textContent=s.title;$('scene-line').textContent=s.line;$('scene-fact').textContent=s.fact;$('stage-note').textContent=s.note;
  $('story-object').dataset.kind=s.kind;$('story-object').setAttribute('aria-label','翻看'+s.object+'，设计分镜');
  $('object-overline').textContent=branch==='manual'?`0${frame+1} / ${s.name}`:'首幕 / 尚未承诺';$('object-title').textContent=s.object;$('object-detail').textContent=s.detail;$('object-caption').textContent=s.caption;
  $('thoughts').innerHTML=s.choices.map(([text,action],i)=>`<button type="button" class="thought ${i===0?'primary':''}" data-action="${action}"><b aria-hidden="true">0${i+1}</b><span>${escapeHtml(text)}</span><i aria-hidden="true">${action.startsWith('frame:')?'→':'↗'}</i></button>`).join('');
  document.querySelectorAll('[data-branch]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.branch===branch)));
  $('chapters').innerHTML=stages.map((s,i)=>`<button type="button" data-frame="${i}" ${branch==='manual'&&frame===i?'aria-current="step"':''} aria-label="复看第${i+1}幅：${s.name}，不结算时间">${s.name}</button>`).join('');
  $('previous-scene').disabled=branch==='manual'&&frame===0;$('next-scene').disabled=branch==='manual'&&frame===stages.length-1;
  $('frame-number').textContent=branch==='manual'?`${frame+1} / ${stages.length}`:'首幕';
  const voice=document.querySelector('.scene-voice');voice.classList.remove('arriving');void voice.offsetWidth;voice.classList.add('arriving');
  $('announcement').textContent=`设计分镜：${s.name}。${s.title}`;
  if(focus)$('scene-title').focus({preventScroll:true});
}

function goFrame(next){branch='manual';frame=Math.max(0,Math.min(stages.length-1,next));returnFocus=null;closePaper();renderScene(true)}
function goBranch(next){branch=next;frame=0;returnFocus=null;closePaper();renderScene(true)}
function terms(entries){return `<dl class="terms">${entries.map(([k,v])=>`<dt>${escapeHtml(k)}</dt><dd>${escapeHtml(v)}</dd>`).join('')}</dl>`}
function button(label,fn,primary=false){const b=document.createElement('button');b.type='button';b.textContent=label;if(primary)b.className='primary';b.addEventListener('click',fn);return b}
function pageNav(total){$('paper-page').textContent=`${paperIndex+1} / ${total}`;const previous=button('← 上一页',()=>{paperIndex--;renderPaper()});previous.disabled=paperIndex===0;const next=button('下一页 →',()=>{paperIndex++;renderPaper()});next.disabled=paperIndex===total-1;$('paper-actions').append(previous,next)}
function openPaper(kind,index=0){paperKind=kind;paperIndex=index;if(!$('paper-dialog').open)returnFocus=document.activeElement;renderPaper();if(!$('paper-dialog').open)$('paper-dialog').showModal();$('close-dialog').focus({preventScroll:true})}
function closePaper(){if($('paper-dialog').open)$('paper-dialog').close()}
function renderPaper(){
  const body=$('paper-body'),actions=$('paper-actions');body.innerHTML='';actions.replaceChildren();$('paper-page').textContent='';$('paper-kicker').textContent='设计纸片 / 翻阅不执行命令';
  if(paperKind==='confirm'){
    $('paper-title').textContent='这一次，要怎样答应？';
    body.innerHTML='<p>一份手工剪辑与资料整理小单。最迟1月5日答复，未处理会于1月6日过期；客户未具名。</p>'+terms([['现在确认时','预留制作预算 ¥500、1点行动'],['1月5日开工','实际支付 ¥500，预留转为已用1点'],['1月19日','制作完成；仍需你亲手提交'],['1月20日','按条件固定接受；同次推进分别列复核与实收'],['报价','¥1,300；未履约、未收到前不计实收']])+'<p class="quiet">这是固定设计示例。确认后只翻到“已安排”分镜，不改变真实游戏。</p>';
    actions.append(button('先不答应，回到原分镜',closePaper),button('选择这份安排 · 看分镜',()=>goFrame(2),true));
  }else if(paperKind==='submit'){
    $('paper-title').textContent='把这份作品交出去？';body.innerHTML='<p>示例1月19日：制作已经完成，这次只提交同一份作品。</p>'+terms([['已经发生','制作成本 ¥500、1点已用'],['本次提交','不再扣行动；不直接收到客户款'],['下一反馈','1月20日客户复核；结果尚未发生']])+'<p class="quiet">此教学单满足真实交付条件后固定接受；逾期、中断及真实保存按原规则处理。</p>';actions.append(button('再核对一下',closePaper),button('提交这份作品 · 看分镜',()=>goFrame(5),true));
  }else if(paperKind==='object'){
    const s=currentScene();$('paper-title').textContent=s.object;body.innerHTML=`<p class="scene-paper-date">${escapeHtml(s.date)} / ${escapeHtml(s.name)}</p><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.line)}</p><blockquote>${escapeHtml(s.fact)}</blockquote><p class="quiet">${escapeHtml(s.note)}</p>`;
    const [label,action]=s.choices[0];actions.append(button('收好，回到这一幕',closePaper),button(label,()=>act(action),true));
  }else if(paperKind==='records'){
    const s=currentScene();const pages=[
      ['原委托 / 约定与报价','手工剪辑与资料整理小单。报价¥1,300；客户未具名，不补写客户身份。',terms([['1月1日—5日','可答复；接受先预留，未处理1月6日过期'],['1月5日','开工，实付¥500、使用1点'],['1月19日','制作完成，最迟当天亲手提交'],['1月20日','同次推进列复核与实收；分镜只拆阅读顺序']])],
      ['这幅分镜的钱','只列本单，既不制造全局总现金，也不把未来报价当可花钱。',terms([['未开工前','¥500为预留，尚未实付'],['开工后','制作成本实付¥500'],['1月20日同次结果','验收成立且已收到¥1,300，不存在可停留的应收中间态'],['实际收款后','实收¥1,300；本单净额¥800']])],
      ['四点与实际日期','这里只描述正在查看的这一幅分镜。翻页和查看人物不改变它。',terms([['当前分镜',s.date+' / '+s.name],['本季四点',`可用${s.available} / 预留${s.reserved} / 已用${s.used}`],['不自动恢复','收款、翻页、看人物都不会补行动'],['原规则仍在','工资、生活费、期限、交付屏障需分别经过']])],
      ['原责任，不能从场景里消失','分镜不列完整账本；未画出不代表金额为零、义务已清或已获得资格。','<p class="record-note">正式实现须保留分账户、到期缺口、跨季承诺、原记录分页及同对象导航。未来收入不得支撑当前消费。</p><p>模拟市场与明确架空权益持续标识；不读取私人备注或存档。</p>'],
      ['失败与只读 / 状态样张','这是静态状态语言，不是刚刚发生的故障。','<blockquote>未保存 · 原场景保留</blockquote><p>候选失败时不更新物件、不播成功，按原身份提供重试。</p><blockquote>仅翻阅 · 当前只读</blockquote><p>仍能查看人物与完整原账；付费、承诺和权限决定明确不可执行。</p>']
    ];const p=pages[paperIndex];$('paper-title').textContent=p[0];body.innerHTML=`<p>${p[1]}</p>${p[2]}`;pageNav(pages.length);
  }else if(paperKind==='people'){
    const p=people[paperIndex];$('paper-title').textContent='人物，也有自己的日子';body.innerHTML=`<div class="person-page"><div><p class="person-index">人物设计索引 / 不表示开局已经相识</p><h3>${p[0]}</h3><p>${p[2]}</p><p class="quiet">本页只翻阅已有原创肖像。不新增关系、承诺、对白、材料或免费帮助。</p></div><img src="${assetRoot}portraits/${p[1]}" alt="${p[0]}的原创人物肖像"></div>`;pageNav(people.length);
  }else if(paperKind==='years'){
    const y=years[paperIndex];$('paper-title').textContent='六年，六个可以慢慢回答的问题';body.innerHTML=`<span class="year-number">${y[0]}</span><p class="year-question">${y[1]}</p><p>${y[2]}</p><p class="quiet">叙事提问页，不是年份解锁、未来新闻或实际年度成绩；不公开隐藏结果。</p>`;pageNav(years.length);
  }else if(paperKind==='routes'){
    const r=routes[paperIndex];$('paper-title').textContent='别的路，也可以慢慢看';body.innerHTML=`<div class="route-page"><div><h3>${r[0]}</h3><p>${r[2]}</p><p class="quiet">查看不等于投入。五路线皆可选，不要求全部完成，也不限制经营项数。</p></div><img src="${assetRoot}cinematic/game-scenes/${r[1]}-v1.jpg" alt="${r[0]}原创场景插画"></div>`;pageNav(routes.length);actions.append(button(r[3],()=>r[4]?goBranch(r[4]):closePaper(),true));
  }else if(paperKind==='invest'){
    const p=[['先做研究','从公开线索提出自己的判断。费用、资源与日期须在真实确认中列明；本样稿不代填价格或资格。'],['明确一份模拟委托','买什么、数量、限价与账户分别选，再确认占款。报价、委托与成交不是同一个状态。'],['等后续有效撮合，再看交收','可能未成交或部分成交；已成交数量、撤剩余和资金交收分开。本分镜不制造仓位或收益。']][paperIndex];$('paper-title').textContent=p[0];body.innerHTML=`<p class="scene-paper-date">投资首幕 / 设计步骤</p><blockquote>${p[1]}</blockquote><p>工作、生活与其他经营仍能按真实预算组合；投资不必替代它们。</p><p class="quiet">本样稿只展示投资路径，不运行市场。原记录与实际反馈在正式游戏中核验。</p>`;pageNav(3);
  }else if(paperKind==='work'||paperKind==='life'){
    const life=paperKind==='life';$('paper-title').textContent=life?'等候时，日子也属于你':'工作和自己的尝试，可以并存';
    body.innerHTML=life?'<p>看看自己、在意的人和已经答应的事。尚未实际相识的人，不凭肖像就变成朋友。</p>'+terms([['暂时翻阅','不花钱，不占行动，也不推进日期'],['真正安排时','显选对象、资源、费用和日期，另行确认'],['已经答应的事','保留原承诺与完成日，不把计划当相处成果']]):'<p>保留工作，可以与小单同季安排。这里先看取舍，不默认已经在岗。</p>'+terms([['季度工作','另占2点，仍须独立确认'],['工资','按实际在岗日期，于月末结算'],['生活底线','原生活费与到期义务仍需承担'],['自己的尝试','共享四点与日期，不是互斥人生按钮']]);
    actions.append(button('翻看人物',()=>openPaper('people')),button('收好，回到原分镜',closePaper,true));
  }else if(paperKind==='continue'){
    $('paper-title').textContent='把这份手艺，再试一次？';body.innerHTML='<p>这笔小单留下了一次实际交付的经历。接下来，可以看看新的作品需求，也可以先安顿生活。</p><blockquote>我愿意再为这件事，留出怎样的时间？</blockquote><p class="quiet">这是设计提问。不是再接同一首单，也不保证当季已有新客户；正式游戏仍核前提、材料、资金与日期。</p>';actions.append(button('看看别的路线',()=>openPaper('routes')),button('看下季问题分镜',()=>goFrame(8),true));
  }else if(paperKind==='intention'){
    $('paper-title').textContent='这一季，先在意哪一件事？';body.innerHTML='<p>本季意图是一条可以调整的叙事线，不是必须清空的任务列表，也不限制你能经营几项。</p><blockquote>'+escapeHtml(notes[branch])+'</blockquote><p class="quiet">下面只切换首幕分镜；不会接受工作、接单或下投资委托。</p>';actions.append(button('一份手艺',()=>goBranch('manual')),button('先看投资',()=>goBranch('investment')),button('自由安排',()=>goBranch('free')));
  }else if(paperKind==='settings'){
    $('paper-title').textContent='让阅读，按自己的节奏';body.innerHTML='<label class="setting-row"><input type="checkbox" id="text-setting"><span>纯文本模式<small>隐藏场景和人物插画，保留全部文字、物件入口与分页。</small></span></label><label class="setting-row"><input type="checkbox" id="motion-setting"><span>减少动效<small>取消位移与过渡；系统减少动效设置也会生效。</small></span></label><p class="quiet">设置只在当前样稿页面生效，不写入游戏或浏览器存档。</p>';$('text-setting').checked=document.body.classList.contains('text-only');$('motion-setting').checked=document.body.classList.contains('reduced-motion');$('text-setting').addEventListener('change',e=>document.body.classList.toggle('text-only',e.target.checked));$('motion-setting').addEventListener('change',e=>document.body.classList.toggle('reduced-motion',e.target.checked));actions.append(button('收好设置',closePaper,true));
  }
}
function act(action){if(action.startsWith('frame:')){goFrame(Number(action.split(':')[1]));return}if(action==='back'){goFrame(0);return}if(action==='free'){goBranch('free');return}openPaper(action)}
document.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;if(b.dataset.open)openPaper(b.dataset.open);if(b.dataset.branch)goBranch(b.dataset.branch);if(b.dataset.action)act(b.dataset.action);if(b.dataset.frame!==undefined)goFrame(Number(b.dataset.frame))});
$('story-object').addEventListener('click',()=>openPaper(branch==='manual'&&frame<=1?'confirm':'object'));
$('close-dialog').addEventListener('click',closePaper);
$('paper-dialog').addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true})});
$('previous-scene').addEventListener('click',()=>goFrame(branch==='manual'?frame-1:0));
$('next-scene').addEventListener('click',()=>goFrame(branch==='manual'?frame+1:0));
document.addEventListener('keydown',event=>{if(event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.repeat||event.isComposing)return;if($('paper-dialog').open)return;if(event.target.closest('input,select,textarea,[contenteditable]'))return;if(event.key==='ArrowLeft'){event.preventDefault();goFrame(branch==='manual'?frame-1:0)}else if(event.key==='ArrowRight'){event.preventDefault();goFrame(branch==='manual'?frame+1:0)}else if(/^[1-3]$/.test(event.key)){const b=$('thoughts').querySelectorAll('button')[Number(event.key)-1];if(b){event.preventDefault();b.click()}}});
renderScene();
