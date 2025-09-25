const DB = 'foerder-nav'; 
const STORE = 'kv';

function openDB(): Promise<IDBDatabase>{
  return new Promise((res, rej)=>{
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = ()=> r.result.createObjectStore(STORE);
    r.onsuccess = ()=> res(r.result);
    r.onerror = ()=> rej(r.error);
  });
}

export async function idbGet<T>(k:string): Promise<T|undefined> { 
  const db=await openDB(); 
  return new Promise<T|undefined>((res, rej)=>{ 
    const tx=db.transaction(STORE,'readonly'); 
    const req=tx.objectStore(STORE).get(k); 
    req.onsuccess=()=>res(req.result as T|undefined); 
    req.onerror=()=>rej(req.error); 
  });
}

export async function idbSet<T>(k:string,v:T): Promise<void> { 
  const db=await openDB(); 
  return new Promise<void>((res, rej)=>{ 
    const tx=db.transaction(STORE,'readwrite'); 
    tx.objectStore(STORE).put(v,k); 
    tx.oncomplete=()=>res(); 
    tx.onerror=()=>rej(tx.error); 
  });
}

export async function idbDel(k:string): Promise<void> { 
  const db=await openDB(); 
  return new Promise<void>((res, rej)=>{ 
    const tx=db.transaction(STORE,'readwrite'); 
    tx.objectStore(STORE).delete(k); 
    tx.oncomplete=()=>res(); 
    tx.onerror=()=>rej(tx.error); 
  });
}

export async function idbKeys(): Promise<string[]> { 
  const db=await openDB(); 
  return new Promise<string[]>((res, rej)=>{ 
    const tx=db.transaction(STORE,'readonly'); 
    const req=tx.objectStore(STORE).getAllKeys(); 
    req.onsuccess=()=>res(req.result as string[]); 
    req.onerror=()=>rej(req.error); 
  });
}