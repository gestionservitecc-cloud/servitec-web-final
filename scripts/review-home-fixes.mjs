import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(`${process.env.TEMP}/servitec-qa-tools/package.json`);
const { chromium } = require('playwright');
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto('http://localhost:3000/conocenos');
 const photos=page.getByAltText('Local de ServiTec',{exact:true});
 assert.equal(await photos.count(),4);
 for(const photo of await photos.all()){await photo.scrollIntoViewIfNeeded(); await photo.evaluate(img=>img.decode());assert.ok(await photo.evaluate(img=>img.naturalWidth>0));}
 await page.screenshot({path:'artifacts/qa/conocenos-fixed.png',fullPage:true});
 await page.route('**/api/equipos',route=>route.fulfill({json:[{id:'qa',orden:1,categoria:'notebook',condition:'Sellado',recomendada:true,estado:'disponible',nombre:'Equipo de prueba',promo:121000,imagenes:[]}]}));
 await page.goto('http://localhost:3000/');
 const card=page.locator('article').filter({hasText:'Equipo de prueba'});
 await card.getByText('Sin imp. nac. $100.000',{exact:true}).waitFor();
 assert.equal(await card.locator('.text-emerald-700').count(),1);
 assert.equal(await card.locator('.text-rose-600').count(),1);
 await card.screenshot({path:'artifacts/qa/destacados-fixed.png'});
 console.log('Four original photos decoded; featured price, tax and colors passed');
} finally {await browser.close();}
