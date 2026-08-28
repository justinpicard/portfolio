import { readonly, ref } from 'vue'

const hasRuntimeError = ref(false)

export function reportRuntimeError() {
	hasRuntimeError.value = true
}

export function clearRuntimeError() {
	hasRuntimeError.value = false
}

export function useRuntimeError() {
	return {
		hasRuntimeError: readonly(hasRuntimeError)
	}
}
