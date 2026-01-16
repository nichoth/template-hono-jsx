import type { FC, PropsWithChildren } from 'hono/jsx'
import { useState } from 'hono/jsx'
import './button.css'

interface ButtonProps {
    onClick?: (ev: MouseEvent) => void | Promise<void>;
    isSpinning?: boolean;
    class?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
}

export const Button: FC<PropsWithChildren<ButtonProps>> = function (props) {
    // Use useState for SSR-safe local state (defaults to false on server)
    const [localSpinning, setLocalSpinning] = useState(false)
    const isSpinning = props.isSpinning ?? localSpinning

    const classes = (Array.from(new Set([
        'btn',
        props.class,
        isSpinning ? 'spinning' : ''
    ]))).filter(Boolean).join(' ').trim()

    const click = async (ev: MouseEvent) => {
        if (props.onClick) {
            setLocalSpinning(true)
            await props.onClick(ev)
            setLocalSpinning(false)
        }
    }

    return (
        <button
            type={props.type || 'button'}
            onClick={click}
            disabled={isSpinning || props.disabled}
            class={classes}
        >
            <span class="btn-content">{props.children}</span>
        </button>
    )
}
