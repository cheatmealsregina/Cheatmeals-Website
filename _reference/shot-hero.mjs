import http from 'http';
import puppeteer from 'puppeteer-core';
import { readFile } from 'fs/promises';
import { existsSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const DIST = fileURLToPath(new URL('../dist/', import.meta.url));
const OUT = fileURLToPath(new URL('./shots/', import.meta.url));
const PORT = 4324;
const EDGE = ['C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe','C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'].find((p)=>existsSync(p));
const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.json':'application/json'};
const sleep=(ms)=>new Promise(r=>setTimeout(r,ms));
function fileFor(p){if(p==='/'||p.includes('..'))return path.join(DIST,'index.html');const d=path.join(DIST,p);if(existsSync(d)&&statSync(d).isFile())return d;const i=path.join(DIST,p,'index.html');if(existsSync(i))return i;if(!path.extname(p))return path.join(DIST,'index.html');return d;}
const server=http.createServer(async(req,res)=>{try{const f=fileFor(decodeURIComponent((req.url||'/').split('?')[0]));res.setHeader('content-type',MIME[path.extname(f)]||'application/octet-stream');res.end(await readFile(f));}catch(e){res.statusCode=500;res.end('e');}});
await new Promise(r=>server.listen(PORT,r));
import { mkdirSync } from 'fs';
mkdirSync(OUT,{recursive:true});
const b=await puppeteer.launch({executablePath:EDGE,headless:'new',args:['--no-sandbox']});
for(const [label,w,theme] of [['hero-mobile-light',390,'light'],['hero-desktop-light',1280,'light'],['hero-mobile-dark',390,'dark']]){
  const p=await b.newPage();
  await p.setViewport({width:w,height:900,deviceScaleFactor:2,isMobile:w<768});
  await p.goto(`http://localhost:${PORT}/`,{waitUntil:'domcontentloaded'});
  await p.evaluate((t)=>localStorage.setItem('cm-theme',t),theme);
  await p.goto(`http://localhost:${PORT}/?x=${label}`,{waitUntil:'networkidle0',timeout:30000});
  await sleep(1200);
  const hero=await p.$('.pt-hero');
  await (hero||p).screenshot({path:path.join(OUT,label+'.png')});
  console.log('wrote',label+'.png');
  await p.close();
}
await b.close();server.close();
