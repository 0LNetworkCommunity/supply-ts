import { expect, test } from "bun:test";
import {
	mapBalancesAccount,
	mapCommunityBalance,
	mapCommunityListToBalance,
	mapPledgeAccount,
	mapSlowListToBalance,
	slowBalanceView,
	type UserBalance,
} from "../src/slow_wallets";
import { postViewFunc } from "../src/api";

test("get one slow", async () => {
	const addr = "0x9dd60405e2cc2d17e530c7cfd4d6edf0";
	const n = await postViewFunc(slowBalanceView(addr));
	expect(n.length === 2);
});

test("map balances", async () => {
	const user = { address: "0x9dd60405e2cc2d17e530c7cfd4d6edf0" };
	const n: UserBalance[] = await mapBalancesAccount([user]);
	console.log(n);
	expect(n[0].address === "0x9dd60405e2cc2d17e530c7cfd4d6edf0");
	expect(n[0].slow?.unlocked);
});

test("map pledges", async () => {
	const user = { address: "0x9dd60405e2cc2d17e530c7cfd4d6edf0" };
	const n: UserBalance[] = await mapPledgeAccount([user]);
	console.log(n);
	// expect(n[0].address === "0x9dd60405e2cc2d17e530c7cfd4d6edf0");
	expect(n[0].infra?.total);
});

test("map format", async () => {
	const n: UserBalance[] = await mapSlowListToBalance();
	expect(n[0].address === "0x407d4d486fdc4e796504135e545be77");
});

test("get community", async () => {
	const n: UserBalance[] = await mapCommunityListToBalance();
	console.log(n);
	// expect(n[0].address === "0x407d4d486fdc4e796504135e545be77");
});

test("map community", async () => {
	const user = { address: "0xaad96bbf52fd20ae4aa2e3d8993e6486" };
	const n: UserBalance[] = await mapCommunityBalance([user]);
	console.log(n);
	// expect(n[0].address === "0x407d4d486fdc4e796504135e545be77");
});

test("get and map community", async () => {
  const list: UserBalance[] = await mapCommunityListToBalance();
  const n: UserBalance[] = await mapCommunityBalance(list);

  console.log(n);
  // expect(n[0].address === "0x407d4d486fdc4e796504135e545be77");
});