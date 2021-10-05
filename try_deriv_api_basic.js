'use strict';
global.WebSocket = require('ws');
const DerivAPIBasic = require('./dist/DerivAPIBasic');
const rx = require('rxjs')

const token = process.env.DERIV_TOKEN;
const app_id = process.env.APP_ID || 1089;
const expected_payout = process.env.EXPECTED_PAYOUT || 1;

if (!token) {
    console.error('DERIV_TOKEN environment variable is not set');
    process.exit(1);
}

const api = new DerivAPIBasic({app_id}) ;
//console.log(api);
const ticks_stream = api.subscribe({'ticks': 'R_50'})
//console.log(abc)
//const ticks_response = ticks_stream.pipe('')