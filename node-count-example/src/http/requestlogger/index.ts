import morgan from "morgan"
import { IncomingMessage, ServerResponse } from "node:http"

export const requestLogger = morgan((tokens: morgan.TokenIndexer, req: IncomingMessage, res: ServerResponse) => JSON.stringify({
        time: tokens.date(req, res, 'iso'),
        method: tokens.method(req, res),
        url: tokens.url(req, res),
        status: tokens.status(req, res),
        responseSize: tokens.res(req, res, 'content-length'),
        userAgent: tokens['user-agent'](req, res),
        remoteIp: tokens['remote-addr'](req, res),
        referer: tokens.referrer(req, res),
        protocol: `HTTP/${tokens['http-version'](req, res)}`,
        response_time: tokens['response-time'](req, res),
        total_time: tokens['total-time'](req, res),
}))
