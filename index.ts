import fs from "fs";
import { AptosClient } from "aptos";

const url = "https://rpc.0l.fyi/v1";
const urlAlt = "https://rpc.openlibra.space:8080/";

const aptos = new AptosClient(url);

const logUpdate = (message) => console.log(message);
const logError = (message) => console.error(message);

// Simple progress bar implementation
const updateProgressBar = (progress, total) => {
	const percentage = Math.round((progress / total) * 100);
	const barLength = 20;
	const filledLength = Math.round((percentage / 100) * barLength);
	const bar = "█".repeat(filledLength) + "-".repeat(barLength - filledLength);
	logUpdate(`[${bar}] ${percentage}%`);
};

const checkConnection = async () => {
	const id = await aptos.getChainId();
	if (!id) logError("not connected");
	process.exit(1);
};

const fetchDataFromBlockchain = async (resourcePath) => {
	try {
		const res = await aptos.getAccountResource(...resourcePath);
		return res.data ? res.data : res;
	} catch (err) {
		logError(`Error fetching data from blockchain: ${err}`);
		return null;
	}
};

const getTotalSupply = async () => {
	logUpdate("Fetching total supply...");
	const resourcePath = [
		"0x1",
		"0x1::coin::CoinInfo<0x1::libra_coin::LibraCoin>",
	];
	const coinInfo = await fetchDataFromBlockchain(resourcePath);
	logError(coinInfo);
	const aggregatorData = coinInfo.supply.vec[0].aggregator.vec[0];

	const tableItemRequest = {
		key_type: "address",
		value_type: "u128",
		key: aggregatorData.key,
	};

	const totalSupplyStr = await aptos.getTableItem(
		aggregatorData.handle,
		tableItemRequest,
	);
	logUpdate(`Total supply fetched: ${parseInt(totalSupplyStr, 10) / 1e6}`);
	return parseInt(totalSupplyStr, 10) / 1e6;
};
// const getTotalSupply = async (): Promise<number> => {
//   aptos.
//   return 0
// }

const fetchSlowWalletsList = async () => {
	const resourcePath = ["0x1", "0x1::slow_wallet::SlowWalletList"];
	const slowWalletList = await fetchDataFromBlockchain(resourcePath);

	if (!slowWalletList || !slowWalletList.list) {
		logError("Failed to fetch slow wallet list or invalid response format.");
		return [];
	}

	return slowWalletList.list;
};

const fetchCommunityWalletsList = async () => {
	const resourcePath = ["0x1", "0x1::donor_voice::Registry"];
	const communityWalletList = await fetchDataFromBlockchain(resourcePath);

	if (!communityWalletList || !communityWalletList.list) {
		logError(
			"Failed to fetch community wallets list or invalid response format.",
		);
		return [];
	}

	return communityWalletList.list;
};

const fetchWalletData = async (addresses, resourcePath, progressMessage) => {
	const balances = [];
	logUpdate(`Fetching ${progressMessage}...`);
	for (const [index, address] of addresses.entries()) {
		const data = await fetchDataFromBlockchain([address, resourcePath]);
		if (data) {
			const balance = parseInt(data.coin.value, 10) / 1e6;
			balances.push(balance);
			logUpdate(`${progressMessage} for ${address}: ${balance}`);
		}
		updateProgressBar(index + 1, addresses.length);
	}
	return balances;
};

async function fetchSlowWalletLockedAndPledges() {
	console.log("Fetching slow wallet data and validator pledges...");
	const slowWalletAddresses = await fetchSlowWalletsList();
	const slowWalletBalances = [];
	let totalPledge = 0;
	let fullyUnlockedWalletsCount = 0;
	let stillLockedWalletsCount = 0;

	const coinStoreResourcePath =
		"0x1::coin::CoinStore<0x1::libra_coin::LibraCoin>";
	const slowWalletResourcePath = "0x1::slow_wallet::SlowWallet";

	for (const [index, address] of slowWalletAddresses.entries()) {
		const coinStoreData = await fetchDataFromBlockchain([
			address,
			coinStoreResourcePath,
		]);
		const slowWalletData = await fetchDataFromBlockchain([
			address,
			slowWalletResourcePath,
		]);

		if (coinStoreData && slowWalletData) {
			const totalBalance = parseInt(coinStoreData.coin.value, 10) / 1e6;
			const unlockedBalance = parseInt(slowWalletData.unlocked, 10) / 1e6;
			const lockedBalance = totalBalance - unlockedBalance;

			slowWalletBalances.push(lockedBalance);
			console.log(`Locked balance for ${address}: ${lockedBalance}`);

			if (lockedBalance === 0) {
				fullyUnlockedWalletsCount++;
			} else {
				stillLockedWalletsCount++;
			}
		}

		try {
			const pledgeRes = await fetchDataFromBlockchain([
				address,
				"0x1::pledge_accounts::MyPledges",
			]);
			const pledge = pledgeRes.list.find(
				(it) => it.address_of_beneficiary === "0x0",
			);
			if (pledge) {
				const pledgeValue = parseInt(pledge.pledge.value, 10) / 1e6;
				console.log(`Pledge value for ${address}: ${pledgeValue}`);
				totalPledge += pledgeValue;
			}
		} catch (err) {
			if (err.errorCode !== "resource_not_found") {
				console.error(`Error fetching pledge data for ${address}: ${err}`);
			}
		}

		updateProgressBar(index + 1, slowWalletAddresses.length);
	}

	return {
		slowWalletBalances,
		totalPledge,
		fullyUnlockedWalletsCount,
		stillLockedWalletsCount,
	};
}

async function fetchCommunityWalletBalances(cwAddresses) {
	logUpdate("Fetching community wallet balances...");
	const resourcePath = "0x1::coin::CoinStore<0x1::libra_coin::LibraCoin>";
	return await fetchWalletData(
		cwAddresses,
		resourcePath,
		"Community wallet balance",
	);
}

function calculateCirculatingSupply(
	totalSupply,
	totalLockedInSlowWallets,
	totalValidatorPledges,
	totalCWBalances,
) {
	const circulatingSupply =
		totalSupply -
		(totalLockedInSlowWallets + totalValidatorPledges + totalCWBalances);
	return circulatingSupply;
}

async function main() {
	checkConnection();
	const totalSupply = await getTotalSupply();
	const {
		slowWalletBalances,
		totalPledge,
		fullyUnlockedWalletsCount,
		stillLockedWalletsCount,
	} = await fetchSlowWalletLockedAndPledges();
	const cwAddresses = await fetchCommunityWalletsList();
	const communityWalletBalances =
		await fetchCommunityWalletBalances(cwAddresses);

	const totalLockedInSlowWallets = slowWalletBalances.reduce(
		(acc, curr) => acc + curr,
		0,
	);
	const totalCommunityWalletBalances = communityWalletBalances.reduce(
		(acc, curr) => acc + curr,
		0,
	);

	const circulatingSupply = calculateCirculatingSupply(
		totalSupply,
		totalLockedInSlowWallets,
		totalPledge,
		totalCommunityWalletBalances,
	);

	const balances = {
		totalSupply,
		slowWalletsLocked: totalLockedInSlowWallets,
		validatorPledges: totalPledge,
		communityWallets: totalCommunityWalletBalances,
		circulatingSupply,
		fullyUnlockedWalletsCount,
		stillLockedWalletsCount,
	};

	console.log(balances);

	fs.writeFile("balances.json", JSON.stringify(balances, null, 2), (err) => {
		if (err) {
			console.error("Error writing to file", err);
		} else {
			console.log("Output written to balances.json");
		}
	});
}

main();
