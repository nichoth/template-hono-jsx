import { type FunctionComponent } from 'preact'
import { html } from 'htm/preact'
import { type AppState } from '../state.js'
import './nav.css'

export interface NavLinkProps {
    href:string;
    state:AppState;
    children:preact.ComponentChildren;
}

export const NavLink:FunctionComponent<NavLinkProps> = function ({
    href,
    state,
    children
}) {
    const route = state.route.value
    const isActive = (href === '/' ?
        route === '/' :
        route === href || route.startsWith(href + '/'))

    return html`<a
        href=${href}
        class="nav-link ${isActive ? 'active' : ''}"
    >${children}</a>`
}

const NAV_ITEMS = [
    { href: '/', label: 'Home' },
    { href: '/contact', label: 'Contact' },
]

export const Nav:FunctionComponent<{ state:AppState }> = function Nav ({
    state
}) {
    return html`<nav class="sidebar">
        <ul class="nav-list">
            ${NAV_ITEMS.map(item => {
                return html`<li key=${item.href}>
                    <${NavLink} href=${item.href} state=${state}>
                        ${item.label}
                    <//>
                </li>`
            })}
        </ul>
    </nav>`
}
