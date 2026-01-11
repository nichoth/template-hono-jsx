import { useEffect } from 'hono/jsx'
import { render } from 'hono/jsx/dom'
import Debug from '@substrate-system/debug'
import Route from 'route-event'
import { signal } from '@preact/signals'
import { App } from '../shared/App.js'
import type { AppState, SerializedState } from '../shared/state.js'
import { deserializeState } from '../shared/state.js'
import './style.css'

const debug = Debug('example')

// Set debug logging in dev env
if (import.meta.env.DEV) {
    localStorage.setItem('DEBUG', 'example:*,example')
} else {
    localStorage.removeItem('DEBUG')
    localStorage.removeItem('debug')
}

// Get initial state from server-rendered data
const initialData = getInitialState()

// Create signals for reactive state
const route = signal(initialData.route)
const count = signal(initialData.count)

const state: AppState = {
    route,
    count,
}

/**
 * Client-side wrapper that manages reactive state
 */
function ClientApp () {
    // Set up client-side routing
    useEffect(() => {
        const onRoute = Route()

        onRoute((path: string, data: { popstate?: boolean; scrollX: number; scrollY: number }) => {
            route.value = path
            // Handle scroll state like a web browser
            if (data.popstate) {
                window.scrollTo(data.scrollX, data.scrollY)
            } else {
                window.scrollTo(0, 0)
            }
        })
    }, [])

    debug('rendering app...', state)

    // @ts-expect-error DEV env
    if (import.meta.env.DEV) window.state = state

    return <App state={state} />
}

/**
 * Get initial state from server-rendered script tag
 */
function getInitialState (): SerializedState {
    const el = document.getElementById('__INITIAL_STATE__')
    if (el?.textContent) {
        try {
            return deserializeState(el.textContent)
        } catch {
            // Fall back to defaults
        }
    }
    return {
        route: location.pathname + location.search,
        count: 0
    }
}

// Hydrate the server-rendered content
const root = document.getElementById('root')!
render(<ClientApp />, root)
