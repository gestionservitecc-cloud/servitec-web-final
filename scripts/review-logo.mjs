import { createRequire } from 'node:module';
import { writeFile, mkdir } from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(`${process.env.TEMP}/servitec-qa-tools/package.json`);
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const base='http://127.0.0.1:3100';
const results=[];
async function context(options={}) {
 const c=await browser.newContext(options);
 await c.route('**/api/**',route=>{
  assert.equal(route.request().method(),'GET');
  const path=new URL(route.request().url()).pathname;
  if(path==='/api/equipos'||path==='/api/productos') return route.fulfill({json:[]});
  if(path==='/api/componentes') return route.fulfill({json:{catalog:{}}});
  return route.continue();
 });
 return c;
}
async function position(page,p) {
 await page.evaluate(p => window.scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight)),p);
 await page.waitForTimeout(650);
}
async function angle(page){return Number(await page.locator('[data-logo-scene]').getAttribute('data-rotation'));}
try {
 await mkdir('artifacts/qa',{recursive:true});
 for(const width of [1440,390]) {
  const c=await context({viewport:{width,height:900},deviceScaleFactor:3});
  await c.addInitScript(()=>{
   window.__logoQA={draws:0,lost:0,listeners:new Set()};
   const add=EventTarget.prototype.addEventListener, remove=EventTarget.prototype.removeEventListener;
   EventTarget.prototype.addEventListener=function(type,fn,...args){
    if(type==='visibilitychange'&&/updateVisibility/.test(fn?.name || '')) window.__logoQA.listeners.add(fn);
    return add.call(this,type,fn,...args);
   };
   EventTarget.prototype.removeEventListener=function(type,fn,...args){
    if(type==='visibilitychange') window.__logoQA.listeners.delete(fn);
    return remove.call(this,type,fn,...args);
   };
   for(const name of ['drawElements','drawArrays']) {
    const original=WebGL2RenderingContext.prototype[name];
    WebGL2RenderingContext.prototype[name]=function(...args){window.__logoQA.draws++;return original.apply(this,args);};
   }
  });
  const page=await c.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base);
  await position(page,0);
  await page.locator('[data-logo-scene][data-ready=true]').waitFor({timeout:60000});
  await position(page,0);
  assert.ok(Math.abs(await angle(page))<.02);
  await page.screenshot({path:`artifacts/qa/logo-front-${width}.png`});
  await position(page,.5);assert.ok(Math.abs(await angle(page)-Math.PI)<.03);
  await page.screenshot({path:`artifacts/qa/logo-back-${width}.png`});
  const stopped=await angle(page), draws=await page.evaluate(()=>window.__logoQA.draws);
  await page.waitForTimeout(500);
  assert.equal(await angle(page),stopped);
  assert.equal(await page.evaluate(()=>window.__logoQA.draws),draws,'no idle rendering');
  await position(page,1);assert.ok(Math.abs(await angle(page)-2*Math.PI)<.03);
  await position(page,.25);assert.ok(Math.abs(await angle(page)-Math.PI/2)<.03);
  await page.setViewportSize({width:width===1440?1100:360,height:800});
  await position(page,.5);assert.ok(Math.abs(await angle(page)-Math.PI)<.03);
  assert.ok(await page.locator('[data-logo-scene] canvas').evaluate(c=>c.width/c.clientWidth<=1.51));
  await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));await page.waitForTimeout(650);
  const offscreen=await page.evaluate(()=>window.__logoQA.draws);await page.waitForTimeout(300);
  assert.equal(await page.evaluate(()=>window.__logoQA.draws),offscreen);
  await page.locator('[data-logo-scene] canvas').evaluate(c=>c.addEventListener('webglcontextlost',()=>window.__logoQA.lost++));
  for(let i=0;i<2;i++) {
   await page.getByRole('link',{name:'Explorar tienda',exact:true}).click();
   await page.waitForURL(/\/tienda/);
   assert.equal(await page.locator('[data-logo-scene]').count(),0);
   assert.equal(await page.evaluate(()=>window.__logoQA.listeners.size),0);
   await page.getByRole('link',{name:'ServiTec — Inicio',exact:true}).first().click();
   await page.waitForURL(base+'/');await position(page,0);
   await page.locator('[data-logo-scene][data-ready=true]').waitFor();
   assert.equal(await page.locator('[data-logo-scene] canvas').count(),1);
   assert.equal(await page.evaluate(()=>window.__logoQA.listeners.size),1);
  }
  assert.ok(await page.evaluate(()=>window.__logoQA.lost>=1),'disposed WebGL context');
  assert.deepEqual(errors,[]);
  results.push(`${width}px: front/back/full turn/reverse/stop/resize, DPR cap, idle rendering stopped at middle and bottom, two route cycles and listener/context cleanup passed`);
  await c.close();
 }
 for(const mode of ['reduced','failed','no-webgl']) {
  const c=await context({viewport:{width:390,height:850},reducedMotion:mode==='reduced'?'reduce':'no-preference'});
  if(mode==='failed') await c.route('**/servitec_logo_3d.glb',r=>r.fulfill({status:404,body:''}));
  if(mode==='no-webgl') await c.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return String(type).includes('webgl')?null:original.call(this,type,...args);};});
  const page=await c.newPage();let models=0;page.on('request',r=>{if(r.url().endsWith('.glb'))models++;});
  await page.goto(base);await position(page,0);
  await page.waitForTimeout(1500);
  assert.equal(await page.locator('[data-logo-scene] canvas').count(),0);
  await page.locator('[data-home-logo] img').evaluate(img=>img.decode());
  assert.equal(await page.locator('[data-home-logo] img').evaluate(img=>getComputedStyle(img).visibility),'visible');
  if(mode!=='failed') assert.equal(models,0);
  await page.screenshot({path:`artifacts/qa/logo-${mode}.png`});
  results.push(`${mode}: original PNG visible, no active canvas`);
  await c.close();
 }
 const c=await context();const page=await c.newPage();const requests=[];
 page.on('request',r=>{if(/servitec_logo_3d|HomeLogoScene|node_modules_three|node_modules_gsap/.test(r.url()))requests.push(r.url());});
 for(const path of ['/tienda','/conocenos','/admin']) {await page.goto(base+path);await page.waitForTimeout(300);assert.equal(await page.locator('[data-home-logo]').count(),0);}
 assert.deepEqual(requests,[]);results.push('Direct tienda/conocenos/admin visits: no scene or model/3D chunks requested');await c.close();
 await writeFile('artifacts/qa/logo-results.json',JSON.stringify(results,null,2));console.log(results.join('\n'));
} finally {await browser.close();}
