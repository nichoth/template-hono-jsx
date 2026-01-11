import type { FC } from 'hono/jsx'
import { useState, useCallback } from 'hono/jsx'
import Debug from '@substrate-system/debug'
import { Button } from '../components/button.js'
import { Input } from '../components/input.js'
import './contact.css'

const debug = Debug('example:view:contact')

export const ContactRoute: FC = function ContactRoute () {
    const [isResolving, setIsResolving] = useState(false)

    const submit = useCallback(async (ev: SubmitEvent) => {
        ev.preventDefault()
        debug('submit', ev)
        setIsResolving(true)
        await sleep(3000)
        setIsResolving(false)
    }, [])

    return (
        <div class="route contact">
            <h2>contact route</h2>

            <form class="contact" onSubmit={submit}>
                <Input
                    disabled={isResolving}
                    id="example"
                    name="example"
                    type="text"
                    label="Input"
                />

                <div class="controls">
                    <Button
                        isSpinning={isResolving}
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
