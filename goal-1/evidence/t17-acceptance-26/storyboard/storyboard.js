'use strict';

// Authored design frames only. No game state, finance or persistence is connected.
const frames = [
  {
    id: 'planned', nav: '已安排', chapter: '01 / 开工之前',
    title: '把这期服务，认真留在日历。',
    state: '设计情境：已安排 · 尚未实际开工',
    line: '有了服务约定，还没有发生请求。',
    detail: '客户、供应顺序、容量与成本授权上限都要明确；原支持也有自己的资源和日期。',
    date: '下一反馈：以原开工日期为准。分镜不填写假日期。',
    object: '日历票夹 · 虚线表示等待开工', mark: '▦',
    primary: '看开工前的这份约定', caption: '先看承诺，再看真实投入与原确认', panel: 'planned'
  },
  {
    id: 'running', nav: '进行中', chapter: '02 / 守住服务边界',
    title: '线路在走，承诺仍有边界。',
    state: '设计情境：已经开工 · 不是完成',
    line: '允许多少，与实际发生多少，是两件事。',
    detail: '只把已保存的服务日写进票据。供应预算不是费用，报告用量也还不是独立实计。',
    date: '下一反馈：原公开日历中的下一处记录；沿途费用和屏障仍发生。',
    object: '服务票仍在 · 原支持与旧余额继续', mark: '◷',
    primary: '看下一次反馈要等什么', caption: '等待仍沿原日期、费用与真实屏障', panel: 'running'
  },
  {
    id: 'metering', nav: '计量', chapter: '03 / 把发生的事留下',
    title: '每一次连接，都有一张原账。',
    state: '设计情境：已有报告 · 实计尚待复核',
    line: '先看已经发生的记录，再决定查哪一段。',
    detail: '票据保留当日供应、原价格与报告用量。未完成独立复核之前，实计写“待核”，不写零。',
    date: '下一反馈：所选复核任务的原完成日期，以真实预览为准。',
    object: '纸白计量票 · 已知与待核分开', mark: '≋',
    primary: '看怎样委托这份原计量', caption: '明确范围、资源与日期；后来请求不自动加入', panel: 'metering'
  },
  {
    id: 'audit', nav: '复核', chapter: '04 / 让原记录回答',
    title: '把这两张账，认真放在一起。',
    state: '设计复看：等待复核／已知差额，分别阅读',
    line: '完成独立核对以后，才有依据更正。',
    detail: '原报告不被擦掉。实际揭示的差额另作记录，客户侧与供应侧也不混成一笔现金。',
    date: '下一反馈：完成回执及更正回执各自的实际日期。',
    object: '两层原票据 · 更正不代替到账', mark: '?',
    primary: '翻开复核与更正的两层纸', caption: '明确哪些已知，哪些还须真正等待', panel: 'audit'
  },
  {
    id: 'paid', nav: '回款', chapter: '05 / 认收与现金',
    title: '这笔钱，来自哪一张旧账？',
    state: '回执设计示意 · 未读取任何实际款项',
    line: '预付的确认收入，与后付的到期回款，要分开读。',
    detail: '没有真实回执就不填写金额或到账日期。收款范围也不能从一个账期标题推断。',
    date: '金额、账户与日期：一律以实际原回执为准。',
    object: '双线回执边 · 不宣称钱已经到账', mark: '回',
    primary: '选择要复看的两种回款口径', caption: '只切换设计解释，不改客户原合同', panel: 'paid'
  },
  {
    id: 'stopped', nav: '已停止', chapter: '06 / 停下之后',
    title: '停下请求，不会收走承诺。',
    state: '设计情境：本期停止 · 旧责任仍需核对',
    line: '线路可以停，原来的账不能凭空消失。',
    detail: '原支持、未消费余额、供应资产和应收应付各自保留；暂停交通与停站收尾也要分别决定。',
    date: '下一反馈：按原支持、退款、应收应付和收尾日期继续。',
    object: '停止角签 · 没有盖成“已清账”', mark: '停',
    primary: '看停下之后还留着什么', caption: '有限退出，也面对原成本与承诺', panel: 'stopped'
  }
];

const byId = id => document.getElementById(id);
const dialog = byId('paper-dialog');
const paperBody = byId('paper-body');
let frameIndex = 0;
let panelKey = null;
let pageIndex = 0;
let returnFocus = null;
let paymentReading = null;
const preferences = { text: false, motion: false };

