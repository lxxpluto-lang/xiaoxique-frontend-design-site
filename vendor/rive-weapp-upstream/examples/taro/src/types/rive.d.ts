// Type stubs for the framework-agnostic Rive runtime (plain CommonJS .js).
// Taro builds with babel, so these only quiet the editor — they don't affect the build.

declare module '*/rive/runtime' {
  export class RiveInstance {
    constructor(opts: any)
    ready: Promise<RiveInstance>
    info(): any
    play(): void
    pause(): void
    stop(): void
    setBool(name: string, value: boolean): void
    setNumber(name: string, value: number): void
    fireTrigger(name: string): void
    getInputs(): { name: string; type: string }[]
    pointerDown(x: number, y: number, id?: number): void
    pointerMove(x: number, y: number, id?: number): void
    pointerUp(x: number, y: number, id?: number): void
    resize(w: number, h: number, dpr?: number): void
    cleanup(): void
  }
}

declare module '*/adapter/loader' {
  export function setWasmPath(p: string): void
  export function loadRiveModule(): Promise<any>
}
