import {share} from 'rxjs/operators'
import * as DerivAPIBasic from './src/deriv_api/DerivAPIBasic'
import WebSocket from 'ws'
globalThis.WebSocket = WebSocket

const api = new DerivAPIBasic({app_id: 1089})
console.log(api)