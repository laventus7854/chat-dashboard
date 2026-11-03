/* app.js — интерактивный дашборд по реестрам переписки. Данные: data.js (window.DATA) */
const D = window.DATA;
const CL = { N: '#ff6f9c', S: '#3fd6e0' };
const lbl = k => k.slice(8, 10) + '.' + k.slice(5, 7) + '.' + k.slice(2, 4); // 2025-03 -> 03.25
const ms = D.meta.monthsRange || D.months.map(m => m.k);
Chart.defaults.color = '#8f9bb3';
Chart.defaults.borderColor = '#2a3142';
Chart.defaults.font.family = '"Segoe UI",Roboto,Arial,sans-serif';
const base = { responsive: true, maintainAspectRatio: false, interaction: { mode: 'index', intersect: false } };
const money = c => ({ scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } });

const main = document.getElementById('main');
const tabs = [
  ['overview', '🎯 Обзор'], ['love', '💜 «Люблю»'], ['goodnight', '🌙 «Спокойной ночки»'],
  ['dark', '🕳 Тёмный регистр'], ['status', '🏷 Статус'], ['touch', '🤝 Прикосновения'],
  ['gifts', '🎁 Подарки'], ['music', '🎸 Музыка'], ['names', '👥 Глоссарий имён'],
  ['calls', '📞 Звонки'], ['gaps', '⏳ Паузы'], ['about', 'ℹ️ О проекте'],
];
document.getElementById('tabs').innerHTML = tabs.map(([id, t], i) => `<button data-t="${id}" class="${i ? '' : 'on'}">${t}</button>`).join('');
document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => {
  document.querySelectorAll('#tabs button').forEach(x => x.classList.remove('on'));
  b.classList.add('on'); show(b.dataset.t); window.scrollTo(0, 0);
});
document.getElementById('span').textContent = D.meta.first.slice(0, 10) + ' → ' + D.meta.last.slice(0, 10);
document.getElementById('total').textContent = D.meta.total.toLocaleString('ru-RU');

const charts = [];
function section(html) { charts.forEach(c => c.destroy()); charts.length = 0; main.innerHTML = html; }
function kpi(v, l) { return `<div class="card kpi"><div class="v">${v}</div><div class="l">${l}</div></div>`; }
function boxAfter(id, legend) { return `<div class="chartbox"><canvas id="${id}"></canvas>${legend ? `<div class="legend">${legend}</div>` : ''}</div>`; }
function barChart(id, labels, datasets, stacked, yLabel) {
  charts.push(new Chart(document.getElementById(id), { ...base, type: 'bar',
    data: { labels, datasets },
    options: { ...base, plugins: { legend: { display: datasets.length > 1 } },
      scales: { x: { stacked: !!stacked }, y: { beginAtZero: true, stacked: !!stacked, title: { display: !!yLabel, text: yLabel }, ticks: { precision: 0 } } } } }));
}
function lineChart(id, labels, datasets, yTitle2) {
  charts.push(new Chart(document.getElementById(id), { ...base, type: 'line',
    data: { labels, datasets }, options: { ...base,
      scales: { y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: !!yTitle2, text: yTitle2 } },
                y1: { position: 'right', beginAtZero: true, display: !!yTitle2, grid: { drawOnChartArea: false } } } } }));
}
function pieChart(id, labels, data, colors, y) {
  charts.push(new Chart(document.getElementById(id), { type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors }] },
    options: { responsive: true, maintainAspectRatio: false } }));
}
function evList(items, max) {
  return items.slice(0, max || 400).map(e => {
    const a = e.a === 'N' ? '<span class="a N">Настя</span>' : '<span class="a S">Семён</span>';
    return `<div class="ev"><span class="d">${e.d} ${e.t}</span> · ${a} <span class="a"></span>«${e.x}»</div>`;
  }).join('');
}
function labelList(events, maxItems) {
  if (!events.length) return '<div class="note">— пусто —</div>';
  return events.map(ev => `<div class="ev"><span class="l">${ev.label}</span> <span class="d">(${ev.items.length})</span><br>
    ${ev.items.slice(0, maxItems || 4).map(i => `<span class="d">${i.d} ${i.t}</span> <span class="a ${i.a=== 'N'||i.a === 'S' ? i.a : ''}">${i.a === 'N' ? 'Настя' : 'Семён'}</span> «${i.x.slice(0, 120)}»</div>`).join('<br>')}</div>`).join('');
}
function yearFilter(onchange) {
  return `<select id="ysel"><option value="">все годы</option>${D.years.map(y => `<option>${y.y}</option>`).join('')}</select>`;
}

