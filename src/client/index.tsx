import { useState, useEffect } from 'hono/jsx'
import { render } from 'hono/jsx/dom'
import Debug from '@substrate-system/debug'
import Route from 'route-event'
import { App } from '../shared/App.js'
import type { AppState } from '../shared/state.js'
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

/**
 * Client-side wrapper that manages reactive state
 */
function ClientApp () {
    // Get initial state from server-rendered data
    const initialData = getInitialState()

    const [route, setRoute] = useState(initialData.route)
    const [count, setCount] = useState(initialData.count)

    // Set up client-side routing
    useEffect(() => {
        const onRoute = Route()

        onRoute((path: string, data: { popstate?: boolean; scrollX: number; scrollY: number }) => {
            setRoute(path)
            // Handle scroll state like a web browser
            if (data.popstate) {
                window.scrollTo(data.scrollX, data.scrollY)
            } else {
                window.scrollTo(0, 0)
            }
        })
    }, [])

    const state: AppState = {
        route,
        count,
        setRoute: (path: string) => {
            // Use route-event for navigation
            const onRoute = Route()
            onRoute.setRoute(path)
        },
        setCount,
    }

    debug('rendering app...', state)

    // @ts-expect-error DEV env
    if (import.meta.env.DEV) window.state = state

    return <App state={state} />
}

/**
 * Get initial state from server-rendered script tag
 */
function getInitialState (): { route: string; count: number } {
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
