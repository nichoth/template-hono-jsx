import { createRoute } from 'honox/factory'
import Counter from '../islands/counter'

export default createRoute((c) => {
    return c.render(
        <div>
            <h1>Hello HonoX!</h1>
            <Counter initial={0} />
        </div>,
        { title: 'Home' }
    )
})
