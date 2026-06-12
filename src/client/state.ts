import { type Signal, signal } from '@preact/signals-core'
import Route from 'route-event'
import Debug from '@substrate-system/debug'
const debug = Debug('example:state')

export interface AppState {
    route:Signal<string>;
    count:Signal<number>;
    _setRoute:(path: string) => void;
}

export interface InitialClientState {
    route?:string;
    count?:number;
}

/**
 * Setup any state
 *   - routes
 */
export function State (initial:InitialClientState = {}):AppState {
    const onRoute = Route()

    const state:AppState = {
        _setRoute: onRoute.setRoute.bind(onRoute),
        count: signal<number>(initial.count ?? 0),
        route: signal<string>(
            initial.route ?? (location.pathname + location.search)
        )
    }

    debug('create state', state)

    /**
     * set the app state to match the browser URL
     */
    onRoute((path:string, data) => {
        state.route.value = path
        // handle scroll state like a web browser
        // (restore scroll position on back/forward)
        if (data.popstate) {
            return window.scrollTo(data.scrollX, data.scrollY)
        }
        // if this was a link click (not back button), then scroll to top
        window.scrollTo(0, 0)
    })

    return state
}

State.Increase = function (state:AppState) {
    state.count.value++
}

State.Decrease = function (state:AppState) {
    state.count.value--
}
