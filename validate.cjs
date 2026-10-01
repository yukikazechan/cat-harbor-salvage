const {chromium}=require('playwright');
const fs=require('fs'),http=require('http'),assert=require('assert');
const checks=[];const ok=(name,value)=>{assert(value,name);checks.push(name);console.log('PASS:',name)};
(async()=>{
 new Function(fs.readFileSync(__dirname+'/index.html','utf8').match(/<script>([\s\S]*)<\/script>/)[1]);ok('Node JavaScript syntax',true);
 const server=http.createServer((req,res)=>{res.setHeader('Content-Type','text/html; charset=utf-8');res.end(fs.readFileSync(__dirname+'/index.html'));}).listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/root/.cache/ms-playwright/chromium-1200/chrome-linux64/chrome',args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1000,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}`);
 ok('four auction offers',await page.locator('[data-buy]').count()===4);
 await page.locator('[data-buy="0"]').click();ok('purchase debits funds',await page.evaluate(()=>state.balance===4500000&&view==='game'));
 await page.locator('#game').scrollIntoViewIfNeeded();let box=await page.locator('#game').boundingBox();
 const pos=await page.evaluate(()=>({x:items[0].x*100+25,y:items[0].y*100+25}));
 const screen=p=>({x:box.x+p.x/600*box.width,y:box.y+p.y/600*box.height});let p=screen(pos);
 const alpha=()=>page.evaluate(()=>{const it=items[0],m=coating(it);return [m.ctx.getImageData(21,21,1,1).data[3],m.ctx.getImageData(m.canvas.width-6,m.canvas.height-6,1,1).data[3],it.progress,it.open]});
 await page.mouse.move(p.x,p.y);await page.mouse.down();let first=await alpha();await page.waitForTimeout(900);let held=await alpha();await page.mouse.up();
 ok('destination-out erases only the contact patch',first[0]===0&&first[1]===255&&!first[3]);ok('stationary hold cannot peel whole coating',Math.abs(first[2]-held[2])<.00001&&!held[3]);
 const partial=held[2];await page.reload();await page.locator('#game').scrollIntoViewIfNeeded();box=await page.locator('#game').boundingBox();ok('partial alpha-mask strokes survive reload',await page.evaluate(p=>Math.abs(items[0].progress-p)<.00001&&coating(items[0]).ctx.getImageData(21,21,1,1).data[3]===0,partial));
 const dims=await page.evaluate(()=>({x:items[0].x*100,y:items[0].y*100,w:items[0].w*100,h:items[0].h*100}));
 for(let y=dims.y+16;y<dims.y+dims.h;y+=23){let a=screen({x:dims.x+12,y}),b=screen({x:dims.x+dims.w-12,y});await page.mouse.move(a.x,a.y);await page.mouse.down();await page.mouse.move(b.x,b.y,{steps:12});await page.mouse.up();}
 ok('real mouse zigzag reveals at 65 percent',await page.evaluate(()=>items[0].open&&opened>=1));
 // Force one pending test fixture to verify automatic appraisal and collection end to end.
 await page.evaluate(()=>{const it=items.find(i=>!i.open),r=rares[0];Object.assign(it,{...r,price:r.estimate,truePrice:r.price,status:'pending',rare:true});window.originalRandom=Math.random;Math.random=()=>.1;});
 await page.locator('#openAll').click();await page.waitForTimeout(250);ok('one-click laser animates before completion',await page.evaluate(()=>!!sweep&&sweep.elapsed>0&&opened<items.length));
 await page.waitForTimeout(1500);ok('one-click reveals all, appraises, opens settlement',await page.evaluate(()=>opened===items.length&&!sweep&&items.every(i=>i.open&&i.status!=='pending'))&&await page.locator('#sellAll').isVisible());
 await page.locator('#keepSelected').click();await page.locator('#gallery').click();ok('certified treasure appears in gallery',await page.locator('[data-detail]').count()>0);await page.locator('[data-detail]').first().click();ok('gallery detail opens',await page.locator('#closeDetail').isVisible());await page.locator('#closeDetail').click();
 await page.reload();ok('gallery collection persists',await page.evaluate(()=>state.collection.length>0));
 await page.evaluate(()=>{Math.random=window.originalRandom||Math.random});
 const stats=await page.evaluate(()=>{let data={catalog:basics.length+rares.length,smallRed:0,largeJunk:0,tiers:{},sizes:{},packed:true};for(let n=0;n<160;n++){run=null;state.balance=1e10;buy(n%4);const occupied=new Set();for(const it of items){const size=it.w*it.h;data.tiers[it.tier]=(data.tiers[it.tier]||0)+1;(data.sizes[size]??=new Set()).add(it.tier);if(size===1&&it.tier==='red')data.smallRed++;if(size>=4&&it.tier==='junk')data.largeJunk++;for(let y=it.y;y<it.y+it.h;y++)for(let x=it.x;x<it.x+it.w;x++){const k=x+','+y;if(occupied.has(k))data.packed=false;occupied.add(k);}}if(occupied.size!==36)data.packed=false;}data.sizes=Object.fromEntries(Object.entries(data.sizes).map(([k,v])=>[k,[...v]]));return data;});
 console.log('DISTRIBUTION:',JSON.stringify(stats));ok('62+ distinct items',stats.catalog>=62);ok('size-independent small reds and large junk',stats.smallRed>0&&stats.largeJunk>0&&stats.sizes[1].length>=4&&stats.sizes[4].length>=4);ok('containers tile 36 cells without overlaps',stats.packed);
 // Appraisal fake branch, residual price, and cash settlement.
 await page.evaluate(()=>{const it=items[0],r=rares[2];Object.assign(it,{...r,price:r.estimate,truePrice:r.price,status:'pending',rare:true});reveal(it);window.oldR=Math.random;Math.random=()=>.99;appraise(0);Math.random=window.oldR;});
 ok('fake appraisal collapses to scrap value',await page.evaluate(()=>items[0].status==='fake'&&items[0].price===rares[2].fakePrice));
 await page.locator('#openAll').click();await page.waitForTimeout(1600);const cash=await page.evaluate(()=>state.balance+value);await page.locator('#sellAll').click();ok('all-sell settlement credits exact appraised value',await page.evaluate(v=>Math.abs(state.balance-v)<200&&run===null,cash));
 const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});mobile.on('pageerror',e=>errors.push(e.message));await mobile.goto(`http://127.0.0.1:${server.address().port}`);await mobile.locator('[data-buy="0"]').click();await mobile.locator('#game').scrollIntoViewIfNeeded();const mb=await mobile.locator('#game').boundingBox();const cdp=await mobile.context().newCDPSession(mobile);const xy=await mobile.evaluate(()=>({x:items[0].x*100+20,y:items[0].y*100+20}));let tx=mb.x+xy.x/600*mb.width,ty=mb.y+xy.y/600*mb.height;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx,y:ty}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx+25,y:ty+15}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 ok('real mobile touch swipes erase coating',await mobile.evaluate(()=>items[0].progress>0&&items[0].strokes.length>=2));ok('mobile has no horizontal overflow',await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await mobile.locator('#openAll').click();await mobile.waitForTimeout(1600);ok('mobile one-click reaches settlement',await mobile.locator('#sellAll').isVisible());await mobile.screenshot({path:__dirname+'/validation-mobile.png',fullPage:true});
 ok('no browser page errors on desktop/mobile',errors.length===0);console.log(`ALL ${checks.length} CHECKS PASSED`);
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
