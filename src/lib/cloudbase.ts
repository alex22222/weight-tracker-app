/**
 * CloudBase (腾讯云开发) 数据库客户端
 */

// 模拟 CloudBase 数据库接口（实际使用时需要替换为真实的 CloudBase SDK）
class MockCloudBaseDB {
  private collections: Map<string, any[]> = new Map()
  private idCounter = 1

  collection(name: string) {
    return new MockCollection(name, this.collections, () => this.idCounter++)
  }
}

class MockCollection {
  private name: string
  private collections: Map<string, any[]>
  private getId: () => number

  constructor(name: string, collections: Map<string, any[]>, getId: () => number) {
    this.name = name
    this.collections = collections
    this.getId = getId
  }

  private getData(): any[] {
    if (!this.collections.has(this.name)) {
      this.collections.set(this.name, [])
    }
    return this.collections.get(this.name)!
  }

  async add(data: any) {
    const id = String(this.getId())
    const doc = { _id: id, ...data }
    this.getData().push(doc)
    return { id }
  }

  async doc(id: string) {
    const data = this.getData()
    const index = data.findIndex(d => d._id === id)
    return {
      get: async () => ({ data: index >= 0 ? [data[index]] : [] }),
      update: async (newData: any) => {
        if (index >= 0) {
          data[index] = { ...data[index], ...newData }
        }
      },
      remove: async () => {
        if (index >= 0) {
          data.splice(index, 1)
        }
      },
    }
  }

  where(query: any) {
    return new MockQuery(this.getData(), query)
  }

  async get() {
    return { data: this.getData() }
  }

  orderBy(field: string, order: 'asc' | 'desc' = 'asc') {
    return new MockQuery(this.getData(), {}, { orderBy: field, order })
  }

  limit(n: number) {
    return new MockQuery(this.getData(), {}, { limit: n })
  }
}

class MockQuery {
  private data: any[]
  private query: any
  private options: { limit?: number; orderBy?: string; order?: 'asc' | 'desc' }

  constructor(data: any[], query: any = {}, options: any = {}) {
    this.data = data
    this.query = query
    this.options = options
  }

  where(additionalQuery: any) {
    return new MockQuery(this.data, { ...this.query, ...additionalQuery }, this.options)
  }

  orderBy(field: string, order: 'asc' | 'desc' = 'asc') {
    return new MockQuery(this.data, this.query, { ...this.options, orderBy: field, order })
  }

  limit(n: number) {
    return new MockQuery(this.data, this.query, { ...this.options, limit: n })
  }

  async get() {
    let result = this.data.filter(doc => this.matchQuery(doc, this.query))
    
    if (this.options.orderBy) {
      result.sort((a, b) => {
        const aVal = a[this.options.orderBy!]
        const bVal = b[this.options.orderBy!]
        if (this.options.order === 'desc') {
          return bVal > aVal ? 1 : -1
        }
        return aVal > bVal ? 1 : -1
      })
    }
    
    if (this.options.limit) {
      result = result.slice(0, this.options.limit)
    }
    
    return { data: result }
  }

  async count() {
    const result = this.data.filter(doc => this.matchQuery(doc, this.query))
    return { data: { total: result.length } }
  }

  private matchQuery(doc: any, query: any): boolean {
    for (const key in query) {
      if (key === '$or') {
        return query[key].some((q: any) => this.matchQuery(doc, q))
      }
      if (key === '$in') {
        // 处理 $in 查询
        continue
      }
      if (typeof query[key] === 'object' && query[key] !== null) {
        if (query[key].$gte !== undefined && doc[key] < query[key].$gte) return false
        if (query[key].$lte !== undefined && doc[key] > query[key].$lte) return false
        if (query[key].$lt !== undefined && doc[key] >= query[key].$lt) return false
        if (query[key].$gt !== undefined && doc[key] <= query[key].$gt) return false
      } else if (doc[key] !== query[key]) {
        return false
      }
    }
    return true
  }
}

// 导出数据库实例
export const db = new MockCloudBaseDB()
