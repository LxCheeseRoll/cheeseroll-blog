// Cloudflare Pages Function: 多用户注册 / 登录 / 当前用户信息
// KV 键设计：
//   user:{username}        -> JSON { username, displayName, avatar(emoji 或 dataURL), pwdHash, salt, createdAt }
//   session:{token}        -> username（30 天过期）
export async function onRequestOptions() {
    return new Response(null, { status: 204, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
        'Access-Control-Max-Age': '86400'
    }});
}
export async function onRequestPost({ request, env }) {
    const KV = env.NAV_DB;
    const body = await safeJson(request);
    const action = body.action;
    if (action === 'register') return register_(body, KV);
    if (action === 'login')    return login_(body, KV);
    if (action === 'update')   return updateProfile_(body, request, KV);
    if (action === 'logout')   return logout_(body, KV);
    return json({ error: 'unknown action' }, 400);
}

export async function onRequestGet({ request, env }) {
    const url = new URL(request.url);
    const token = request.headers.get('X-Auth-Token') || url.searchParams.get('token');
    if (!token) return json({ user: null });
    const KV = env.NAV_DB;
    const username = await KV.get(`session:${token}`);
    if (!username) return json({ user: null });
    const u = await KV.get(`user:${username}`, { type: 'json' });
    if (!u) return json({ user: null });
    return json({ user: publicUser(u) });
}

async function safeJson(req) {
    try { return await req.json(); } catch { return {}; }
}
function json(obj, status = 200, extraHeaders = {}) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Access-Control-Allow-Origin': '*',
            ...extraHeaders
        }
    });
}
function publicUser(u) {
    return { username: u.username, displayName: u.displayName || u.username, avatar: u.avatar || '', isAdmin: u.username === 'admin' };
}
async function hashPwd(pwd, salt) {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest('SHA-256', enc.encode(salt + ':' + pwd));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}
function randomToken(len = 32) {
    const bytes = new Uint8Array(len);
    crypto.getRandomValues(bytes);
    return [...bytes].map(b => b.toString(16).padStart(2, '0')).join('');
}
function validUsername(u) {
    return typeof u === 'string' && /^[a-zA-Z0-9_\-]{3,20}$/.test(u);
}
function validPwd(p) {
    return typeof p === 'string' && p.length >= 6 && p.length <= 64;
}

async function register_(body, KV) {
    const username = (body.username || '').trim();
    const password = body.password || '';
    const displayName = (body.displayName || username).trim();
    const avatar = body.avatar || '';
    if (!validUsername(username)) return json({ error: '用户名需为 3-20 位字母/数字/下划线/连字符' }, 400);
    if (!validPwd(password))      return json({ error: '密码需为 6-64 位' }, 400);
    if (avatar && avatar.length > 200000) return json({ error: '头像太大' }, 400);
    const exists = await KV.get(`user:${username}`);
    if (exists) return json({ error: '用户名已被占用' }, 409);
    const salt = randomToken(8);
    const pwdHash = await hashPwd(password, salt);
    const user = { username, displayName, avatar, pwdHash, salt, createdAt: Date.now() };
    await KV.put(`user:${username}`, JSON.stringify(user));
    const token = randomToken();
    await KV.put(`session:${token}`, username, { expirationTtl: 60 * 60 * 24 * 30 });
    return json({ ok: true, token, user: publicUser(user) });
}

async function login_(body, KV) {
    const username = (body.username || '').trim();
    const password = body.password || '';
    if (!validUsername(username) || !validPwd(password)) return json({ error: '用户名或密码不合法' }, 400);
    const raw = await KV.get(`user:${username}`);
    if (!raw) return json({ error: '用户名或密码错误' }, 401);
    const u = JSON.parse(raw);
    const h = await hashPwd(password, u.salt);
    if (h !== u.pwdHash) return json({ error: '用户名或密码错误' }, 401);
    const token = randomToken();
    await KV.put(`session:${token}`, username, { expirationTtl: 60 * 60 * 24 * 30 });
    return json({ ok: true, token, user: publicUser(u) });
}

async function updateProfile_(body, request, KV) {
    const token = request.headers.get('X-Auth-Token');
    if (!token) return json({ error: '未登录' }, 401);
    const username = await KV.get(`session:${token}`);
    if (!username) return json({ error: '会话已失效，请重新登录' }, 401);
    const raw = await KV.get(`user:${username}`);
    if (!raw) return json({ error: '用户不存在' }, 404);
    const u = JSON.parse(raw);
    if (typeof body.displayName === 'string' && body.displayName.trim()) u.displayName = body.displayName.trim().slice(0, 30);
    if (typeof body.avatar === 'string') {
        if (body.avatar.length > 200000) return json({ error: '头像太大' }, 400);
        u.avatar = body.avatar;
    }
    if (typeof body.newPassword === 'string' && body.newPassword) {
        if (!validPwd(body.newPassword)) return json({ error: '新密码需为 6-64 位' }, 400);
        u.salt = randomToken(8);
        u.pwdHash = await hashPwd(body.newPassword, u.salt);
    }
    await KV.put(`user:${username}`, JSON.stringify(u));
    return json({ ok: true, user: publicUser(u) });
}

async function logout_(body, KV) {
    const token = body.token || '';
    if (token) await KV.delete(`session:${token}`);
    return json({ ok: true });
}
