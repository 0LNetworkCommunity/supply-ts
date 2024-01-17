import { expect, test } from "bun:test";
import {
  mapBalancesAccount,
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
  expect(n[0].address === "0x9dd60405e2cc2d17e530c7cfd4d6edf0");
  expect(n[0].slow.unlocked);
});

test("map format", async () => {
  const n: UserBalance[] = await mapSlowListToBalance();
  expect(n[0].address === "0x407d4d486fdc4e796504135e545be77");
});
