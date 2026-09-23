import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(`${process.env.TEMP}/servitec-qa-tools/package.json`);
const {chromium}=require('playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({reducedMotion:'reduce'});
 await page.route('**/api/equipos',r=>r.fulfill({json:Array.from({length:8},(_,i)=>({id:`qa${i}`,orden:i,categoria:'notebook',condition:i<4?'Sellado':'Reacondicionado',estado:'disponible',nombre:`Equipo de prueba ${i}`,promo:75000,original:75000,imagenes:[],specs:{}}))}));
 for(const width of [1920,1440,768,390,360]) {
  await page.setViewportSize({width,height:1000});
  await page.goto('http://127.0.0.1:3100/servicios');await page.evaluate(()=>document.fonts.ready);
  const sizes=await page.evaluate(()=>{const hero=document.querySelector('main section');const content=hero.firstElementChild;const r=hero.getBoundingClientRect(),c=content.getBoundingClientRect();return {viewport:innerWidth,hero:{width:r.width,height:r.height},content:{width:c.width,height:c.height},navigation:document.querySelector('header').getBoundingClientRect().height};});
  console.log(JSON.stringify(sizes));
  for(const route of ['/tienda','/reacondicionados']) {
   await page.goto('http://127.0.0.1:3100'+route);await page.getByText(/Equipo de prueba/).first().waitFor();
   const result=await page.locator('main .container-page').evaluateAll(nodes=>nodes.map(e=>Math.round(e.getBoundingClientRect().width)));
   assert.ok(result.every(w=>w===width),`${route} uses full viewport: ${result}`);
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'no overflow');
   const columns=await page.locator('[class*="xl:grid-cols-3"]').last().evaluate(e=>getComputedStyle(e).gridTemplateColumns.split(' ').length);
   assert.equal(columns,width>=1280?3:width>=640?2:1,`${route}: responsive column count`);
   if(width===1920) await page.screenshot({path:`artifacts/qa/${route.slice(1)}-fullwidth.png`,fullPage:false});
  }
 }
 console.log('Full-width catalogues and responsive layout passed');
} finally {await browser.close();}
