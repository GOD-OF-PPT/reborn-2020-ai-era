/** Fault injection at the database seam, shared by emulator and native-browser checks. */
export function abortAfterHeadWrite(base: IDBFactory, databaseName: string) {
  const trace = { writeSucceeded: false, abortIssued: false }
  let armed = true
  const factory: IDBFactory = {
    cmp: (a, b) => base.cmp(a, b),
    databases: () => base.databases(),
    deleteDatabase: (name) => base.deleteDatabase(name),
    open: (name, version) => {
      const request = version === undefined ? base.open(name) : base.open(name, version)
      request.addEventListener('success', () => {
        const database = request.result
        if (database.name !== databaseName) return
        const original = database.transaction.bind(database)
        Object.defineProperty(database, 'transaction', { configurable: true, value: (...args: Parameters<IDBDatabase['transaction']>) => {
          const transaction = original(...args)
          if (transaction.mode === 'readwrite' && transaction.objectStoreNames.contains('heads')) {
            const store = transaction.objectStore('heads')
            const put = store.put.bind(store)
            Object.defineProperty(store, 'put', { configurable: true, value: (...values: Parameters<IDBObjectStore['put']>) => {
              const write = put(...values)
              if (armed) {
                armed = false
                write.addEventListener('success', () => { trace.writeSucceeded = true; transaction.abort(); trace.abortIssued = true }, { once: true })
              }
              return write
            } })
          }
          return transaction
        } })
      }, { once: true })
      return request
    },
  }
  return { factory, trace }
}
