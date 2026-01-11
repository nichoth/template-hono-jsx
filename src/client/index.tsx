import Debug from '@substrate-system/debug'

if (import.meta.env.DEV) {
    localStorage.setItem('DEBUG', 'example')
} else {
    localStorage.removeItem('DEBUG')
}

const debug = Debug('example')

debug('starting the app')

const root = document.getElementById('root')
if (root) {
    root.innerHTML = '<h1>Hello World</h1>'
}
