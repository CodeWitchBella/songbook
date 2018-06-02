export type Subscription = {
  unsubscribe(): void
}
export default class LiteEvent<T> {
  private handlers: ((data: T) => void)[] = []

  public subscribe(handler: (data: T) => void) {
    this.handlers.push(handler)
    return {
      unsubscribe: () => {
        this.handlers = this.handlers.filter(h => h !== handler)
      },
    }
  }

  public trigger(data: T) {
    this.handlers.slice(0).forEach(h => h(data))
  }
}
