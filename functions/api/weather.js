// Cloudflare Pages Function: 代理 wttr.in（绕过 CORS + 限流）
export function onRequestOptions() {
    return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Max-Age': '86400'
    }});
}
// 内存缓存 5 分钟，避免每次页面刷新都打 wttr.in
export async function onRequestGet({ request }) {
    const url = new URL(request.url);
    const lang = url.searchParams.get('lang') === 'en' ? 'en' : 'zh';
    const fmt = '%c%t+%C';
    const apiUrl = `https://wttr.in/?format=${fmt}&lang=${lang}`;

    // KV 缓存（5 分钟）
    let cacheKey = `weather_${lang}`;
    let cached = null;
    try {
        const kv = NAV_DB; // Pages 注入的 KV 绑定
        cached = await kv.get(cacheKey);
    } catch (e) { /* KV 不可用时继续 */ }

    if (cached) {
        return new Response(cached, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300',
                'X-Cache': 'HIT'
            }
        });
    }

    try {
        const r = await fetch(apiUrl, {
            headers: { 'User-Agent': 'curl/7.88.1' },
            cf: { cacheTtl: 300, cacheEverything: true }
        });
        const txt = (await r.text() || '').trim();
        if (!txt || /<[^>]+>/.test(txt)) throw new Error('bad payload from wttr.in');

        try { await NAV_DB.put(cacheKey, txt, { expirationTtl: 300 }); } catch (e) {}

        return new Response(txt, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=300',
                'X-Cache': 'MISS'
            }
        });
    } catch (e) {
        return new Response('ERR:' + e.message, {
            status: 502,
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
