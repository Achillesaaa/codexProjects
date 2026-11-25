/* Standalone interface demo. No network requests or Kindle system operations. */
(() => {
  'use strict';
  const $ = q => document.querySelector(q);
  const $$ = q => [...document.querySelectorAll(q)];
  const TODAY = '2026-11-25', STORAGE = 'kindle-calendar-preview-v3';
  const state = { page: new URLSearchParams(location.search).get('view') === 'month' ? 'month' : 'today', city:'杭州', year:2026, month:10, selected:TODAY, taskPage:0, offline:false, cacheAge:11, refreshOutcome:'更新中', weather:'多云', tasks:{
    '2026-11-25':[{id:'t1',text:'读完《瓦尔登湖》第二章',done:false},{id:'t2',text:'午后散步 30 分钟',done:false},{id:'t3',text:'整理本周的读书笔记',done:false}],
    '2026-11-27':[{id:'t4',text:'归还图书',done:false}], '2026-11-30':[{id:'t5',text:'整理月度阅读记录',done:false}]
  }};
  const symbols={'多云':'☁','晴':'☀','阴':'☁','雾':'≋','雪':'❄'};
  let editing=null, origin=null, serial=0;
  const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const activeDate=()=>state.page==='today'?TODAY:state.selected;
  const dateLabel=date=>{const d=new Date(date+'T12:00:00');return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 · 星期${'日一二三四五六'[d.getDay()]}`;};
  let formatter;
  try { formatter=new Intl.DateTimeFormat('zh-CN-u-ca-chinese',{month:'long',day:'numeric',timeZone:'Asia/Shanghai'}); } catch (_) { /* Old browsers have no offline lunar engine yet. */ }
  function lunar(date){
    if(!formatter||formatter.resolvedOptions().calendar!=='chinese')return {month:'',day:'—'};
    const parts=formatter.formatToParts(new Date(date+'T12:00:00+08:00')),get=t=>parts.find(p=>p.type===t)?.value||'';
    const names=['','初一','初二','初三','初四','初五','初六','初七','初八','初九','初十','十一','十二','十三','十四','十五','十六','十七','十八','十九','二十','廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];
    return {month:get('month'),day:names[Number(get('day'))]||'—'};
  }
  function save(){try{localStorage.setItem(STORAGE,JSON.stringify(state));}catch(_){$('[data-task-announcement]').textContent='浏览器未能保存本次修改，请勿关闭页面';}}
  function restore(){
    try{
      const s=JSON.parse(localStorage.getItem(STORAGE));
      const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d));
      if(!s||!['today','month'].includes(s.page)||typeof s.city!=='string'||!Number.isInteger(s.year)||s.year<1901||s.year>2099||!Number.isInteger(s.month)||s.month<0||s.month>11||!validDate(s.selected)||!s.tasks||typeof s.tasks!=='object'||Array.isArray(s.tasks))return;
      if(!Object.entries(s.tasks).every(([d,items])=>validDate(d)&&Array.isArray(items)&&items.every(t=>typeof t.id==='string'&&/^[a-zA-Z0-9-]+$/.test(t.id)&&typeof t.text==='string'&&t.text.length<=120&&typeof t.done==='boolean')))return;
      for(const k of ['page','city','year','month','selected','tasks'])state[k]=s[k];
      if(Number.isInteger(s.cacheAge)&&s.cacheAge>=0&&s.cacheAge<=360)state.cacheAge=s.cacheAge;
      if(typeof s.offline==='boolean')state.offline=s.offline;
      if(['更新中','成功','失败'].includes(s.refreshOutcome))state.refreshOutcome=s.refreshOutcome;
      if(Object.hasOwn(symbols,s.weather))state.weather=s.weather;
      if(new URLSearchParams(location.search).get('view')==='month')state.page='month';
    }catch(_){ /* A broken stored preview must not prevent loading. */ }
  }
  function renderCalendar(){
    const first=new Date(state.year,state.month,1,12),offset=(first.getDay()+6)%7;
    const title=`${state.year}年${state.month+1}月`;
    $('[data-month-title]').textContent=title;
    const grid=$('[data-calendar]');grid.setAttribute('aria-label',title+'日期');grid.replaceChildren();
    for(let i=0;i<42;i++){
      const date=new Date(state.year,state.month,1-offset+i,12),key=iso(date),b=document.createElement('button');
      b.type='button';b.className='day';b.dataset.date=key;
      if(date.getMonth()!==state.month)b.classList.add('other');
      if(key===TODAY){b.classList.add('today');b.setAttribute('aria-current','date');}
      if(key===state.selected)b.classList.add('selected');
      if(state.tasks[key]?.length)b.classList.add('has-todo');
      const l=lunar(key),n=document.createElement('span'),sub=document.createElement('span');
      n.textContent=date.getDate();sub.className='lunar';sub.textContent=l.day==='初一'?l.month:l.day;
      b.setAttribute('aria-label',`${date.getMonth()+1}月${date.getDate()}日 星期${'日一二三四五六'[date.getDay()]} 农历${l.month}${l.day}`);
      b.setAttribute('aria-pressed',String(key===state.selected));b.append(n,sub);grid.append(b);
    }
  }
  function renderTasks(){
    const key=activeDate(),items=state.tasks[key]||[],date=new Date(key+'T12:00:00');
    $('[data-todo-title]').textContent=state.page==='today'?'今日待办':`${date.getMonth()+1}月${date.getDate()}日待办`;
    $('[data-count]').textContent=`${items.filter(t=>t.done).length} / ${items.length} 完成`;
    const perPage=items.length>3?2:3,pages=Math.max(1,Math.ceil(items.length/perPage));
    state.taskPage=Math.max(0,Math.min(state.taskPage,pages-1));
    const list=$('[data-task-list]');list.replaceChildren();
    for(const task of items.slice(state.taskPage*perPage,(state.taskPage+1)*perPage)){
      const row=document.createElement('div'),label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');
      row.className='task-row';label.className='task';input.type='checkbox';input.dataset.task=task.id;input.checked=task.done;input.setAttribute('aria-label',task.text);text.textContent=task.text;label.append(input,text);row.append(label);
      for(const [action,name] of [['edit','修改'],['delete','删除']]){
        const b=document.createElement('button');b.type='button';b.className='task-action';b.dataset.action=action;b.dataset.id=task.id;b.textContent=name;b.setAttribute('aria-label',`${name}：${task.text}`);row.append(b);
      }list.append(row);
    }
    if(!items.length){const p=document.createElement('p');p.className='empty';p.textContent='暂无待办，点击“新增”添加';list.append(p);}
    $('[data-task-pager]').hidden=pages<=1;$('[data-task-page]').textContent=`${state.taskPage+1} / ${pages}`;
    $('[data-action="tasks-prev"]').disabled=state.taskPage===0;$('[data-action="tasks-next"]').disabled=state.taskPage===pages-1;
  }
  function render(){
    $$('[data-page]').forEach(p=>p.hidden=p.dataset.page!==state.page);
    $$('nav button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===state.page)));
    $('[data-city]').textContent=state.city;$('[data-network]').textContent=state.offline?'离线':'已联网';
    $('[data-weather]').textContent=state.weather;$('[data-weather-icon]').textContent=symbols[state.weather];
    const stale=state.cacheAge>120,success=!state.offline&&stale&&state.refreshOutcome==='成功';
    const stamp=new Date(Date.UTC(2026,10,25,9,41)-(success?0:state.cacheAge)*60000);
    const time=String(stamp.getUTCHours()).padStart(2,'0')+':'+String(stamp.getUTCMinutes()).padStart(2,'0');
    const timestamp=(stamp.getUTCMonth()+1)+'/'+stamp.getUTCDate()+' '+time;
    $('[data-cache-time]').textContent=timestamp;
    $('[data-sync]').textContent=state.offline?'离线 · 缓存于 '+timestamp:!stale?'缓存于 '+timestamp:success?'已更新 · '+timestamp:state.refreshOutcome==='失败'?'更新失败 · 沿用 '+timestamp+' 缓存':'正在更新 · 沿用 '+timestamp+' 缓存';
    $('[data-temp-label]').textContent=state.offline||stale&&!success?'缓存气温 · '+time:'当前气温';
    const l=lunar(TODAY);$('[data-lunar-today]').textContent='农历'+l.month+l.day;
    $('[data-offline]').checked=state.offline;$('[data-cache-age]').value=state.cacheAge;$('[data-age-label]').textContent=state.cacheAge+' 分钟';$('[data-refresh-outcome]').value=state.refreshOutcome;$('[data-weather-choice]').value=state.weather;
    renderCalendar();renderTasks();
  }
  function closeDialog(panel){panel.close();if(origin?.isConnected)origin.focus();else $('[data-action="add"]').focus();editing=null;}
  function openEditor(id,trigger){
    origin=trigger;const date=activeDate(),task=(state.tasks[date]||[]).find(t=>t.id===id);editing={date,id:task?.id||null};
    const title=task?'修改待办':'新增待办';$('[data-editor-title]').textContent=title;$('[data-task-panel]').setAttribute('aria-label',title);$('[data-editor-date]').textContent=dateLabel(date);$('[name="task"]').value=task?.text||'';$('[name="task"]').setCustomValidity('');$('[data-task-panel]').showModal();$('[name="task"]').focus();
  }
  document.addEventListener('click',e=>{
    const date=e.target.closest('[data-date]');
    if(date){state.selected=date.dataset.date;const d=new Date(state.selected+'T12:00:00');state.year=d.getFullYear();state.month=d.getMonth();state.taskPage=0;render();$(`[data-date="${state.selected}"]`)?.focus();save();return;}
    const b=e.target.closest('[data-action]');if(!b)return;
    const a=b.dataset.action;
    if(a==='today'||a==='month'){state.page=a;state.taskPage=0;render();save();}
    else if(a==='prev'||a==='next'){
      const d=new Date(state.year,state.month+(a==='next'?1:-1),1,12);if(d.getFullYear()<1901||d.getFullYear()>2099)return;state.year=d.getFullYear();state.month=d.getMonth();state.selected=iso(d);state.taskPage=0;render();save();
    }else if(a==='this-month'){state.year=2026;state.month=10;state.selected=TODAY;state.taskPage=0;render();save();}
    else if(a==='add'||a==='edit')openEditor(a==='edit'?b.dataset.id:null,b);
    else if(a==='delete'){const key=activeDate();state.tasks[key]=(state.tasks[key]||[]).filter(t=>t.id!==b.dataset.id);if(!state.tasks[key].length)delete state.tasks[key];renderTasks();renderCalendar();$('[data-action="add"]').focus();$('[data-task-announcement]').textContent='已删除待办';save();}
    else if(a==='tasks-prev'||a==='tasks-next'){state.taskPage+=a==='tasks-next'?1:-1;renderTasks();$('[data-action="add"]').focus();}
    else if(a==='city'){origin=b;$('[name="city"]').value=state.city;$('[data-city-panel]').showModal();$('[name="city"]').focus();}
    else if(a==='close-city')closeDialog($('[data-city-panel]'));
    else if(a==='close-task')closeDialog($('[data-task-panel]'));
    else if(a==='exit'){save();$('[data-home-panel]').hidden=false;for(const el of $$('.screen>header,.screen>.body,.screen>footer'))el.inert=true;$('[data-action="reopen"]').focus();}
    else if(a==='reopen'){$('[data-home-panel]').hidden=true;for(const el of $$('.screen>header,.screen>.body,.screen>footer'))el.inert=false;$('[data-action="exit"]').focus();}
  });
  document.addEventListener('change',e=>{
    const el=e.target;
    if(el.matches('[data-task]')){const task=(state.tasks[activeDate()]||[]).find(t=>t.id===el.dataset.task);if(task){task.done=el.checked;renderTasks();$(`[data-task="${task.id}"]`)?.focus();save();}}
    else if(el.matches('[data-offline],[data-cache-age],[data-refresh-outcome],[data-weather-choice]')){state.offline=$('[data-offline]').checked;state.cacheAge=Number($('[data-cache-age]').value);state.refreshOutcome=$('[data-refresh-outcome]').value;state.weather=$('[data-weather-choice]').value;render();save();}
  });
  for(const panel of $$('dialog'))panel.addEventListener('cancel',()=>{editing=null;});
  for(const el of $$('input[name]'))el.addEventListener('input',()=>el.setCustomValidity(''));
  $('[data-location-form]').addEventListener('submit',e=>{e.preventDefault();const input=$('[name="city"]'),city=input.value.trim();if(!city){input.setCustomValidity('请输入城市或区县');input.reportValidity();return;}state.city=city;render();save();closeDialog($('[data-city-panel]'));});
  $('[data-task-form]').addEventListener('submit',e=>{
    e.preventDefault();if(!editing)return;const input=$('[name="task"]'),text=input.value.trim();if(!text){input.setCustomValidity('请输入待办内容');input.reportValidity();return;}
    const items=state.tasks[editing.date]||(state.tasks[editing.date]=[]),task=items.find(t=>t.id===editing.id);
    if(task)task.text=text;else{items.push({id:'task-'+Date.now().toString(36)+'-'+(++serial),text,done:false});state.taskPage=Math.floor((items.length-1)/(items.length>3?2:3));}
    render();save();closeDialog($('[data-task-panel]'));$('[data-task-announcement]').textContent='待办已保存';
  });
  restore();render();
})();
