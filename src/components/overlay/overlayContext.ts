import type { InjectionKey, Ref } from 'vue'

export const overlayScrollContainerKey = Symbol('overlayScrollContainer') as InjectionKey<Ref<HTMLElement | null>>
