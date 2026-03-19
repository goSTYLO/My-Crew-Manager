import { WS_EVENTS } from '../contracts/events.js';
import { sendJson } from '../ws-connection-context.js';

export function sendMessageAck(ws, payload) {
  sendJson(ws, {
    type: WS_EVENTS.MESSAGE_ACK,
    ...payload,
  });
}
