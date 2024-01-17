import type { ViewObj } from "./types";
import { postViewFunc } from "./api";

const totalSupplyView: ViewObj = {
	function: "0x1::libra_coin::supply",
	type_arguments: [],
	arguments: [],
};

export const getSupply = async (): Promise<number> => {
	return postViewFunc(totalSupplyView).then((res) => res[0]);
};
