/**
 * Isomorphic application state
 * Works on both server and client
 */
export interface AppState {
    route: string;
    count: number;
    setRoute: (path: string) => void;
    setCount: (count: number) => void;
}

/**
 * Create initial state for server-side rendering
 */
export function createInitialState (route: string, count = 0): AppState {
    return {
        route,
        count,
        setRoute: () => {},  // No-op on server
        setCount: () => {},  // No-op on server
    }
}

/**
 * Serialize state for hydration
 */
export function serializeState (state: AppState): string {
    return JSON.stringify({
        route: state.route,
        count: state.count,
    })
}

/**
 * Deserialize state from hydration data
 */
export function deserializeState (json: string): { route: string; count: number } {
    return JSON.parse(json)
}
