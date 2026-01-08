import { useState } from 'hono/jsx'

export default function Counter({ initial = 0 }: { initial?: number }) {
    const [count, setCount] = useState(initial)

    return (
        <div>
            <p>Count: {count}</p>
            <button onClick={() => setCount(count + 1)}>+</button>
            <button onClick={() => setCount(count - 1)}>-</button>
        </div>
    )
}
