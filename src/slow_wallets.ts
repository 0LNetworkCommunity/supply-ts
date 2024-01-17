import { postViewFunc } from "./api";
import type { ViewObj } from "./types";

const SCALING_FACTOR = 1000000;
export interface Summary {
	total: number;
	slow_locked: number;
	slow_unlocked: number;
	pledge: number;
}

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

	const res = await Promise.all(balance_queries);
	return res.map((b, idx) => {
		const user = list[idx];
		user.slow = {
			unlocked: parseInt(b[0]) / SCALING_FACTOR,
      total: parseInt(b[1]) / SCALING_FACTOR,
		};
		return user;
	});
};

export const mapPledgeAccount = async (
	list: UserBalance[],
): Promise<UserBalance[]> => {
	const balance_queries = list.map((el) => {
		return postViewFunc(userPledgeView(el.address));
	});

	const res = await Promise.all(balance_queries);
	return res.map((b, idx) => {
		const user = list[idx];
		user.infra = {
      total: parseInt(b[0]) / SCALING_FACTOR,
		};
		return user;
	});
};

export const reduceBalances = (list: UserBalance[]): Summary => {
	const sum: Summary = {
		total: 0,
		slow_locked: 0,
		slow_unlocked: 0,
		pledge: 0,
	};

	for (const el of list) {
		sum.pledge = sum.pledge + el.infra?.total;

		sum.slow_unlocked = sum.slow_unlocked + el.slow?.unlocked;

		sum.slow_locked = sum.slow_locked + (el.slow?.total - el.slow?.unlocked);
		sum.total = sum.total + (el.slow?.total + el.infra?.total);
	}

	return sum;
};
