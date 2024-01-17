import { postViewFunc } from "./api";
import type { ViewObj } from "./types";

export interface UserBalance {
  address: string;
  slow?: SlowWalletBalance;
  infra?: InfraEscrowBalance;
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

export const userPledgeView = (addr: string): ViewObj => {
  return {
    function: "0x1::infra_escrow::user_infra_pledge_balance",
    type_arguments: [],
    arguments: [addr],
  };
};

export const getSlowList = async (): Promise<[string]> => {
  return postViewFunc(slowListView).then((res) => res[0]);
};

export const mapSlowListToBalance = async (): Promise<UserBalance[]> => {
  return postViewFunc(slowListView).then((res) => {
    return res[0].map((el: string) => {
      return {
        address: el,
      };
    });
  });
};

export const mapBalancesAccount = async (
  list: UserBalance[],
): Promise<UserBalance[]> => {
  const balance_queries = list.map((el) => {
    return postViewFunc(slowBalanceView(el.address));
  });

  let res = await Promise.all(balance_queries);
  return res.map((b, idx) => {
    let user = list[idx];
    user.slow = {
      unlocked: b[0],
      total: b[1],
    }
    return user
  })
};


export const mapPledgeAccount = async (
  list: UserBalance[],
): Promise<UserBalance[]> => {
  const balance_queries = list.map((el) => {
    return postViewFunc(userPledgeView(el.address));
  });

  let res = await Promise.all(balance_queries);
  return res.map((b, idx) => {
    let user = list[idx];
    user.infra = {
      total: b[0],
    }
    return user
  })
};
