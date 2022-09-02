export interface Count {
        name: string
        count: number
}

export class DB {
        data: Record<string, number> = {}
        get = async (name: string): Promise<Count> => {
                const count = this.data[name] ?? 0
                return { name, count }
        }
        put = async (name: string): Promise<Count> => {
                this.data[name] = this.data[name] ? this.data[name] + 1 : 1
                return this.get(name)
        }
}