function show(id) {
  const d = D.registry;
  ({ overview, love: () => registryLove(d), goodnight: () => registryGoodnight(d),
     dark: () => registryDark(d), status: () => registryStatus(d), touch: () => registryTouch(d),
     gifts: () => registryGifts(d), music: () => registryMusic(d), names: () => registryNames(d),
     calls: () => registryCalls(d), gaps: () => registryGaps(d), about: about,
  }[id])();
}

/* ================= helpers data ================= */
const mOf = k => D.months[mx(k)];
function mx(k) { return ms.indexOf(k); }
const byMonthSeries = obj => ms.map(k => obj[k] || 0);

/* ================= ОБЗОР ================= */
function overview() {
  section(`
  <h2>Общая картина</h2>
  <div class="note">Слева — вкладка на каждый реестр. Кликай по точкам/столбцам: у топ-дней и событий есть всплывающие даты.</div>
  <div class="grid g3">
    ${kpi(D.meta.total.toLocaleString('ru-RU'), 'сообщений · ' + D.meta.monthsRange.length + ' месяцев')}
    ${kpi(D.meta.N.toLocaleString('ru-RU') + ' / ' + D.meta.S.toLocaleString('ru-RU'), 'Настя / Семён — почти идеально пополам')}
    ${kpi('74%', 'дней жизни с перепиской')}
    ${kpi(D.meta.photo.toLocaleString('ru-RU'), 'фото')}
    ${kpi(D.meta.voice.toLocaleString('ru-RU'), 'голосовых')}
    ${kpi(D.meta.calls, 'звонков')}
  </div>
  <h3>Сообщения по месяцам</h3>
  ${boxAfter('c-monthly', 'Стек «Настя/Семён». Провал 2024 виден сразу; август–октябрь 2026 — пик близости и одновременно пик тёмного регистра.')}
  <div class="grid g2">
    ${boxAfter('c-year', 'По годам: 2024 — сжатие канала (ревность Олеси + ЕГЭ + военкомат); 2025 — восстановление; 2026 — рекорд.')}
    ${boxAfter('c-callyear', 'Звонки по годам: пик 2023 (75) → всего 4 в 2026.')}
  </div>
  <h3>Часы сообщений</h3>
  ${boxAfter('c-hours', 'Два пика: вечер (22–24) и ночь (0–2). Классика ночных переписок.')}
  <div class="grid g2">
    ${boxAfter('c-wd', 'По дням недели.')}
    ${boxAfter('c-top', 'Топ-15 дней по плотности (всплывающая подсказка покажет дату).')}
  </div>`);
  barChart('c-monthly', ms.map(lbl), [
    { label: 'Настя', data: D.months.map(m => m.N), backgroundColor: CL.N, stack: 'a' },
    { label: 'Семён', data: D.months.map(m => m.S), backgroundColor: CL.S, stack: 'a' },
  ], true, 'сообщений за месяц');
  barChart('c-year', D.years.map(y => y.y), [{ label: 'сообщений в год', data: D.years.map(y => y.msg), backgroundColor: '#b18cff' }]);
  barChart('c-callyear', D.years.map(y => y.y), [{ label: 'звонков в год', data: D.years.map(y => y.calls), backgroundColor: '#ffc861' }]);
  barChart('c-hours', [...Array(24).keys()].map(String), [
    { label: 'Настя', data: D.hours.N, backgroundColor: CL.N, stack: 'a' },
    { label: 'Семён', data: D.hours.S, backgroundColor: CL.S, stack: 'a' },
  ], true, 'сообщений за месяц');
  barChart('c-wd', D.weekday.map(w => w.n), [{ label: 'сообщений', data: D.weekday.map(w => w.c), backgroundColor: '#7dd97d' }]);
  barChart('c-top', D.topDays.map(t => t.d.slice(5)), [{ label: 'сообщений за день', data: D.topDays.map(t => t.c), backgroundColor: '#ff9ec2' }], false, 'сообщений');
}

