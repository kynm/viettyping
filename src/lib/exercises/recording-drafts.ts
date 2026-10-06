function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('easytyping-exercise-recordings', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('drafts');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Không thể lưu ghi âm trên thiết bị.'));
  });
}
export async function recordingDraft(key: string, action: 'get' | 'put' | 'delete', blob?: Blob): Promise<Blob | undefined> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction('drafts', action === 'get' ? 'readonly' : 'readwrite'), store = transaction.objectStore('drafts');
      const request = action === 'get' ? store.get(key) : action === 'put' ? store.put(blob, key) : store.delete(key);
      let result: Blob | undefined;
      request.onsuccess = () => { result = request.result instanceof Blob ? request.result : undefined; };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(new Error('Không thể lưu ghi âm trên thiết bị.'));
    });
  } finally { db.close(); }
}