const terms = entries => '<dl>' + entries.map(([name, value]) => '<dt>' + name + '</dt><dd>' + value + '</dd>').join('') + '</dl>';
const page = (title, content) => '<h3 tabindex="-1">' + title + '</h3>' + content;

const panels = {
  planned: {
    title: '把这期约定摊开',
    pages: [
      page('先明确，究竟替谁承担什么',
        '<p>本分镜始终围绕同一中转站、同一服务账期。正式实现须显选原客户、已保存报价、供应顺序与备援，不替你默认第一份合同。</p>' +
        terms([['当前主体', '同一中转站；实际名称与账户由原记录明确'], ['账期范围', '开始与结束日期依原约定'], ['容量与预算', '本期授权上限；不是已发生用量或费用']])),
      page('钱和日历，要并排写清',
        terms([['服务资源', '本人或实际在岗资源，须明确选择'], ['本期投入', '原预览列出自有资金与开工季度行动'], ['原支持', '另列真实资源、日期、资金与跨季度行动']]) +
        '<p>客户未消费充值不能替代应先准备的自有资金；已经预留的原支持不再重复安排。</p>'),
      page('正式确认，才把承诺交给原规则',
        '<p>原确认要保留主体、客户与报价版本、供应顺序、容量、成本上限、服务及支持的资源日历。资金、行动、许可与冲突由真实预览核对。</p>' +
        '<p>正式运行时只有确认并成功保存后，才显示“已安排”；开工、计量、支持与回款仍分别发生。</p>' +
        '<p class="quiet">这里没有真实执行按钮。合上后仍回本张“已安排”设计分镜。</p>')
    ]
  },
  running: {
    title: '等下一次真实反馈',
    pages: [
      page('只写已经发生的服务日',
        '<p>这张纸只呈现已提交的原服务记录：发生日期、实际使用的供应、报告用量及公开停止原因。备援在约定中存在，不代表它已经被使用。</p>' +
        terms([['供应成本上限', '授权边界，不是当期实际费用'], ['实际服务成本', '依已经发生的用量与原供价记录'], ['未发生的请求', '不补画，不提前记成收入']])),
      page('等待有对象，也有沿途责任',
        '<p>正式主动作应显示原公开日历中的下一反馈日期，经原 AdvanceTime 与支出确认。不能从这里直接跳到“全部完成”或绕开中间决定。</p>' +
        '<p>玩家仍可做别的事。原支持、工资、期限、客户保护和已发生费用继续留在同一份原记录。</p>' +
        '<p class="quiet">本页只复看等待的设计，不推进任何日期或行动。</p>')
    ]
  },
  metering: {
    title: '先看原票据，再决定怎么查',
    pages: [
      page('一条报告，应有自己的来源',
        terms([['服务日与供应', '依该条原记录的日期与实际供应'], ['报告用量', '依已保存报告；本样稿不填写假数值'], ['独立实计', '实际复核完成之前：待核']]) +
        '<p>原价格版本、故障与停止原因都能从完整原账分页翻到，不用新价格回写旧日子。</p>'),
      page('委托范围停在这次明确选择',
        '<p>正式近景让玩家明确选择原账期、可核的既有记录、真实资源和开工日期。当前可覆盖条数与预计完成日由原预览列出。</p>' +
        '<p>此后发生的请求不自动纳入。已经实际覆盖的原复核不能因翻页再收费，取消或中断则保留其真实状态。</p>'),
      page('复核也付出真实成本',
        terms([['费用与行动', '以原复核任务及确认预览为准'], ['开工与完成', '分别显示真实日期；预计不代表完成'], ['这一步的结果', '取得独立记录；不收取客户应收']]) +
        '<p class="quiet">本分镜没有资源或日期的默认提交，也没有调用复核命令。</p>')
    ]
  },
  audit: {
    title: '复核与更正，分两层读',
    pages: [
      page('委托已经留下，实计仍要等',
        '<p>在正式“已安排／进行中”状态，只展示已确认的范围、资源、资金／行动和下一原完成日期。第二层实计纸还没有展开。</p>' +
        '<p>“尚未复核”不能写成零差额，也不预示对方一定多报或少报。等待不替你再委托一次。</p>'),
      page('完成以后，才翻到这张对照',
        '<p>这是“真实复核已经完成”之后的设计情境，翻到本页不代表刚才真的经过了等待。</p>' +
        terms([['原报告', '保留原值与原价格来源'], ['已核实计', '只读实际完成回执'], ['若有已知差额', '朱红角签：待更正；不伪造差额金额']]) +
        '<p class="quiet">无差额也可翻回原账；不是每期都保证出现可收的钱。</p>'),
      page('追加更正，不擦掉旧报告',
        '<p>原确认分别列客户收入差额与供应成本差额，以及退款／应收、供应贷项／应付。它们不能并成一个“到账”数字。</p>' +
        '<p>正式更正成功保存后才标“已追加更正”。供应贷项仍可能是资产；客户现金是否已付，继续看实际原流水。</p>' +
        '<p class="quiet">这份样稿不执行更正，不生成计量或回执。</p>')
    ]
  },
  stopped: {
    title: '停下之后，把原承诺留下',
    pages: [
      page('停的是哪一件事，先说清',
        terms([['暂停交通', '不自动停止原支持或抹掉客户余额'], ['停止本期', '中断／取消本期原安排，依原账处理'], ['停站收尾', '另一项明确决定；满足原门槛才关闭']]) +
        '<p>不能把一只开关同时当成这三种命令。这里没有开关执行，只翻设计边界。</p>'),
      page('已经发生的事，不随纸片消失',
        '<p class="responsibility">原支持未完、未消费客户余额、供应资产、应收应付与已揭示待更正差额分别保留。真实到期或短缺须在主幕常显，不能塞进普通信息预算。</p>' +
        '<p>未开工取消和开工后中断分开读：原预留如何释放、哪些成本与行动已发生，都以实际回执为准。</p>'),
      page('有限退出，也有下一处反馈',
        '<p>正式实现应提供当前合法的原支持、退款、付款或有限推进出口。零行动也不免费补完服务，停止不自动清债。</p>' +
        '<p>账期收尾、企业关闭和客户余额去向分别核对。以后是否再接一期，仍须你重新作出承诺。</p>' +
        '<p class="quiet">合上后仍是本张停止分镜，未执行停止、退款或付款。</p>')
    ]
  },
  ledger: {
    title: '把这一期，放回完整原账',
    pages: [
      page('本期范围，与企业总余额分开',
        '<p>正式原册应定位同一主体、账期和当前步骤，保留原计量、支持、复核、更正及流水。目标过期时先解释并重新选择，不静默翻到别家企业或别期。</p>' +
        '<p>只有能准确关联的行才称“本期”。企业跨期余额明确写“本企业原余额”。</p>'),
      page('客户侧，钱也有不同状态',
        terms([['未消费充值', '客户保护与负债，不是利润'], ['已确认收入', '原实际服务／支持／更正的结果'], ['应收与实际现金', '按原到期日和实际收款流水分别列出']]) +
        '<p>本样稿不读取这些余额，所有金额与日期以实际原回执为准。</p>'),
      page('供应侧，也不能只看一个净数',
        terms([['供应预付与贷项', '资产不等于手上可花现金'], ['实际供应成本', '按原发生日期、供价和实计／更正核对'], ['应付与实际付款', '仍须原资金及到期责任处理']]) +
        '<p class="quiet">原册完整分页仍可到达；这几页只是结构分镜，不是假造完整账本。</p>')
    ]
  },
  elsewhere: {
    title: '先留一点余地，再回这一期',
    pages: [
      page('去做别的事，书签仍在原处',
        '<p>正式场景可以翻生活、工作或其它路线。只翻阅不花行动，不替你接受新工作、交易、融资或权限。</p>' +
        '<p>返回时仍匹配同一主体、客户与账期；原支持、费用和已到期责任继续，不因为离开而暂停。</p>'),
      page('下一次，想守住怎样的边界？',
        '<p>这一期的真实服务与原账，都收好了吗？下一期想继续同样的承诺，还是先减少负担？</p>' +
        '<p>这只是设计提问。复看其它状态不会开新周期、跳过费用或进入下一季。</p>')
    ]
  }
};

