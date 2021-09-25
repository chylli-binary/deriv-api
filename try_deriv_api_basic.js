'use strict';
global.WebSocket = require('ws');
const DerivAPIBasic = require('./dist/DerivAPIBasic');
const token = process.env.DERIV_TOKEN;
const app_id = process.env.APP_ID || 1089;
const expected_payout = process.env.EXPECTED_PAYOUT || 1;

if (!token) {
    console.error('DERIV_TOKEN environment variable is not set');
    process.exit(1);
}

const api = new DerivAPIBasic({app_id}) ;
console.log(api);