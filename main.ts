import { apiUrl, checkAPIConnectivity } from "./src/api";
import {
	getSlowList,
	mapBalancesAccount,
	mapCommunityBalance,
	mapCommunityListToBalance,
	mapPledgeAccount,
	mapSlowListToBalance,
	reduceBalances,
} from "./src/slow_wallets";
import { getSupply } from "./src/supply";
import fs from "fs";

const main = async () => {
	if (!(await checkAPIConnectivity(apiUrl))) {
		console.log("cannot connect to upstream");
		process.exit(1);
	} else {
		console.log(`connected to ${apiUrl}`);
	}

	console.log(await getSupply());

	const communityList = await mapCommunityListToBalance();
	const comm_balance = await mapCommunityBalance(communityList);

	const slowList = await mapSlowListToBalance();

	let balances = await mapBalancesAccount(slowList);
	balances = await mapPledgeAccount(balances);

	let joined = balances.concat(comm_balance);

  const summary = reduceBalances(joined);

	// console.log(balances);
	fs.writeFile("balances.json", JSON.stringify(balances, null, 2), (err) => {
		if (err) {
			console.error("Error writing to file", err);
		} else {
			console.log("Output written to balances.json");
		}
	});


	fs.writeFile("summary.json", JSON.stringify(summary, null, 2), (err) => {
		if (err) {
			console.error("Error writing to file", err);
		} else {
			console.log("Output written to summary.json");
		}
	});
};

main();
