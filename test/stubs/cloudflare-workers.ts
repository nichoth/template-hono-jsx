export class DurableObject<TEnv = unknown> {
    ctx: unknown
    env: TEnv

    constructor (ctx: unknown, env: TEnv) {
        this.ctx = ctx
        this.env = env
    }
}