/* ================= РЕЕСТР: ЛЮБЛЮ ================= */
function registryLove(d) {
  section(`
  <h2>💜 Реестр «люблю»</h2>
  <div class="note">${Object.values(d.loveByMonth).reduce((a, b) => a + b, 0).toLocaleString('ru-RU')} сообщений с корнем «люб-» за 5 лет; ${d.loveEvents.length} дословно размеченных «эталонных» признаний.</div>
  ${boxAfter('c-love', 'По месяцам. Держится с 2022-го; провал — май–октябрь 2024; всплески — лето 2023, лето 2025, октябрь 2026.')}
  <div class="grid g2">
    ${boxAfter('c-lovyear', 'По годам')}
    ${boxAfter('c-lovgood', 'Совместно: «люб-» и «спокойной ночки» (обе линии почти синхронны — intimate-корреляция)')}
  </div>
  <h3>Эталонные признания (кликабельный список, всё регируется датой)</h3>
  <div id="lovelist">${evList(d.loveEvents)}</div>
  <h3>Год по годам — «люб-» количеством</h3>
  <table class="scroll"><tr><th>год</th><th>«люб-» сообщений</th></tr>${Object.entries(d.loveByYear).map(([y, c]) => `<tr><td>${y}</td><td>${c}</td></tr>`).join('')}</table>`);
  lineChart('c-love', ms.map(lbl), [{ label: 'сообщений с «люб-»', data: byMonthSeries(d.loveByMonth), borderColor: CL.N, backgroundColor: 'rgba(255,111,156,.15)', fill: true, tension: .35, pointRadius: 2 }]);
  barChart('c-lovyear', Object.keys(d.loveByYear), [{ label: 'в год', data: Object.values(d.loveByYear), backgroundColor: CL.N }]);
  lineChart('c-lovgood', ms.map(lbl), [
    { label: '«люб-»', data: byMonthSeries(d.loveByMonth), borderColor: CL.N, tension: .35 },
    { label: '«спокойной ночки»', data: byMonthSeries(d.goodnightByMonth), borderColor: CL.S, tension: .35 },
  ]);
}

/* ================= РЕЕСТР: СПОКОЙНОЙ НОЧКИ ================= */
function registryGoodnight(d) {
  section(`
  <h2>🌙 Реестр «спокойной ночки»</h2>
  <div class="note">${Object.values(d.gnByYear).reduce((a, b) => a + b, 0).toLocaleString('ru-RU')} пар за 5 лет. Несущий кабель связи: почти конец дня закрывался этими словами.</div>
  <div class="care">Обрати внимание на два «обрыва кабеля»: май–декабрь 2024 (семь месяцев подряд ноль — спад года) и почти весь 2026 (заменили голосовые-песни и общая шарага). Возврат — осень 2025.</div>
  ${boxAfter('c-gn', 'По месяцам.')}
  <div class="grid g2">
    ${boxAfter('c-gnyear', 'По годам')}
    ${boxAfter('c-gnlove', '«спокойной ночки» против «люб-» по месяцам — их связь симметрична')}
  </div>
  <table class="scroll"><tr><th>год</th><th>пар</th></tr>${Object.entries(d.gnByYear).map(([y, c]) => `<tr><td>${y}</td><td>${c}</td></tr>`).join('')}</table>`);
  barChart('c-gn', ms.map(lbl), [{ label: 'пар в месяц', data: byMonthSeries(d.goodnightByMonth), backgroundColor: '#3fd6e0' }], false, 'пар за месяц');
  barChart('c-gnyear', Object.keys(d.gnByYear), [{ label: 'в год', data: Object.values(d.gnByYear), backgroundColor: '#3fd6e0' }]);
  lineChart('c-gnlove', ms.map(lbl), [
    { label: '«спокойной ночки»', data: byMonthSeries(d.goodnightByMonth), borderColor: CL.S, tension: .35 },
    { label: '«люб-»', data: byMonthSeries(d.loveByMonth), borderColor: CL.N, tension: .35 },
  ]);
}

