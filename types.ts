export interface ViewObj {
	function: string;
	type_arguments: string[];
	arguments: string[] | boolean[];
}

export interface EventObj {
	address: string;
	struct: string;
	handler_field: string;
}
