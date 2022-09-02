import { messageHandler, VoteEvent } from "./event_handler"
import { SQSEvent } from "aws-lambda"

exports.handler = async function(event: SQSEvent) {
    const voteEvents = event.Records.map(r => JSON.parse(r.body) as VoteEvent)
    await messageHandler(voteEvents)
}
