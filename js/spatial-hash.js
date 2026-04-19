// ========================================
// Uniform grid spatial hash for neighbor queries
// ========================================

/**
 * Fixed cell size grid. Insert each entity once; query neighboring cells around a point.
 * Cell size should be >= largest interaction radius so a 3×3 cell neighborhood is enough.
 */
export class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    /** @type {Map<string, object[]>} */
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  _key(cx, cy) {
    return cx + ',' + cy;
  }

  insert(x, y, item) {
    const cs = this.cellSize;
    const cx = Math.floor(x / cs);
    const cy = Math.floor(y / cs);
    const k = this._key(cx, cy);
    let bucket = this.cells.get(k);
    if (!bucket) {
      bucket = [];
      this.cells.set(k, bucket);
    }
    bucket.push(item);
  }

  /**
   * Invoke fn(item) for every entity in cells within `range` Chebyshev steps of (x,y)'s cell.
   * range=1 → 3×3, range=2 → 5×5 (needed when cell size is smaller than max interaction distance).
   * @param {number} x
   * @param {number} y
   * @param {(item: object) => void} fn
   * @param {number} [range=1]
   */
  forEachNearby(x, y, fn, range = 1) {
    const cs = this.cellSize;
    const cx = Math.floor(x / cs);
    const cy = Math.floor(y / cs);
    for (let ox = -range; ox <= range; ox++) {
      for (let oy = -range; oy <= range; oy++) {
        const bucket = this.cells.get(this._key(cx + ox, cy + oy));
        if (!bucket) continue;
        for (let i = 0; i < bucket.length; i++) {
          fn(bucket[i]);
        }
      }
    }
  }
}
