// 全局配置 API（壁纸、主题、管理员密码）
export async function onRequest(context) {
    const { request, env } = context;

    if (request.method === "GET") {
        const data = await env.NAV_DB.get("site_config");
        return new Response(data || "{}", {
            headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
        });
    }

    if (request.method === "POST") {
        try {
            const body = await request.text();
            await env.NAV_DB.put("site_config", body);
            return new Response(JSON.stringify({ success: true }), {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
            });
        } catch (error) {
            return new Response(JSON.stringify({ success: false }), { status: 500 });
        }
    }

    return new Response("Method not allowed", { status: 405 });
}
