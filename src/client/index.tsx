import Debug from '@substrate-system/debug'

if (import.meta.env.DEV) {
    localStorage.setItem('DEBUG', 'example')
} else {
    localStorage.removeItem('DEBUG')
}

const debug = Debug('example')

export function example ():void {
    debug('hello')
}
