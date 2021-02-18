class Coordinator {

  eStore: Record<string, Function[]>;

  constructor() {
    this.eStore = {}
  }

  on(eventName: string, callback: Function, scope?: any) {
    if (!this.eStore[eventName]) this.eStore[eventName] = []

    this.eStore[eventName].push((data: any) => callback.call(scope, data))
  }

  emit<T>(eventName: string, data: T) {
    if (this.eStore[eventName]) {
      this.eStore[eventName].forEach(event => event(data))
    }
  }

}

export default Coordinator