/* ================= РЕЕСТР: ТЁМНЫЙ ================= */
function registryDark(d) {
  const totalDark = Object.values(d.darkByMonth).reduce((a, b) => a + b, 0);
  section(`
  <h2>🕳 Тёмный регистр (бережно)</h2>
  <div class="care">Это статистика поводу и мемного фона: боль­шинство сообщений — фиксации-«мемы» («Хочу сдохнуть» про бытовую усталость). Меньшая часть — реальные эпизоды; они перечислены ниже как журнал, без assessments. Если пересматривать этот раздел тревожно — это нормально; тем статистика здесь не для публики, а для себя.</div>
  <div class="grid g3">
    ${kpi(totalDark, 'сообщений чёрного регистра за 5 лет')}
    ${kpi(d.darkEvents.length, 'типов реальных эпизодов')}
    ${kpi(Object.keys(d.darkByYear).map(y => y + ':' + d.darkByYear[y]).join(' · '), 'по годам')}
  </div>
  ${boxAfter('c-dark', 'По месяцам: пики — 2022-11 (13), 2023-10 (14), 2025-12 (12) и 2026-10 (10) — «чёрный регистр растёт на кризисах».')}
  <h3>Журнал реальных эпизодов (кликабельно)</h3>
  <div id="darkj">${labelList(d.darkEvents, 8)}</div>
  <h3>Формула «страховки» пятилетия</h3>
  <blockquote>«<b>Я запрещаю тебе умерать</b>» (Семён, 08.11.2022) — фраза-якорь. Взаимные страховки: «Не норм» / «Не круто» / «Только живи» / «Живи семён» / «Меня с тобой закопают». За 5 лет прямого разговора «что происходит на самом деле» изнутри эпизода не случилось ни разу — тема всегда сворачивалась в стёб.</blockquote>`);
  barChart('c-dark', ms.map(lbl), [{ label: 'сообщений регистра', data: byMonthSeries(d.darkByMonth), backgroundColor: '#7a8598' }], false, 'в месяц');
}

/* ================= РЕЕСТР: СТАТУС ================= */
function registryStatus(d) {
  section(`
  <h2>🏷 Реестр статуса («пара без слова»)</h2>
  <div class="note">«Встречаться» между собой не сказано ни разу за 5 лет. Всё статусное «называть» делало окружение: Анна Павловна (январь 2022), Крупнова (декабрь 2025). Окружение всегда приходило к вердикту «пара» раньше них.</div>
  ${boxAfter('c-status', 'Слово-упоминания «встреч/пара/отношен/девушк/парень/влюбл/нравится» по месяцам (регекс; включает его романы — поэтому и низко—плотные романтика 2023–2024).')}
  <h3>Ключевые статусные моменты</h3>
  <div>${evList(d.statusEvents)}</div>`);
  barChart('c-status', ms.map(lbl), [{ label: 'статус-упоминаний в месяц', data: byMonthSeries(d.statusByMonth), backgroundColor: '#b18cff' }], false, 'в месяц');
}

/* ================= РЕЕСТР: ПРИКОСНОВЕНИЯ ================= */
function registryTouch(d) {
  section(`
  <h2>🤝 Реестр прикосновений</h2>
  <div class="note">${d.touchEvents.length} строк на 5 лет — у пары с таким объёмом «обнять» как слово появлялось почти никогда. Единственная «своё/их» строка — 16.04.2025.</div>
  <div class="care">Здесь тоже бережно: цитаты «пососался» относятся к его роману с Олесей (2023). Общие (их двоих) — только «приобнял» (о дискотеке) и «Я очень жалею что ни разу не обняла тебя сегодня».</div>
  <div>${evList(d.touchEvents)}</div>`);
}

/* ================= РЕЕСТР: ПОДАРКИ ================= */
function registryGifts(d) {
  section(`
  <h2>🎁 Реестр подарков</h2>
  <div class="note">Оба канала: её торты (стандарт заботы с 2025), его мелкие жесты (билет, берцы, каподастр, 50 Telegram Stars). Подарок — их второй язык любви.</div>
  ${boxAfter('c-gifts', 'По месяцам (регекс «подар/кольц/торт/берц/каподастр…», вкл. шум «блин»).')}
  <h3>Вехи</h3>
  <div>${labelList(d.giftEvents, 5)}</div>`);
  barChart('c-gifts', ms.map(lbl), [{ label: 'подарочных строк в месяц', data: byMonthSeries(d.giftsByMonth), backgroundColor: '#ffc861' }], false, 'в месяц');
}

