import { html } from 'htm/preact'
import { type FunctionComponent } from 'preact'
import './input.css'

interface InputProps {
    type?: string;
    label: string;
    id?: string;
    name?: string;
    class?: string;
    disabled?: boolean;
}

export const Input: FunctionComponent<InputProps> = function (props) {
    const className = ([
        props.class,
        'input'
    ]).filter(Boolean).join(' ')

    return html`<div class="input">
        <label for=${props.id}>${props.label}</label>
        <input
            ...${props}
            class=${className}
            type=${props.type}
            id=${props.id}
            name=${props.id}
        />
    </div>`
}
