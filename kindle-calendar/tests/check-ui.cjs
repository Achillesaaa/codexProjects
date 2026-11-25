// Requires an existing Playwright installation and browser. Does not install tools.
const {chromium}=require('playwright');
const path=require('node:path');
const http=require('node:http');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  const server=http.createServer((req,res)=>{
    const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
    const file=files[req.url.split('?')[0]];
    if(!file){res.writeHead(404);res.end();return;}
    res.setHeader('Content-Type',file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html; charset=utf-8');
    res.end(fs.readFileSync(path.resolve(__dirname,'../prototype',file)));
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{
    const page=await browser.newPage({viewport:{width:736,height:1100}}),errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await page.goto('http://127.0.0.1:'+server.address().port+'/');
    assert.equal(await page.locator('nav button').count(),2);
    assert.equal(await page.locator('[data-lunar-today]').innerText(),'农历十月十七');
    for(const width of [320,536,736]){
      await page.setViewportSize({width,height:1100});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    }
    await page.setViewportSize({width:736,height:1100});
    let checkbox=page.getByRole('checkbox',{name:'午后散步 30 分钟',exact:true});
    await checkbox.check();assert.equal(await checkbox.isChecked(),true);
    await checkbox.uncheck();assert.equal(await checkbox.isChecked(),false);
    await page.getByRole('button',{name:'修改：午后散步 30 分钟',exact:true}).click();
    await page.locator('[name=task]').fill('午后散步 45 分钟');
    await page.getByRole('button',{name:'保存待办',exact:true}).click();
    await page.getByRole('button',{name:'月历',exact:true}).click();
    assert.equal(await page.getByRole('checkbox',{name:'午后散步 45 分钟',exact:true}).isVisible(),true);
    assert.equal(await page.locator('.day').count(),42);
    await page.locator('[data-date="2026-11-26"]').click();
    assert.match(await page.locator('[data-task-list]').innerText(),/暂无待办/);
    for(let i=1;i<=4;i++){
      await page.getByRole('button',{name:'＋ 新增',exact:true}).click();
      assert.match(await page.locator('[data-editor-date]').innerText(),/2026年11月26日/);
      await page.locator('[name=task]').fill('事项'+i);
      await page.getByRole('button',{name:'保存待办',exact:true}).click();
    }
    assert.equal(await page.locator('[data-task-page]').innerText(),'2 / 2');
    await page.getByRole('button',{name:'删除：事项4',exact:true}).click();
    assert.equal(await page.locator('[data-task-pager]').isHidden(),true);
    for(let i=1;i<=3;i++)await page.getByRole('button',{name:'删除：事项'+i,exact:true}).click();
    assert.equal(await page.locator('[data-date="2026-11-26"]').evaluate(el=>el.classList.contains('has-todo')),false);
    await page.getByRole('button',{name:'日历',exact:true}).click();
    assert.equal(await page.locator('[data-task]').count(),3);
    await page.getByRole('button',{name:'＋ 新增',exact:true}).click();
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[data-task-panel]').isVisible(),false);
    await page.getByRole('button',{name:'设置当前城市',exact:true}).click();
    await page.locator('[name=city]').fill('  上海  ');
    await page.getByRole('button',{name:'保存位置',exact:true}).click();
    assert.equal(await page.locator('[data-city]').innerText(),'上海');
    await page.getByRole('button',{name:'退出应用，返回 Kindle 首页',exact:true}).click();
    assert.equal(await page.locator('[data-home-panel]').isVisible(),true);
    await page.getByRole('button',{name:'重新打开日历',exact:true}).click();
    assert.equal(await page.locator('[data-home-panel]').isHidden(),true);
    await page.locator('.preview-controls summary').click();
    async function conditions(age,offline,outcome){
      await page.locator('[data-cache-age]').evaluate((el,value)=>{el.value=value;el.dispatchEvent(new Event('change',{bubbles:true}));},age);
      await page.locator('[data-offline]').setChecked(offline);
      await page.locator('[data-refresh-outcome]').selectOption(outcome);
    }
    for(const [age,offline,outcome,start] of [[120,false,'更新中','缓存于'],[121,false,'更新中','正在更新'],[121,false,'失败','更新失败'],[121,false,'成功','已更新'],[121,true,'成功','离线']]){
      await conditions(age,offline,outcome);assert.ok((await page.locator('[data-sync]').innerText()).startsWith(start));
    }
    await page.reload();assert.equal(await page.locator('[data-city]').innerText(),'上海');
    assert.equal(await page.getByRole('checkbox',{name:'午后散步 45 分钟',exact:true}).isVisible(),true);
    await page.getByRole('button',{name:'月历',exact:true}).click();
    await page.getByRole('button',{name:'下个月',exact:true}).click();
    assert.equal(await page.locator('[data-month-title]').innerText(),'2026年12月');
    for(const width of [320,536,736]){await page.setViewportSize({width,height:1100});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
    assert.deepEqual(errors,[]);
    console.log('PASS: both pages, date-specific CRUD, completion, lunar labels, persistence, city, exit, pagination, cancellation, cache boundary, and narrow widths.');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
