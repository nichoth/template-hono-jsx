import { hydrateRoot } from 'hono/jsx/dom/client'
import Debug from '@substrate-system/debug'
import { App } from '../shared/App.js'
import { deserializeState, type SerializedState } from '../shared/state.js'
import { State, type AppState } from './state.js'
import './style.css'

const debug = Debug('example')

mountClientApp()

export function mountClientApp (): AppState | undefined {
    const root = document.getElementById('root')
    if (!root) return undefined

    const initialState = readSerializedState(document)
    const state = State(initialState)

    setDebugState(state)
    hydrateRoot(root, <App state={state} />)

    return state
}

function isDev (): boolean {
    const meta = import.meta as ImportMeta & {
        env?: {
            DEV?: boolean;
            MODE?: string;
        };
    }

    return !!(meta.env?.DEV || meta.env?.MODE === 'staging')
}

function setDebugState (state: AppState): void {
    if (isDev()) {
        localStorage.setItem('DEBUG', 'example:*,example')
        ;(window as Window & { state?: AppState }).state = state
        return
    }

    localStorage.removeItem('DEBUG')
    localStorage.removeItem('debug')
}

function readSerializedState (doc: Document): SerializedState | undefined {
    const script = doc.getElementById('__INITIAL_STATE__')

    if (!script?.textContent) return undefined

    try {
        return deserializeState(script.textContent)
    } catch (_err) {
        debug('unable to parse initial state', _err)
        return undefined
    }
}