function paymentPages() {
  const first = page('先选要复看的账目口径',
    '<p>这只是解释两种不同回执，不是为客户选择或修改付款条款。</p>' +
    '<label class="paper-choice"><input type="radio" name="payment-reading" value="prepaid"' + (paymentReading === 'prepaid' ? ' checked' : '') + '><span>预付：先前充值中的实际消耗与确认收入<small>不能把确认收入当成又收到一笔充值。</small></span></label>' +
    '<label class="paper-choice"><input type="radio" name="payment-reading" value="postpaid"' + (paymentReading === 'postpaid' ? ' checked' : '') + '><span>后付：收取该客户全部已经到期的原单<small>收款可能跨多个账期，不能伪归给眼前一期。</small></span></label>');
  const second = paymentReading === 'postpaid'
    ? page('这份确认，要列出全部到期范围',
      terms([['原客户与合同', '真实主体、客户及原信用条款'], ['本次拟收范围', '该客户全部已到期原应收；完整逐单可翻'], ['未到期部分', '继续留账，不能提前取用']]) +
      '<p>只有原确认并保存成功后，才显示实际收到的现金、日期和账户。回款不重复确认已经形成的收入。</p>')
    : page('确认了交付，不等于又收到充值',
      terms([['过去的现金', '原充值实收金额与日期，以原回执为准'], ['本次确认收入', '依实际服务、支持及更正回执'], ['未消费余额', '继续是原客户余额与保护责任']]) +
      '<p>本分镜不填假余额，也不把预付认收画成一笔新的现金回款。</p>');
  const third = page('收好回执，再看原来的余额',
    '<p>实际金额、实收日期、同一账户及原来源必须可核。没有回执就写“以实际回执为准”，不能用零元伪装未知。</p>' +
    '<p>客户剩余余额、供应资产、应付和其它账期仍各自保留。下一期服务须另行明确客户、供应、资源和支持。</p>' +
    '<p class="quiet">切换这几页只复看设计，不收钱，也不产生任何回执。</p>');
  return [first, second, third];
}

