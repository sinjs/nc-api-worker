export function res(data: any, status: number = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST' },
	});
}
