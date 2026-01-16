import type { FC } from 'hono/jsx'
import type { AppState } from '../state.js'
import { State } from '../state.js'
import { Button } from '../components/button.js'
import './home.css'

interface HomeProps {
    state: AppState;
}

export const HomeRoute: FC<HomeProps> = function HomeRoute ({ state }) {
    const plus = (ev: MouseEvent) => {
        ev.preventDefault()
        State.Increase(state)
    }

    const minus = (ev: MouseEvent) => {
        ev.preventDefault()
        State.Decrease(state)
    }

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