function settingPages() {
  return [page('只改变这份样稿的阅读方式',
    '<label class="paper-choice"><input type="checkbox" data-setting="text"' + (preferences.text ? ' checked' : '') + '><span>纯文字模式<small>隐藏房间与示意纸夹图形，保留全部状态、动作和纸片内容。</small></span></label>' +
    '<label class="paper-choice"><input type="checkbox" data-setting="motion"' + (preferences.motion ? ' checked' : '') + '><span>减少动效<small>关闭抬起和过渡；系统减少动效设置也会生效。</small></span></label>' +
    '<p class="quiet">设置仅在本页内生效，刷新后不保留。Escape可合上，焦点回原按钮。</p>')];
}

function currentPages() {
  if (panelKey === 'paid') return paymentPages();
  if (panelKey === 'settings') return settingPages();
  return panels[panelKey].pages;
}

function renderScene(focusTitle = false) {
  const frame = frames[frameIndex];
  byId('chapter-label').textContent = '一期服务 / ' + frame.chapter;
  byId('scene-title').textContent = frame.title;
  byId('state-label').textContent = frame.state;
  byId('scene-line').textContent = frame.line;
  byId('scene-detail').textContent = frame.detail;
  byId('feedback-date').textContent = frame.date;
  const object = byId('service-object');
  object.dataset.state = frame.id;
  object.setAttribute('aria-label', '同一中转站的同一账期，' + frame.state + '；' + frame.primary);
  byId('object-state').textContent = frame.state;
  byId('object-detail').textContent = frame.object;
  byId('object-action').textContent = frame.primary + ' ↗';
  byId('state-mark').textContent = frame.mark;
  const thoughts = byId('thoughts');
  thoughts.replaceChildren();
  const actions = [
    { label: frame.primary, caption: frame.caption, panel: frame.panel },
    { label: '翻这期原账的边界', caption: '客户、供应与本期来源，分别核对', panel: 'ledger' },
    { label: '先留一点余地', caption: '只翻别的安排，再回同一件事', panel: 'elsewhere' }
  ];
  actions.forEach((action, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'thought' + (index === 0 ? ' primary' : '');
    button.dataset.panel = action.panel;
    const number = document.createElement('b');
    number.setAttribute('aria-hidden', 'true');
    number.textContent = '0' + (index + 1);
    const copy = document.createElement('span');
    copy.textContent = action.label;
    const caption = document.createElement('small');
    caption.textContent = action.caption;
    copy.append(caption);
    const arrow = document.createElement('i');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '↗';
    button.append(number, copy, arrow);
    thoughts.append(button);
  });
  document.querySelectorAll('#state-navigation button').forEach((button, index) => {
    if (index === frameIndex) button.setAttribute('aria-current', 'step');
    else button.removeAttribute('aria-current');
  });
  byId('previous-state').disabled = frameIndex === 0;
  byId('next-state').disabled = frameIndex === frames.length - 1;
  byId('state-number').textContent = String(frameIndex + 1).padStart(2, '0') + ' / 06';
  byId('announcement').textContent = '设计复看：' + frame.nav + '；未推进时间或执行命令。';
  if (focusTitle) byId('scene-title').focus({ preventScroll: true });
}

