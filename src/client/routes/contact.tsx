import type { FC } from 'hono/jsx'
import Debug from '@substrate-system/debug'
import { useSignal } from '../../shared/hooks.js'
import { Button } from '../components/button.js'
import { Input } from '../components/input.js'
import './contact.css'

const debug = Debug('example:view:contact')

export const ContactRoute: FC = function ContactRoute () {
    const isResolving = useSignal(false)

    const submit = async (ev: Event) => {
        ev.preventDefault()
        debug('submit', ev)
        isResolving.value = true
        await sleep(3000)
        isResolving.value = false
    }

    return (
        <div class="route contact">
            <h2>contact route</h2>

            <form class="contact" onSubmit={submit}>
                <Input
                    disabled={isResolving.value}
                    id="example"
                    name="example"
                    type="text"
                    label="Input"
                />

                <div class="controls">
                    <Button
                        isSpinning={isResolving.value}
                        class="btn"
                        type="submit"
                    >
                        Submit
                    </Button>
                </div>
            </form>
        </div>
    )
}

function sleep (ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}
