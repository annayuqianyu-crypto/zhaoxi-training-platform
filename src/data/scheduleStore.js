/**
 * 讲师排期共享存储
 * ─────────────────────────────────────────────
 * 读取：所有人可读（优先用 token 走 Contents API 取最新；
 *       匿名用户走 raw CDN，约 5 分钟缓存）
 * 写入：需配置具备 Contents: 读写 权限的 GitHub Token
 * 兜底：网络失败时回退本地缓存，避免白屏
 */

const GITHUB_REPO = 'annayuqianyu-crypto/zhaoxi-training-platform'
const DATA_PATH   = 'data/schedule.json'
const BRANCH      = 'master'
const TOKEN_KEY   = 'zx_github_token'
const CACHE_KEY   = 'zx_schedule_events'

export function getToken()  { return localStorage.getItem(TOKEN_KEY) || '' }
export function setToken(t)  { localStorage.setItem(TOKEN_KEY, t) }

export function loadCache()  { try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '[]') } catch { return [] } }
function saveCache(evs)      { try { localStorage.setItem(CACHE_KEY, JSON.stringify(evs)) } catch { /* ignore */ } }

/* base64 ↔ UTF-8 字符串（兼容中文） */
function b64Encode(str) { return btoa(unescape(encodeURIComponent(str))) }
function b64Decode(str) { return decodeURIComponent(escape(atob((str || '').replace(/\s/g, '')))) }

/* ─── 读取排期 ───
   返回 { events, sha, offline? } */
export async function fetchSchedule() {
  const token = getToken()

  // 已配置 token：走 Contents API 取最新数据 + sha
  if (token) {
    try {
      const res = await fetch(
        `https://api.github.com/repos/${GITHUB_REPO}/contents/${DATA_PATH}?ref=${BRANCH}&_=${Date.now()}`,
        { headers: { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${token}` }, cache: 'no-store' }
      )
      if (res.status === 404) return { events: [], sha: null }
      if (res.ok) {
        const data   = await res.json()
        const events = JSON.parse(b64Decode(data.content))
        saveCache(events)
        return { events, sha: data.sha }
      }
    } catch { /* fall through */ }
  }

  // 匿名读取：raw CDN
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${GITHUB_REPO}/${BRANCH}/${DATA_PATH}?_=${Date.now()}`,
      { cache: 'no-store' }
    )
    if (res.status === 404) return { events: [], sha: null }
    if (res.ok) {
      const events = await res.json()
      saveCache(events)
      return { events, sha: null }
    }
  } catch { /* fall through */ }

  // 兜底：本地缓存
  return { events: loadCache(), sha: null, offline: true }
}

/* 获取文件当前 sha（写入时需要） */
async function getSha() {
  const token = getToken()
  if (!token) return null
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${DATA_PATH}?ref=${BRANCH}&_=${Date.now()}`,
      { headers: { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${token}` }, cache: 'no-store' }
    )
    if (res.ok) return (await res.json()).sha
  } catch { /* ignore */ }
  return null
}

/* ─── 保存排期 ───
   返回 { ok } | { ok:false, needToken } | { ok:false, error } */
export async function saveSchedule(events) {
  const token = getToken()
  saveCache(events)                       // 乐观写入本地缓存
  if (!token) return { ok: false, needToken: true }

  const doPut = (sha) => {
    const body = {
      message: `chore: update schedule ${new Date().toISOString()}`,
      content: b64Encode(JSON.stringify(events, null, 2)),
      branch:  BRANCH,
    }
    if (sha) body.sha = sha
    return fetch(`https://api.github.com/repos/${GITHUB_REPO}/contents/${DATA_PATH}`, {
      method:  'PUT',
      headers: { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${token}` },
      body:    JSON.stringify(body),
    })
  }

  try {
    let res = await doPut(await getSha())
    if (res.status === 409) res = await doPut(await getSha())   // sha 冲突重试一次
    if (res.status === 401 || res.status === 403) return { ok: false, needToken: true }
    if (!res.ok) return { ok: false, error: res.status }
    return { ok: true }
  } catch {
    return { ok: false, error: 'network' }
  }
}

/* 校验 token 是否对本仓库有写权限 */
export async function verifyWriteToken(t) {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}`, {
      headers: { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${t}` },
    })
    if (!res.ok) return false
    const data = await res.json()
    return !!(data.permissions && data.permissions.push)
  } catch { return false }
}
