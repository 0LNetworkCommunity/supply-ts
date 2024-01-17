import { apiUrl, checkAPIConnectivity } from "./api";
import { getSlowList, mapBalancesAccount } from "./slow_wallets";
import { getSupply } from "./supply";

const main = async () => {
	if (!(await checkAPIConnectivity(apiUrl))) {
		console.log("cannot connect to upstream");
		process.exit(1);
	} else {
		console.log(`connected to ${apiUrl}`);
	}

	console.log(await getSupply());
	const slowList = await getSlowList();

	const map = mapBalancesAccount(slowList);
};

main();