function selectFrame(index, focusTitle = true) {
  if (dialog.open || index < 0 || index >= frames.length) return;
  frameIndex = index;
  renderScene(focusTitle);
}

function renderPaper(focusHeading = false) {
  const pages = currentPages();
  pageIndex = Math.max(0, Math.min(pageIndex, pages.length - 1));
  byId('paper-title').textContent = panelKey === 'paid' ? '回款之前，先分清原口径' : panelKey === 'settings' ? '文字与动效' : panels[panelKey].title;
  byId('paper-kicker').textContent = panelKey === 'settings' ? '本页阅读设置' : '同一主体 / 同一账期 / 设计近景';
  paperBody.innerHTML = pages[pageIndex];
  byId('paper-page').textContent = '设计纸片 ' + (pageIndex + 1) + ' / ' + pages.length;
  byId('previous-page').disabled = pageIndex === 0;
  byId('next-page').disabled = panelKey === 'paid' && pageIndex === 0 && paymentReading === null;
  byId('next-page').textContent = pageIndex === pages.length - 1 ? '合上，仍留这一态' : '下一页 →';
  if (focusHeading) paperBody.querySelector('h3').focus({ preventScroll: true });
}

function openPanel(key, opener) {
  if (key !== 'settings' && key !== 'paid' && !Object.hasOwn(panels, key)) return;
  if (!dialog.open) returnFocus = opener || document.activeElement;
  panelKey = key;
  pageIndex = 0;
  renderPaper();
  if (!dialog.open) dialog.showModal();
  byId('close-paper').focus({ preventScroll: true });
}

function closePaper() {
  if (dialog.open) dialog.close();
}

document.addEventListener('click', event => {
  if (!(event.target instanceof Element)) return;
  const button = event.target.closest('button[data-panel]');
  if (button) openPanel(button.dataset.panel, button);
});

byId('service-object').addEventListener('click', event => openPanel(frames[frameIndex].panel, event.currentTarget));
byId('previous-state').addEventListener('click', () => selectFrame(frameIndex - 1));
byId('next-state').addEventListener('click', () => selectFrame(frameIndex + 1));
byId('close-paper').addEventListener('click', closePaper);
byId('previous-page').addEventListener('click', () => {
  if (pageIndex > 0) {
    pageIndex -= 1;
    renderPaper(true);
  }
});
byId('next-page').addEventListener('click', () => {
  const pages = currentPages();
  if (panelKey === 'paid' && pageIndex === 0 && paymentReading === null) return;
  if (pageIndex === pages.length - 1) closePaper();
  else {
    pageIndex += 1;
    renderPaper(true);
  }
});
dialog.addEventListener('change', event => {
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;
  if (input.name === 'payment-reading') {
    paymentReading = input.value;
    byId('next-page').disabled = false;
    byId('announcement').textContent = '只复看' + (paymentReading === 'prepaid' ? '预付确认收入' : '后付客户全部到期原单收款') + '口径，没有修改合同。';
  }
  const setting = input.dataset.setting;
  if (setting === 'text' || setting === 'motion') {
    preferences[setting] = input.checked;
    document.body.classList.toggle(setting === 'text' ? 'text-only' : 'reduced-motion', input.checked);
  }
});
dialog.addEventListener('cancel', event => {
  event.preventDefault();
  closePaper();
});
dialog.addEventListener('close', () => {
  panelKey = null;
  if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus({ preventScroll: true });
});

document.addEventListener('keydown', event => {
  if (!(event.target instanceof Element)) return;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (dialog.open) {
    if (event.target.matches('input,select,textarea')) return;
    if (event.key === 'PageDown' && !byId('next-page').disabled) {
      event.preventDefault();
      byId('next-page').click();
    }
    if (event.key === 'PageUp' && !byId('previous-page').disabled) {
      event.preventDefault();
      byId('previous-page').click();
    }
    return;
  }
  if (event.target.closest('button,a,input,select,textarea') && !byId('state-navigation').contains(event.target)) return;
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    selectFrame(frameIndex - 1);
  }
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    selectFrame(frameIndex + 1);
  }
});

frames.forEach((frame, index) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = frame.nav;
  button.setAttribute('aria-label', '复看' + frame.nav + '设计状态，不推进时间');
  button.addEventListener('click', () => selectFrame(index));
  byId('state-navigation').append(button);
});
renderScene();
