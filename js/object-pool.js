// ========================================
// Generic object pool — reuse short-lived entities to cut GC churn
// ========================================

/**
 * @template T
 * @param {() => T} factory Creates a fresh object when the pool is empty
 */
export class ObjectPool {
  constructor(factory) {
    this._factory = factory;
    this._free = [];
  }

  /** @returns {T} */
  acquire() {
    return this._free.length ? this._free.pop() : this._factory();
  }

  /** @param {T} obj */
  release(obj) {
    this._free.push(obj);
  }

  /** Release every element from an array (caller should clear the array after). */
  releaseArrayElements(arr) {
    for (let i = 0; i < arr.length; i++) {
      this._free.push(arr[i]);
    }
  }

  clearFreeList() {
    this._free.length = 0;
  }
}
