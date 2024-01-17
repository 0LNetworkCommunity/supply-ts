import { expect, test } from "bun:test";
import { mapBalancesAccount, slowBalanceView } from "../slow_wallets";
import { postViewFunc } from "../api";

test("balances", async () => {
  const addr = "0x9dd60405e2cc2d17e530c7cfd4d6edf0"
  let n = await postViewFunc(slowBalanceView(addr));
  expect(n.length == 2)
});


test("map balances", async () => {
  const addr = "0x9dd60405e2cc2d17e530c7cfd4d6edf0"
  let n = await mapBalancesAccount([addr]);
  console.log(n)
});