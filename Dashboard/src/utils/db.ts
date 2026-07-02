export interface ExperimentMeta {
  name: string;
  timestamp: string; // ISO string
  interval: number;
  status: 'recording' | 'recorded';
  datapointsCount: number;
}

export interface DataPoint {
  id?: number;
  experimentName: string;
  timestamp: string; // ISO string
  data: any; // the systemData object
}

const DB_NAME = 'hvac_telemetry_db';
const DB_VERSION = 1;
const STORE_EXPERIMENTS = 'experiments';
const STORE_DATAPOINTS = 'datapoints';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_EXPERIMENTS)) {
        db.createObjectStore(STORE_EXPERIMENTS, { keyPath: 'name' });
      }

      if (!db.objectStoreNames.contains(STORE_DATAPOINTS)) {
        const dpStore = db.createObjectStore(STORE_DATAPOINTS, { keyPath: 'id', autoIncrement: true });
        dpStore.createIndex('experimentName', 'experimentName', { unique: false });
      }
    };
  });
};

export const startExperiment = async (name: string, interval: number): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EXPERIMENTS, 'readwrite');
    const store = tx.objectStore(STORE_EXPERIMENTS);
    
    const exp: ExperimentMeta = {
      name,
      timestamp: new Date().toISOString(),
      interval,
      status: 'recording',
      datapointsCount: 0,
    };

    store.put(exp);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const stopExperiment = async (name: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EXPERIMENTS, 'readwrite');
    const store = tx.objectStore(STORE_EXPERIMENTS);
    
    const getReq = store.get(name);
    getReq.onsuccess = () => {
      const exp = getReq.result;
      if (exp) {
        exp.status = 'recorded';
        store.put(exp);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const saveDatapoint = async (experimentName: string, data: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_EXPERIMENTS, STORE_DATAPOINTS], 'readwrite');
    const expStore = tx.objectStore(STORE_EXPERIMENTS);
    const dpStore = tx.objectStore(STORE_DATAPOINTS);
    
    // Save the datapoint
    dpStore.add({
      experimentName,
      timestamp: new Date().toISOString(),
      data,
    });

    // Update the count
    const getReq = expStore.get(experimentName);
    getReq.onsuccess = () => {
      const exp = getReq.result;
      if (exp) {
        exp.datapointsCount = (exp.datapointsCount || 0) + 1;
        expStore.put(exp);
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getExperiments = async (): Promise<ExperimentMeta[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_EXPERIMENTS, 'readonly');
    const store = tx.objectStore(STORE_EXPERIMENTS);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

export const getExperimentData = async (experimentName: string): Promise<DataPoint[]> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_DATAPOINTS, 'readonly');
    const store = tx.objectStore(STORE_DATAPOINTS);
    const index = store.index('experimentName');
    const req = index.getAll(experimentName);
    
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
};

export const deleteExperiment = async (experimentName: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([STORE_EXPERIMENTS, STORE_DATAPOINTS], 'readwrite');
    const expStore = tx.objectStore(STORE_EXPERIMENTS);
    const dpStore = tx.objectStore(STORE_DATAPOINTS);
    
    expStore.delete(experimentName);

    const index = dpStore.index('experimentName');
    const req = index.openCursor(IDBKeyRange.only(experimentName));
    
    req.onsuccess = (e: any) => {
      const cursor = e.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      }
    };

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const checkStorageQuota = async (): Promise<{ usage: number, quota: number, warning: boolean }> => {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    // Warn if using more than 80% of quota
    const warning = quota > 0 && (usage / quota) > 0.8;
    return { usage, quota, warning };
  }
  return { usage: 0, quota: 0, warning: false };
};
