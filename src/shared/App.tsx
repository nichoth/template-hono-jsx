import type { FC } from 'hono/jsx'
import type { AppState } from './state.js'
import Router, { routes } from '../client/routes/index.js'
import '../client/components/nav.css'

const router = Router()

interface AppProps {
    state: AppState;
}

export const App: FC<AppProps> = function App ({ state }) {
    const match = router.match(state.route)

    if (!match || !match.action) {
        return (
            <div class="not-found">
                <h1>404</h1>
                <p>Page not found</p>
            </div>
        )
    }

    const ChildNode = match.action(match, state.route)

    return (
        <>
            <header>
                <h1>Example</h1>
                <Nav route={state.route} setRoute={state.setRoute} />
            </header>
            <main>
                <ChildNode state={state} />
            </main>
        </>
    )
}

interface NavProps {
    route: string;
    setRoute: (path: string) => void;
}

function Nav ({ route }: NavProps) {
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
