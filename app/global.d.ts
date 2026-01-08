import type {} from 'hono'

declare module 'hono/jsx-renderer' {
    interface Props {
        title?: string
    }
}
