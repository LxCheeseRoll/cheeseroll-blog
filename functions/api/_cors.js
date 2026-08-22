// 通用 CORS OPTIONS 预检处理（被各 API 用 fetch 引用 _corsPreflight）
export function corsHeaders() {
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400'
    };
}
export function handleOptions() {
    return new Response(null, { status: 204, headers: corsHeaders() });
}
