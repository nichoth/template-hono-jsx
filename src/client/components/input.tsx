import type { FC } from 'hono/jsx'
import './input.css'

interface InputProps {
    type?: string;
    label: string;
    id?: string;
    name?: string;
    class?: string;
    disabled?: boolean;
}

export const Input: FC<InputProps> = function (props) {
    const className = ([
        props.class,
        'input'
    ]).filter(Boolean).join(' ')

    return (
        <div class="input">
            <label for={props.id}>{props.label}</label>
            <input
                class={className}
                type={props.type}
                id={props.id}
                name={props.name || props.id}
                disabled={props.disabled}
            />
        </div>
    )
}
