"""Run: python validate.py (requires Playwright + Chromium). No external assets."""
from pathlib import Path
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from threading import Thread
from functools import partial
from playwright.sync_api import sync_playwright
import subprocess, re
root=Path(__file__).parent
script=re.search(r'<script>([\s\S]*)</script>',(root/'index.html').read_text()).group(1)
subprocess.run(['node','-e','new Function('+__import__('json').dumps(script)+');'],check=True)
server=ThreadingHTTPServer(('127.0.0.1',0),partial(SimpleHTTPRequestHandler,directory=str(root)))
Thread(target=server.serve_forever,daemon=True).start()
url=f'http://127.0.0.1:{server.server_port}/'
checks=[]
def ok(name, assertion):
    assert assertion,name
    checks.append(name)
    print('PASS:',name)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},has_touch=True)
 errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(url)
 ok('initial auction / four independent offers',page.locator('[data-buy]').count()==4 and page.evaluate('state.balance')==5000000)
 page.locator('[data-buy="3"]').click()
 ok('insufficient funds cannot buy',page.evaluate('run===null && state.balance===5000000'))
 page.evaluate('Math.random=()=>0.1')
 page.locator('[data-buy="0"]').click()
 ok('purchase debits and opens game',page.evaluate('state.balance===4500000 && run.type===0') and page.locator('#gameView').is_visible())
 # Test real touchscreen hold on large plate as FIRST cut.
 coords=page.evaluate('({x:items[0].x+items[0].w/2,y:items[0].y+items[0].h/2})')
 box=page.locator('#game').bounding_box(); x=box['x']+coords['x']/6*box['width'];y=box['y']+coords['y']/6*box['height']
 page.mouse.move(x,y);page.mouse.down();page.wait_for_timeout(1900);page.mouse.up()
 ok('first cut large plate via pointer, no gate',page.evaluate('items[0].open && opened===1 && items[0].status==="pending"'))
 page.evaluate('Math.random=()=>0.9')
 page.locator('[data-appraise="0"]').click()
 ok('fake reversal cliff / UI / cracks',page.evaluate('items[0].status==="fake" && items[0].price===15 && value<100') and page.locator('#cracks').get_attribute('class')=='cracks play')
 page.evaluate('items.forEach(i=>cut(i,100,i.x*100+50,i.y*100+50))')
 page.locator('#settle').click();page.locator('#sellAll').click()
 ok('sell fake box returns to lobby',page.locator('#lobbyView').is_visible() and page.evaluate('run===null && state.collection.length===0'))
 page.locator('#relief').click()
 ok('relief credited',page.evaluate('state.balance>=5000000'))
 page.evaluate('Math.random=()=>0.1')
 page.locator('[data-buy="1"]').click()
 page.evaluate('items.forEach(i=>cut(i,100,i.x*100+50,i.y*100+50))')
 page.locator('#settle').click()
 ok('settlement auto-appraises genuine',page.evaluate('items[0].status==="true" && items[0].price>items[0].estimate'))
 page.locator('#keepSelected').click()
 ok('only real treasure collected',page.evaluate('state.collection.length===1 && state.collection[0].status==="true"'))
 old=page.evaluate('state.balance')
 page.wait_for_timeout(1200)
 ok('passive dividends accrue',page.evaluate('state.balance')>old)
 page.locator('#gallery').click();page.locator('[data-detail="0"]').click()
 ok('gallery details description date valuation',page.locator('#modal').inner_text().find('收藏日期')>=0)
 page.locator('#closeDetail').click()
 page.reload()
 ok('collection and wallet persisted',page.evaluate('state.collection.length===1 && state.balance>0'))
 page.evaluate('state.lastDividend=Date.now()-86400000;const b=state.balance;accrue();window.delta=state.balance-b;')
 ok('offline dividends capped at eight hours',page.evaluate('Math.abs(delta-incomeRate()*28800)<.1'))
 page.evaluate('Math.random=()=>0.1')
 page.locator('[data-buy="0"]').click()
 page.evaluate('cut(items[0],.3,50,50);save()')
 progress=page.evaluate('items[0].progress')
 page.reload()
 ok('active box resumes without another charge',page.evaluate('run!==null && items[0].progress')==progress and page.locator('#gameView').is_visible())
 # Actual mobile touchscreen input on the resumed large plate.
 page.locator('#game').scroll_into_view_if_needed()
 box=page.locator('#game').bounding_box()
 center=page.evaluate('({x:items[0].x+1.5,y:items[0].y+1.5})')
 page.touchscreen.tap(box['x']+center['x']/6*box['width'],box['y']+center['y']/6*box['height'])
 ok('mobile touchscreen cuts freely',page.evaluate('items[0].progress')>progress)
 # Keyboard cutting + DOM-based expert button.
 page.locator('#game').focus()
 for _ in range(8):page.keyboard.press('Space')
 ok('keyboard freely cuts first large plate',page.evaluate('items[0].open'))
 page.evaluate('Math.random=()=>0.1');page.locator('#appraiseAll').click()
 page.evaluate('items.forEach(i=>cut(i,100,50,50))');page.locator('#settle').click()
 before=page.evaluate('state.balance');v=page.evaluate('value')
 page.locator('#sellAll').click()
 ok('sell genuine assets credits cash, no duplicate collection',abs(page.evaluate('state.balance')-before-v)<100 and page.evaluate('state.collection.length===1'))
 for width in [320,390,768,1280]:
  page.set_viewport_size({'width':width,'height':900})
  ok(f'no horizontal overflow at {width}px',page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
 ok('no browser JS runtime errors',not errors)
 browser.close()
server.shutdown()
print(f'VALIDATION COMPLETE: {len(checks)} checks passed; JavaScript syntax passed.')
