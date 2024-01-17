import axios from "axios";
import type { EventObj, ViewObj } from "./types";

export const apiUrl: string = "https://rpc.openlibra.space:8080/v1/";

export const api = axios.create({
	baseURL: apiUrl,
});

export const checkAPIConnectivity = async (url) => {
	try {
		await axios.head(url);
		return true;
	} catch (error) {
		return false;
	}
};

export const getIndex = async () => {
	try {
		const response = await api.get("");
		return response.data;
	} catch (error) {
		console.error(`Failed to get index: ${error.message}`);
		throw error;
	}
};

export const getAccountResource = async (
	account: string,
	struct_path: string,
) => {
	return await api
		.get(`/accounts/${account}/resource/${struct_path}`)
		.then((r) => r.data.data)
		.catch((e) => {
			console.error(
				`Failed to get resource ${struct_path}, message: ${e.message}`,
			);
			throw e;
		});
};

export const postViewFunc = async (payload: ViewObj) => {
	return await api
		.post("/view", payload)
		.then((r) => {
			return r.data;
		})
		.catch((e) => {
			console.error(
				`Failed to get view fn: ${payload.function}, message: ${e.message}`,
			);
			// throw e
		});
};

export const getEventList = async (payload: EventObj) => {
	return await api
		.get(
			`/accounts/${payload.address}/events/${payload.struct}/${payload.handler_field}`,
		)
		.then((r) => {
			return r.data;
		})
		.catch((e) => {
			console.error(`Failed to get events ${payload}, message: ${e.message}`);
			throw e;
		});
};
