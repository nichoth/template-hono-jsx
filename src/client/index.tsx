import { hydrateRoot } from 'hono/jsx/dom/client'
import Debug from '@substrate-system/debug'
import { App } from '../shared/App.js'
import { deserializeState, type SerializedState } from '../shared/state.js'
import { State } from './state.js'
import './style.css'
const debug = Debug('example')

const initialState = readSerializedState(document)
const state = State(initialState)
if (import.meta.env.DEV) {
    localStorage.setItem('DEBUG', 'example,example:*')
    // @ts-expect-error dev
    window.state = state
} else {
    localStorage.removeItem('DEBUG')
}

const root = document.getElementById('root')

hydrateRoot(root!, <App state={state} />)

function readSerializedState (doc:Document):SerializedState|undefined {
    const script = doc.getElementById('__INITIAL_STATE__')

    if (!script?.textContent) return undefined

    try {
        return deserializeState(script.textContent)
    } catch (_err) {
        debug('unable to parse initial state', _err)
        return undefined
    }
}
