import type { FC } from 'hono/jsx'
import { useCallback } from 'hono/jsx'
import type { AppState } from '../state.js'
import { Button } from '../components/button.js'
import './home.css'

interface HomeProps {
    state: AppState;
}

export const HomeRoute: FC<HomeProps> = function HomeRoute ({ state }) {
    const plus = useCallback((ev: MouseEvent) => {
        ev.preventDefault()
        state.setCount(state.count + 1)
    }, [state])

    const minus = useCallback((ev: MouseEvent) => {
        ev.preventDefault()
        state.setCount(state.count - 1)
    }, [state])

    return (
        <section class="route home">
            <div>
                <h2>counter</h2>
                <output aria-live="polite">count: {state.count}</output>

                <ul class="count-controls">
                    <li>
                        <Button class="btn" onClick={plus}>
                            plus
                        </Button>
                    </li>
                    <li>
                        <Button class="btn" onClick={minus}>
                            minus
                        </Button>
                    </li>
                </ul>
            </div>
        </section>
    )
}
