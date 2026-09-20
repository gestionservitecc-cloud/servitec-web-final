import { createRequire } from 'node:module';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(`${process.env.TEMP}/servitec-qa-tools/package.json`);
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try {
 const context=await browser.newContext();
 await context.route('**/api/**',r=>{assert.equal(r.request().method(),'GET');const path=new URL(r.request().url()).pathname;if(path==='/api/equipos') return r.fulfill({json:Array.from({length:16},(_,i)=>({id:`qa${i}`,orden:i,categoria:'notebook',condition:i<8?'Sellado':'Reacondicionado',estado:'disponible',nombre:`Equipo de prueba ${i}`,promo:75000,original:75000,imagenes:[],specs:{}}))});if(path==='/api/productos') return r.fulfill({json:[]});if(path==='/api/componentes') return r.fulfill({json:{catalog:{}}});return r.continue();});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const configs=[['servicios','servicios',20,10,1.03],['reacondicionados','reacondicionados',-20,15,1.02],['tienda','tienda',15,20,1.02],['conocenos','nosotros',8,10,1.02]];
 async function matrix(){return page.locator('[data-background-layer]').evaluate(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return {x:m.m41,y:m.m42,scale:m.a};});}
 for(const width of [1440,900,390]) {
  await page.setViewportSize({width,height:900});
  const strength=width>=1024?1:width>=768?.7:.5;
  for(const [route,preset,x,y,scale] of configs) {
   await page.goto(`http://127.0.0.1:3100/${route}`);
   const section=page.locator('[data-animated-background]');const layer=page.locator('[data-background-layer]');
   await page.waitForFunction(()=>document.querySelector('[data-background-layer]')?.style.transform);
   const image=await layer.evaluate(e=>getComputedStyle(e).backgroundImage.slice(5,-2));
   assert.ok(image.endsWith(`/backgrounds/${preset}.png`));
   const r=await page.request.get(image);assert.equal(r.status(),200);
   await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(1200);const initial=await matrix();
   const height=await section.evaluate(e=>e.getBoundingClientRect().bottom+scrollY);
   await page.evaluate(y=>scrollTo(0,y+5),height);await page.waitForTimeout(1200);const end=await matrix();
   assert.ok(Math.abs(end.x-x*strength)<.1,`${route} x ${JSON.stringify(end)}`);
   assert.ok(Math.abs(end.y-y*strength)<.1);assert.ok(Math.abs(end.scale-(1+(scale-1)*strength))<.001);
   assert.ok(preset==='reacondicionados'?end.x<initial.x:end.x>initial.x);
   await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(1200);assert.ok(Math.abs((await matrix()).x-initial.x)<.1);
   assert.ok(await layer.evaluate(e=>{const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return a.left<=b.left&&a.right>=b.right&&a.top<=b.top&&a.bottom>=b.bottom;}));
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   if(width!==900) await section.screenshot({path:`artifacts/qa/background-${route}-${width}.png`});
   results.push(`${route} ${width}px: image, direction, end values, reverse, edge coverage and no horizontal overflow passed`);
  }
 }
 // Same component crossing breakpoints and live reduced-motion changes.
 for(const width of [1440,900,390,1440]) {
  await page.setViewportSize({width,height:900});await page.waitForTimeout(350);
  await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(1200);
  assert.ok(Math.abs((await matrix()).x-8*(width>=1024?1:width>=768?.7:.5))<.1, `resize ${width}: ${JSON.stringify(await matrix())}`);
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);
 assert.equal(await page.locator('[data-background-layer]').evaluate(e=>getComputedStyle(e).transform),'none');
 await page.evaluate(()=>scrollTo(0,0));assert.equal(await page.locator('[data-background-layer]').evaluate(e=>getComputedStyle(e).transform),'none');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForFunction(()=>document.querySelector('[data-background-layer]').style.transform);
 for(let i=0;i<2;i++) {
  const old=await page.locator('[data-background-layer]').elementHandle();
  await page.getByRole('link',{name:'Ver servicios',exact:true}).click();await page.waitForURL(/servicios/);
  assert.equal(await old.evaluate(e=>e.style.transform),'');
  assert.equal(await page.locator('[data-background-layer]').count(),1);
  await page.goto('http://127.0.0.1:3100/conocenos');
 }
 results.push('Live breakpoint changes, reduced motion toggle and two route cycles clean styles and preserve one layer');
 assert.deepEqual(errors,[]);await writeFile('artifacts/qa/background-results.json',JSON.stringify(results,null,2));console.log(results.join('\n'));
} finally {await browser.close();}
