'use strict';
global.WebSocket = require('ws');
const { find, first} = require('rxjs/operators');
//const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');
const DerivAPI = require('./dist/DerivAPI');
const token = process.env.DERIV_TOKEN;
const app_id = process.env.APP_ID || 1089;
const expected_payout = process.env.EXPECTED_PAYOUT || 1;

if (!token) {
    console.error('DERIV_TOKEN environment variable is not set');
    process.exit(1);
}

const api = new DerivAPI({ app_id });

async function getAccount() {
    const account = await api.account(token);

    const { balance, currency } = account;

    console.log(`Your current balance is: ${balance.currency} ${balance.display}`);

    balance.onUpdate(() => {
        console.log(`Your new balance is: ${balance.currency} ${balance.display}`);
    });
    return currency;
} 
async function main() {
    try {
        const currency = await getAccount();
        const ticks = await api.ticks('frxUSDJPY');
        const ticks_subscription = ticks.onUpdate().subscribe((data) => {console.log("tick ")});

//        let contract = await api.contract({
//            contract_type: 'CALL',
//            currency,
//            amount: 10,
//            duration: 15,
//            duration_unit: 'm',
//            symbol: 'frxUSDJPY',
//            basis: 'stake',
//        });
//
//        //contract.onUpdate(console.log, console.log) ;
//        contract.onUpdate(({ status, payout, bid_price }) => {
//            switch (status) {
//                case 'proposal':
//                    return console.log(
//                        `Current payout: ${payout.currency} ${payout.display}`);
//                case 'open':
//                    return console.log(
//                        `Current bid price: ${bid_price.currency} ${bid_price.display}`);
//                default:
//                    console.log("contract onUpdate default");
//                    break;
//            };
//        });
//
//        // Wait until payout is greater than USD 19
//        await contract.onUpdate().pipe(find(({ payout }) => payout.value >= expected_payout)).toPromise();
//        const buy = await contract.buy();
//
//        console.log(`Buy price is: ${buy.price.currency} ${buy.price.display}`);
//        ticks_subscription.unsubscribe();
//        // Wait until the contract is sold
//        const timeout1 = timeout(5000);
//        await Promise.any([contract.onUpdate().pipe(find(({ is_sold }) => is_sold)).toPromise(),
//            timeout1.promise.then(() => console.log('not sold in 5 seconds'))]
//        ).then(() => clearTimeout(timeout1.timeout_id));


        let contract = await api.contract({
            contract_type: 'CALL',
            currency,
            amount: 10,
            duration: 15,
            duration_unit: 's',
            symbol: 'R_100',
            basis: 'stake',
        });

        await contract.onUpdate().pipe(first()).toPromise;
        const buy = await contract.buy();
        console.log(`Buy price of second R_100 is: ${buy.price.currency} ${buy.price.display}`);

        const timeout2 = timeout(20000000);
        // Wait until the contract is sold
        await Promise.any([contract.onUpdate().pipe(find((data) => {console.log("---------------------------");return data.is_sold; })).toPromise(),
            
            timeout2.promise.then(() => console.log('not sold in 200 seconds'))
        ]
        ).then(() => {
            let timeout_id = timeout2.timeout_id;
            console.log(`timeout id ${timeout_id}`);
            clearTimeout(timeout2.timeout_id);
            console.log("clearing timeout2");
        });
        // console.log(contract);
        const { profit, status, is_sold } = contract;

        if (is_sold) {
            console.log(`You ${status}: ${profit.currency} ${profit.display}`);
        }

    } catch (err) {
        console.error(err);
    } finally {
        // Close the connection and exit
        api.basic.disconnect();
    }
    // await new Promise((resolve) => setTimeout(() => {console.log("end"); resolve('1')}, 5000));

}
function timeout(ms) {
    let timeout_id;
    let promise = new Promise(resolve => {timeout_id = setTimeout(resolve, ms)});
    console.log(`timeout id created ${timeout_id}`);
    return { timeout_id, promise };
}
main();
