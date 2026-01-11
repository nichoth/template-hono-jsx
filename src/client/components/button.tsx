import type { FC, PropsWithChildren } from 'hono/jsx'
import { useSignal } from '@preact/signals'
import './button.css'

interface ButtonProps {
    onClick?: (ev: MouseEvent) => void | Promise<void>;
    isSpinning?: boolean;
    class?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
}

export const Button: FC<PropsWithChildren<ButtonProps>> = function (props) {
    const localSpinning = useSignal(false)
    const isSpinning = props.isSpinning ?? localSpinning.value

    const classes = (Array.from(new Set([
        'btn',
        props.class,
        isSpinning ? 'spinning' : ''
    ]))).filter(Boolean).join(' ').trim()

    const click = async (ev: MouseEvent) => {
        if (props.onClick) {
            localSpinning.value = true
            await props.onClick(ev)
            localSpinning.value = false
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
