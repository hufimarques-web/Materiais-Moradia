export const SESSION = 'domaine-atelier-session-v2';
export const SAVED = 'domaine-atelier-saved-v1';
export const clone = value => JSON.parse(JSON.stringify(value));
export function defaults(catalog) {
  return Object.fromEntries(Object.entries(catalog.spaces).map(([id,space])=>[id,Object.fromEntries(space.categories.map(category=>[category.id,category.default]))]));
}
export function validateSession(data,catalog) {
  if(!data||data.version!==1||!data.selections||typeof data.selections!=='object') throw Error('Este ficheiro não é uma sessão válida do Atelier.');
  const selections={};
  for(const [room,space] of Object.entries(catalog.spaces)) {
    selections[room]={};
    for(const category of space.categories) {
      const id=data.selections[room]?.[category.id];
      if(!category.options.includes(id)) throw Error('A sessão contém materiais não disponíveis neste catálogo.');
      selections[room][category.id]=id;
    }
  }
  return {version:1,room:Object.hasOwn(catalog.spaces,data.room)?data.room:'kitchen',selections,name:typeof data.name==='string'?data.name.slice(0,90):'Proposta importada',date:typeof data.date==='string'?data.date:new Date().toISOString()};
}
export function findKit(catalog,selections,room) {
  return catalog.kits.find(kit=>Object.entries(kit.selections[room]).every(([key,id])=>selections[room][key]===id));
}
export function downloadFile(blob,name) {
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
export function downloadImage(data,name) {const a=document.createElement('a');a.href=data;a.download=name;a.click();}
