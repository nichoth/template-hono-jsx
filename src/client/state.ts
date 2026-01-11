import { type Signal, signal } from '@preact/signals'
import Route from 'route-event'

export type AppState = ReturnType<typeof State>

/**
 * Setup application state
 *   - routes
 *   - counter
 */
export function State ():{
    route:Signal<string>;
    count:Signal<number>;
    _setRoute:(path:string)=>void;
} {  // eslint-disable-line indent
    const onRoute = Route()

    const state = {
        _setRoute: onRoute.setRoute.bind(onRoute),
        count: signal<number>(0),
        route: signal<string>(location.pathname + location.search)
    }

    /**
     * Set the app state to match the browser URL
     */
    onRoute((path: string, data) => {
        state.route.value = path
        // Handle scroll state like a web browser
        // (restore scroll position on back/forward)
        if (data.popstate) {
            return window.scrollTo(data.scrollX, data.scrollY)
        }
        // If this was a link click (not back button), scroll to top
        window.scrollTo(0, 0)
    })

    return state
}

State.Increase = function (state: ReturnType<typeof State>) {
    state.count.value++
}

State.Decrease = function (state: ReturnType<typeof State>) {
    state.count.value--
}
