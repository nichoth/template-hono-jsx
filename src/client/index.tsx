import { html } from 'htm/preact'
import { type FunctionComponent, render } from 'preact'
import { useMemo } from 'preact/hooks'
import Debug from '@substrate-system/debug'
import { State } from './state.js'
import Router, { routes } from './routes/index.js'
import './style.css'

const router = Router()
const state = State()
const debug = Debug('example')

// Set debug logging in dev env
if (import.meta.env.DEV) {
    localStorage.setItem('DEBUG', 'example:*,example')
    // @ts-expect-error DEV env
    window.state = state
} else {
    localStorage.removeItem('DEBUG')
    localStorage.removeItem('debug')
}

export const App:FunctionComponent = function App () {
    debug('rendering app...', state)

    const match = useMemo(() => {
        return router.match(state.route.value)
    }, [state.route.value])

    if (!match || !match.action) {
        return html`<div class="not-found">
            <h1>404</h1>
            <p>Page not found</p>
        </div>`
    }

    const ChildNode = match.action(match, state.route.value)

    return html`
        <header>
            <h1>Example</h1>
            <${Nav} route=${state.route.value} />
        </header>
        <main>
            <${ChildNode} state=${state} />
        </main>
    `
}

render(html`<${App} />`, document.getElementById('root')!)

function Nav ({ route }:{ route:string }):ReturnType<typeof html> {
    return html`<nav aria-label="Main navigation">
        <ul>
            ${routes.map(r => {
                return html`<li
                    key=${r.href}
                    class="nav${route === r.href ? ' active' : ''}"
                >
                    <a href="${r.href}">${r.text}</a>
                </li>`
            })}
        </ul>
    </nav>`
}