/* ================= РЕЕСТР: МУЗЫКА ================= */
function registryMusic(d) {
  section(`
  <h2>🎸 Реестр музыки</h2>
  <div class="note">${D.meta.audio.toLocaleString('ru-RU')} аудиофайлов (его треки, с лета 2025) + ${Object.values(d.musicByMonth).reduce((a, b) => a + b, 0)} текстовых строк про гитару/песни/аккорды. Слушатель №1 — Настя.</div>
  ${boxAfter('c-music', 'Столбцы — текст-строки; линия — его аудиофайлы по месяцам.')}
  <h3>Вехи</h3>
  <div>${labelList(d.musicEvents, 5)}</div>`);
  lineChart('c-music', ms.map(lbl), [
    { type: 'bar', label: 'строк про музыку', data: byMonthSeries(d.musicByMonth), backgroundColor: 'rgba(177,140,255,.4)', yAxisID: 'y' },
    { type: 'line', label: 'аудиофайлов', data: byMonthSeries(d.audioByMonth), borderColor: CL.S, tension: .3, yAxisID: 'y1' },
  ]);
}

/* ================= РЕЕСТР: ИМЁНА ================= */
function registryNames(d) {
  const nm = d.namesMonthly;
  const names = Object.keys(nm).sort((a, b) => (Object.values(nm[b]).reduce((x, y) => x + y, 0)) - (Object.values(nm[a]).reduce((x, y) => x + y, 0)));
  section(`
  <h2>👥 Глоссарий имён</h2>
  <div class="note">Сколько раз каждое имя звучало по месяцам. Олеся — кат Lопис (главная тема 2023–2025), Лана и Алина — вторая половина, остальные — фон их известных кругов.</div>
  <select id="namesel">${names.map((n, i) => `<option ${i === 0 ? 'selected' : ''}>${n}</option>`).join('')}</select>
  ${boxAfter('c-name')}
  <h3>Тепловая карта (имя × месяц)</h3>
  <div class="scroll"><table class="heat"><thead><tr><th>имя</th>${ms.map(k => `<th>${k.slice(5)}</th>`).join('')}</tr></thead>
  <tbody>${names.map(n => `<tr><td style="white-space:nowrap"><b>${n}</b></td>${ms.map(k => {
     const v = (nm[n][k] || 0) / Math.max(...Object.values(nm[n]).map(x => x) .filter(x => x));
     const l = nm[n][k] || 0;
     const hi = l === 0 ? 0 : v > .85 ? 4 : v > .55 ? 3 : v > .3 ? 2 : 1;
     return `<td class="c hi${hi}" title="${n} · ${lbl(k)}: ${l}">${l || ''}</td>`;
  }).join('')}</tr>`).join('')}</tbody></table></div>`);
  const el = document.getElementById('namesel');
  const draw = () => {
    const n = el.value || names[0];
    if (window._nc) window._nc.destroy();
    window._nc = new Chart(document.getElementById('c-name'), { ...base, type: 'line',
      data: { labels: ms.map(lbl), datasets: [{ label: n, data: ms.map(k => nm[n][k] || 0), borderColor: CL.S, backgroundColor: 'rgba(63,214,224,.15)', fill: true, tension: .35 }] },
      options: { ...base, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
  };
  el.onchange = draw; draw();
}

/* ================= РЕЕСТР: ЗВОНКИ ================= */
function registryCalls(d) {
  const totN = d.callsMonthly.reduce((a, c) => a + c.N, 0), totS = d.callsMonthly.reduce((a, c) => a + c.S, 0);
  section(`
  <h2>📞 Реестр звонков</h2>
  <div class="grid g3">
    ${kpi(D.meta.calls, 'звонков всего')}
    ${kpi(totN + totS ? Math.round(100 * totN / (totN + totS)) + '% / ' + Math.round(100 * totS / (totN + totS)) + '%' : '—', 'инициатива: Настя / Семён')}
    ${kpi('75 → 4', 'пик 2023 → 2026: канал умер')}
  </div>
  ${boxAfter('c-calls', 'Стек «Настя/Семён» по месяцам: звонки копятся в «эмоциональные» месяцы (янв 2023, июн-июл 2022…).')}
  <h3>По годам</h3>
  <table class="scroll"><tr><th>год</th><th>звонков</th></tr>${D.years.map(y => `<tr><td>${y.y}</td><td>${y.calls}</td></tr>`).join('')}</table>`);
  barChart('c-calls', ms.map(lbl), [
    { label: 'Настя', data: d.callsMonthly.map(c => c.N), backgroundColor: CL.N, stack: 'a' },
    { label: 'Семён', data: d.callsMonthly.map(c => c.S), backgroundColor: CL.S, stack: 'a' },
  ], true, 'звонков в месяц');
}

/* ================= РЕЕСТР: ПАУЗЫ ================= */
function registryGaps(d) {
  section(`
  <h2>⏳ Реестр пауз</h2>
  <div class="grid g3">
    ${kpi(D.firstAfterPause.N + D.firstAfterPause.S, 'возвратов после паузы > 24 ч')}
    ${kpi(Math.round(100 * D.firstAfterPause.N / (D.firstAfterPause.N + D.firstAfterPause.S)) + '%', 'из них первая пишет Настя (детектор состояния)')}
    ${kpi(D.firstAfterPause.S + '%', 'первый — Семён')}
  </div>
  ${boxAfter('c-gaps', 'Топ-20 молчаний (глубина в днях). Самое долгое — 19 дней 18.03–06.04.2025, канун апрельского кризиса.')}
  <div class="grid g2">
    ${boxAfter('c-gapwho', 'Кто пишет первым после паузы')}
    ${boxAfter('c-gapover', 'Кто «закрывает» сессию после паузы >12 ч')}
  </div>
  <h3>Самые большие паузы (топ-20; полный список — в локальной аналитике)</h3>
  <table class="scroll"><thead><tr><th>от</th><th>до</th><th>дней</th></tr></thead><tbody>
  ${D.topGaps.map(g => `<tr><td class="dt">${g.from}</td><td class="dt">${g.to}</td><td class="dt">${g.days}</td></tr>`).join('')}
  </tbody></table>`);
  barChart('c-gaps', D.topGaps.map(g => g.from.slice(5)), [{ label: 'дней молчания', data: D.topGaps.map(g => g.days), backgroundColor: '#ffc861' }]);
  pieChart('c-gapwho', ['Настя', 'Семён'], [D.firstAfterPause.N, D.firstAfterPause.S], [CL.N, CL.S]);
  pieChart('c-gapover', ['Настя', 'Семён'], [D.lastAfter12h.N, D.lastAfter12h.S], [CL.N, CL.S]);
}

/* ================= О ПРОЕКТЕ ================= */
function about() {
  section(`
  <h2>ℹ️ О проекте</h2>
  <div class="card" style="max-width:820px">
    <p><b>Что это.</b> Визуальная аналитика личного Telegram-экспорта «Настя 🥱🥱🥱» × «SSS グール» (Семён): 22.12.2021 → 02.11.2026, ${D.meta.total.toLocaleString('ru-RU')} сообщений, 59 HTML-файлов.</p>
    <p><b>Как считалось.</b> Парсер (_analysis/parse.js → messages.json) → агрегатор (_analysis/agg.js → data.js «window.DATA») → этот сайт (Chart.js, без бэкенда). Реестры — регекс-скан всего текста; события — подстрочный детектор по датам, всё дословно.</p>
    <p><b>Текстовый отчёт.</b> Полный разбор с цитатами и интерпретацией хранится отдельно (не опубликован). Сайт — «цифровая» половина того же анализа.</p>
    <p><b>Приватность и бережный тон.</b> Материалы личные. Тёмные темы (раздел «Тёмный регистр») поданы фактами и датами; цитаты — только через список событий и по выдержанному правилу «факт без подробностей». Если что-то покажется слишком личным для размещения — раздел можно удалить из data.js (одна строка) и пересобрать.</p>
    <p><b>Файлы.</b> <code>index.html</code>, <code>app.js</code>, <code>style.css</code>, <code>data.js</code> — четыре файла, GitHub Pages отдаёт сразу.</p>
  </div>`);
}

show('overview');
