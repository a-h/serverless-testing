export interface VoteEvent {
  count: number
}

export async function messageHandler(events: Array<VoteEvent>): Promise<void> {
  events.forEach(e => console.log(JSON.stringify(e)))
}
