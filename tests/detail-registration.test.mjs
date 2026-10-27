import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';
import {test} from 'node:test';
import {detailTransform} from '../lib/viewer.js';
import {rooms} from '../lib/geometry.js';
import {buildPresentation} from '../lib/presentation.js';

test('all four registered slab corners sample their matching source corner',()=>{
 const d=rooms.kitchen.slabDetail,m=detailTransform(d);
 d.registration.target.forEach(([px,py],i)=>{
  const x=px/d.width,y=py/d.height,z=m[2]*x+m[5]*y+m[8];
  const result=[(m[0]*x+m[3]*y+m[6])/z*d.width,(m[1]*x+m[4]*y+m[7])/z*d.height];
  result.forEach((value,axis)=>assert.ok(Math.abs(value-d.registration.source[i][axis])<.001));
 });
});

test('rooms without registration retain their original projection',()=>{
 assert.deepEqual([...detailTransform(undefined)],[1,0,0,0,1,0,0,0,1]);
});

test('client presentation embeds the registration helper as executable classic JavaScript',()=>{
 const catalog=JSON.parse(readFileSync(new URL('../lib/catalog.json',import.meta.url)));
 const viewerCode=readFileSync(new URL('../lib/viewer.js',import.meta.url),'utf8');
 const html=buildPresentation({session:{name:'QA',date:new Date().toISOString(),selections:{kitchen:rooms.kitchen.defaults,bath:rooms.bath.defaults}},catalog,rooms,images:{},viewerCode,slabDetails:{kitchen:rooms.kitchen.slabDetail}});
 const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
 assert.doesNotThrow(()=>new Script(script));
 assert.ok(script.includes('"registration":'));
});
