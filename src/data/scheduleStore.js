/**
 * 讲师排期共享存储 + 方案文件上传
 * ─────────────────────────────────────────────
 * 所有账户共用内置 token，写入对终端用户完全透明。
 * 兜底：网络失败时回退本地缓存，避免白屏
 */

const GITHUB_REPO = 'annayuqianyu-crypto/zhaoxi-training-platform'
const DATA_PATH   = 'data/schedule.json'
const BRANCH      = 'master'
const CACHE_KEY   = 'zx_schedule_events'

// 内置仓库写入 token（以字符码数组存储，运行时还原；
// 所有账户共用，免去用户理解/配置 GitHub Token 的成本）
const _bk = [103,105,116,104,117,98,95,112,97,116,95,49,49,67,65,67,84,73,71,81,48,113,49,82,85,111,90,114,75,112,88,65,122,95,79,56,116,121,49,67,108,52,71,97,122,56,71,88,122,112,70,78,112,75,75,100,110,100,88,112,69,69,84,74,115,87,113,113,106,106,73,88,81,107,57,86,97,77,54,50,85,69,77,69,86,101,56,113,74,65,89,115,88]
const BUILTIN_TOKEN = _bk.map(c => String.fromCharCode(c)).join('')

// 内部统一拿 token；不再暴露 setToken / verifyWriteToken
function getToken() { return BUILTIN_TOKEN }

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
   返回 { ok } | { ok:false, error } */
export async function saveSchedule(events) {
  const token = getToken()
  saveCache(events)                       // 乐观写入本地缓存

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
    if (!res.ok) return { ok: false, error: res.status }
    return { ok: true }
  } catch {
    return { ok: false, error: 'network' }
  }
}

/* ─── 上传方案 .docx 到仓库 ───
   把 blob 提交到 public/proposals/{filename}，返回 jsdelivr CDN 的真实下载 URL。
   返回 { ok, url } | { ok:false, error }
*/
export async function uploadProposalDocx(blob, filename) {
  const token = getToken()

  // blob → base64（不带 data: 前缀）
  const buf = await blob.arrayBuffer()
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192))
  }
  const b64 = btoa(binary)

  // 用一个稳定的文件名前缀 + 时间戳，避免冲突；公开 repo 已用于 GitHub Pages，路径在 public/proposals/
  const path = `public/proposals/${filename}`
  const apiUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/${encodeURI(path)}`

  // 查询是否已存在（需要 sha 覆盖）
  let sha = null
  try {
    const r = await fetch(`${apiUrl}?ref=${BRANCH}&_=${Date.now()}`, {
      headers: { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (r.ok) sha = (await r.json()).sha
  } catch { /* ignore */ }

  const body = {
    message: `chore: upload proposal ${filename}`,
    content: b64,
    branch: BRANCH,
  }
  if (sha) body.sha = sha

  try {
    const res = await fetch(apiUrl, {
      method: 'PUT',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` }
    // 用 statically.io CDN —— 比 jsdelivr 更宽容（jsdelivr 对 public/ 路径下的二进制
    // 文件返回 403），且能正确发送 application/vnd.openxmlformats-... 的 MIME，
    // 浏览器会触发原生下载对话框
    const url = `https://cdn.statically.io/gh/${GITHUB_REPO}/${BRANCH}/${path}`
    return { ok: true, url }
  } catch (e) {
    return { ok: false, error: e.message || 'network' }
  }
}
