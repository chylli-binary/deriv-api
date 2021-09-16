
global.WebSocket      = require('ws');
const { find, first } = require('rxjs/operators');
const DerivAPI        = require('./dist/DerivAPI');

// const DerivAPI = require('@deriv/deriv-api/dist/DerivAPI');
// The steps to our API is:
// active_symbos  to find out which symbol is available
// contracts_for to find out what contract types are available for a symbol
// proposal to get the ask price (the buy price) of a contract
// buy to buy the contract with either proposal id or contract parameters
// proposal_open_contract to get the information of a contract after purchase (whether the contract is open to closed)

const token           = process.env.DERIV_TOKEN;
const app_id          = process.env.APP_ID || 1089;
const expected_payout = process.env.EXPECTED_PAYOUT || 1;

if (!token) {
    console.error('DERIV_TOKEN environment variable is not set');
    process.exit(1);
}

const api = new DerivAPI({ app_id });

async function getAccount() {
    const account = await api.account(token);
    // doc in Stream/Transactions : accounts.transaction_stream is wrong
    const { balance, currency, transactions } = account;

    console.log(`Your current balance is: ${balance.currency} ${balance.display}`);

    balance.onUpdate(() => {
        console.log(`Your new balance is: ${balance.currency} ${balance.display}`);
    });
    
    transactions.onUpdate((transaction) => {
        console.log(`You ${transaction.action}ed a contract "${transaction.longcode}" with amount ${transaction.amount.value} ${transaction.amount.currency}`)
    });
    return currency;
}
async function getAssets(api) {
    const assets = await api.basic.assetIndex({landing_company: 'virtual'});
    return assets;
}

async function getActiveSymbols(api) {
    const active_symbols = await api.basic.activeSymbols();
    return active_symbols;
}

async function main() {
    try {
        const currency           = await getAccount();
        // const assets             = await api.assets(); // assets not implemented yet
        // const open_markets       = assets.open_markets;
        const assets = await getAssets(api);
        // console.log(assets);
        // const active_symbols  = await api.active_symbols(); // no active symbols
        // console.log(active_symbols);
        console.log(await api.basic.activeSymbols({ active_symbols: 'brief' }));
        console.log((await api.basic.contractsFor({ contracts_for: 'R_100' })).contracts_for.available[0]);
        // no profit_table
        // immutable/Transactions.js is not used ???
        const r_100_underlying = await api.underlying('R_100');
        console.log(`underlying ${r_100_underlying.name.full} is_open ${r_100_underlying.is_open}`);

        const ticks              = await api.ticks('frxUSDJPY');
        const ticks_subscription = ticks.onUpdate().subscribe((data) => { console.log('tick '); });

        const contract = await api.contract({
            contract_type: 'CALL',
            currency,
            amount       : 10,
            duration     : 15,
            duration_unit: 'm',
            symbol       : 'frxUSDJPY',
            basis        : 'stake',
        });

        // contract.onUpdate(console.log, console.log) ;
        contract.onUpdate(({ status, payout, bid_price }) => {
            switch (status) {
                case 'proposal':
                    return console.log(
                        `Current payout: ${payout.currency} ${payout.display}`,
                    );
                case 'open':
                    return console.log(
                        `Current bid price: ${bid_price.currency} ${bid_price.display}`,
                    );
                default:
                    console.log('contract onUpdate default');
                    break;
            }
        });

        // Wait until payout is greater than USD 19
        await contract.onUpdate().pipe(find(({ payout }) => payout.value >= expected_payout)).toPromise();
        const buy = await contract.buy();

        console.log(`Buy price is: ${buy.price.currency} ${buy.price.display}`);
        ticks_subscription.unsubscribe();
        // Wait until the contract is sold
        const timeout1 = timeout(5000);
        await Promise.any([contract.onUpdate().pipe(find(({ is_sold }) => is_sold)).toPromise(),
            timeout1.promise.then(() => console.log('not sold in 5 seconds'))]).then(() => clearTimeout(timeout1.timeout_id));


        const contract2 = await api.contract({
            contract_type: 'CALL',
            currency,
            amount       : 10,
            duration     : 15,
            duration_unit: 's',
            symbol       : 'R_100',
            basis        : 'stake',
        });

        await contract2.onUpdate().pipe(first()).toPromise;
        const buy2 = await contract2.buy();
        console.log(`Buy price of second R_100 is: ${buy2.price.currency} ${buy2.price.display}`);

        const timeout2 = timeout(20000000);
        // Wait until the contract is sold
        await Promise.any([contract2.onUpdate().pipe(find(({is_sold}) => is_sold)).toPromise(),

            timeout2.promise.then(() => console.log('not sold in 200 seconds')),
        ]).then(() => {
            const { timeout_id } = timeout2;
            console.log(`timeout id ${timeout_id}`);
            clearTimeout(timeout2.timeout_id);
            console.log('clearing timeout2');
        });

        const { profit, status, is_sold } = contract2;

        if (is_sold) {
            console.log(`You ${status}: ${profit.currency} ${profit.display}`);
        }
        console.log((await api.basic.profitTable({sort: 'DESC', limit: 1})).profit_table.transactions[0]);
    } catch (err) {
        console.error(err);
    } finally {
        // Close the connection and exit
        api.basic.disconnect();
    }
}
function timeout(ms) {
    let timeout_id;
    const promise = new Promise((resolve) => { timeout_id = setTimeout(resolve, ms); });
    console.log(`timeout id created ${timeout_id}`);
    return { timeout_id, promise };
}

main();
