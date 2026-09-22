import {createRequire} from 'node:module';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const require=createRequire(`${process.env.TEMP}/servitec-qa-tools/package.json`);
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try {
 const context=await browser.newContext();
 await context.route('**/api/**',r=>{assert.equal(r.request().method(),'GET');const p=new URL(r.request().url()).pathname;if(p==='/api/equipos')return r.fulfill({json:Array.from({length:24},(_,i)=>({id:`qa${i}`,orden:i,categoria:'notebook',condition:i<12?'Sellado':'Reacondicionado',estado:'disponible',nombre:`Equipo de prueba ${i}`,promo:75000,original:75000,imagenes:[],specs:{}}))});if(p==='/api/productos')return r.fulfill({json:[]});return r.continue();});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const opacity=()=>page.locator('[data-page-background]').evaluate(e=>Number(getComputedStyle(e).opacity));
 const matrix=()=>page.locator('[data-page-background-layer]').evaluate(e=>{const m=new DOMMatrix(getComputedStyle(e).transform);return {x:m.m41,y:m.m42,scale:m.a};});
 async function scroll(y){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(1300);}
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:900});
  for(const route of ['servicios','reacondicionados','tienda','conocenos']) {
   await page.goto(`http://127.0.0.1:3100/${route}`);
   await page.waitForFunction(()=>document.querySelector('[data-page-background-layer]')?.style.transform);
   await scroll(0);assert.equal(await opacity(),0);
   const end=await page.locator('[data-animated-background]').evaluate(e=>e.getBoundingClientRect().bottom+scrollY);
   await scroll(end-5);assert.equal(await opacity(),0,'hidden until header is completely out');
   await scroll(end+(width===390?96:160)+10);assert.ok(await opacity()>.09);
   const middle=await matrix();
   await page.screenshot({path:`artifacts/qa/background-page-${route}-${width}.png`});
   await scroll(await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight));
   const bottom=await matrix();assert.ok(Math.abs(bottom.x-middle.x)>.1,'movement continues through rest of page');
   assert.ok(await page.locator('[data-page-background-layer]').evaluate(e=>{const a=e.getBoundingClientRect(),b=e.parentElement.getBoundingClientRect();return a.left<=b.left&&a.right>=b.right&&a.top<=b.top&&a.bottom>=b.bottom;}));
   await scroll(0);assert.equal(await opacity(),0);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   results.push(`${route} ${width}px: delayed handoff, persistent scroll motion, full edge coverage and reverse transition passed`);
  }
 }
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);
 assert.equal(await page.locator('[data-page-background]').evaluate(e=>getComputedStyle(e).display),'none');
 assert.equal(await page.locator('[data-background-layer]').evaluate(e=>getComputedStyle(e).transform),'none');
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(300);
 for(let i=0;i<2;i++){
  const old=await page.locator('[data-page-background]').elementHandle();
  await page.getByRole('link',{name:'Ver servicios',exact:true}).click();await page.waitForURL(/servicios/);
  assert.equal(await old.evaluate(e=>e.style.opacity),'');
  assert.equal(await page.locator('[data-page-background]').count(),1);
  await page.goto('http://127.0.0.1:3100/conocenos');
 }
 assert.deepEqual(errors,[]);results.push('Reduced motion and two navigation cycles clean up page background effects');
 await writeFile('artifacts/qa/background-page-results.json',JSON.stringify(results,null,2));console.log(results.join('\n'));
} finally {await browser.close();}
