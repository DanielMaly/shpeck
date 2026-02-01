export type InitOptions = {
  tool: string
  trunk?: string
  replace?: boolean
}

export async function runInit(_options: InitOptions): Promise<void> {
  throw new Error('shpeck init is not implemented yet')
}
