import { signal, type Signal } from '@preact/signals'

/**
 * Isomorphic application state
 * Works on both server and client
 */
export interface AppState {
    route: Signal<string>;
    count: Signal<number>;
}

/**
 * Serializable state for hydration (plain values, no signals)
 */
export interface SerializedState {
    route: string;
    count: number;
}

/**
 * Create initial state with signals
 * Works on both server and client
 */
export function createInitialState (route: string, count = 0): AppState {
    return {
        route: signal(route),
        count: signal(count),
    }
}

/**
 * Serialize state for hydration
 */
export function serializeState (state: AppState): string {
    return JSON.stringify({
        route: state.route.value,
        count: state.count.value,
    })
}

/**
 * Deserialize state from hydration data
 */
export function deserializeState (json: string): SerializedState {
    return JSON.parse(json)
}
