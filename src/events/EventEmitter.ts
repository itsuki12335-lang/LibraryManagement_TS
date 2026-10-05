export class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    const arr = this.listeners.get(event);
    arr!.push(callback);
  }
  emit(event: string, data?: any): void {
    if (!this.listeners.has(event)) {
      return;
    }
    for (const temp of this.listeners.get(event)!) {
      temp(data);
    }
  }
  off(event: string, callback: Function): void {
    if (this.listeners.has(event)) {
      const arr = this.listeners.get(event);
      const newArr = arr!.filter((temp) => callback !== temp);
      this.listeners.set(event, newArr);
    }
  }
}
