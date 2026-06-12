import { useMemo, useSyncExternalStore } from 'hono/jsx'
import { signal, type Signal } from '@preact/signals-core'

/**
 * Read a signal's current value and re-render the calling
 * component when it changes.  The hono/jsx renderer does not
 * track signal reads, so components subscribe explicitly.
 *
 * Pass the same signal on every render -- the subscription is
 * created once, on mount.
 */
export function useSignalValue<T> (sig:Signal<T>):T {
    return useSyncExternalStore(
        cb => sig.subscribe(cb),
        () => sig.value,
        () => sig.value
    )
}

/**
 * Component-local signal state, like preact's `useSignal`, but
 * compatible with the hono/jsx renderer.  Setting `.value`
 * re-renders the component.
 */
export function useSignal<T> (initial:T):Signal<T> {
    const sig = useMemo(() => signal<T>(initial), [])
    useSignalValue(sig)
    return sig
}
