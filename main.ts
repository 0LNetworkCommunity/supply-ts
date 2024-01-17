import { apiUrl, checkAPIConnectivity } from "./src/api";
import {
	getSlowList,
	mapBalancesAccount,
	mapSlowListToBalance,
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
	const slowList = await mapSlowListToBalance();

	const balances = await mapBalancesAccount(slowList);

	// console.log(balances);
	fs.writeFile("balances.json", JSON.stringify(balances, null, 2), (err) => {
		if (err) {
			console.error("Error writing to file", err);
		} else {
			console.log("Output written to balances.json");
		}
	});
};

main();
