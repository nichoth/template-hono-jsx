import type { FC } from 'hono/jsx'
import { render } from 'hono/jsx/dom'
import { useComputed } from '@preact/signals'
import Debug from '@substrate-system/debug'
import { State } from './state.js'
import Router, { routes } from './routes/index.js'
import './components/nav.css'
import './style.css'

const router = Router()
const state = State()
const debug = Debug('example')

// set debug logging in local env
if (isDev()) {
    localStorage.setItem('DEBUG', 'example:*,example')
    // @ts-expect-error DEV env
    window.state = state
} else {
    localStorage.removeItem('DEBUG')
    localStorage.removeItem('debug')
}

function Example () {
    debug('rendering example...', state)

    const match = useComputed(() => {
        return router.match(state.route.value)
    })

    if (!match.value || !match.value.action) {
        return (
            <div class="404">
                <h1>404</h1>
            </div>
        )
    }

    const ChildNode = match.value.action(match.value, state.route.value)

    return (
        <main>
            <header>
                <h1>ABC</h1>
                <Nav route={state.route.value} />
            </header>

            <ChildNode state={state} />
        </main>
    )
}

render(<Example />, document.getElementById('root')!)

function isDev (): boolean {
    return !!(import.meta.env.DEV || import.meta.env.MODE === 'staging')
}

interface NavProps {
    route: string;
}

const Nav: FC<NavProps> = function Nav ({ route }) {
    return (
        <nav aria-label="Main navigation">
            <ul>
                {routes.map(r => (
                    <li
                        key={r.href}
                        class={`nav${route === r.href ? ' active' : ''}`}
                    >
                        <a href={r.href}>{r.text}</a>
                    </li>
                ))}
            </ul>
        </nav>
    )
}
