import { postViewFunc } from "./api";
import type { ViewObj } from "./types";

export interface UserBalance {
  address: string,
  slow: SlowWalletBalance,
  infra?: InfraEscrowBalance
}
export interface SlowWalletBalance {
  unlocked: number;
  total: number;
}

export interface InfraEscrowBalance {
  total: number;
}

const slowListView: ViewObj = {
  function: "0x1::slow_wallet::get_slow_list",
  type_arguments: [],
  arguments: [],
};

export const slowBalanceView = (addr: string): ViewObj => {
  return {
    function: "0x1::ol_account::balance",
    type_arguments: [],
    arguments: [addr],
  };
};

export const getSlowList = async (): Promise<[string]> => {
  return postViewFunc(slowListView).then((res) => res[0]);
};

export const mapBalancesAccount = async (
  list: string[],
): Promise<UserBalance[]> => {
  const balance_queries = list.map((el) => {
    return postViewFunc(slowBalanceView(el))
  });

  let resolved = await Promise.all(balance_queries)

  return resolved.map((res, idx) => {
    return {
      address: list[idx],
      slow: {
        unlocked: res[0],
        total: res[1],
      }
    };
  })
};