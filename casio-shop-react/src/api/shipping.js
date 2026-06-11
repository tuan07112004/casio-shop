const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

const districtCache = new Map()
const wardCache = new Map()
let provincesCache = null
let provincesInflight = null

async function parseJson(res) {
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.message || 'Yêu cầu thất bại')
  }
  return data
}

export async function apiGhnStatus() {
  const res = await fetch(`${API}/api/shipping/ghn/status`)
  if (!res.ok) return { enabled: false }
  return res.json()
}

export function prefetchGhnProvinces() {
  if (provincesCache) return Promise.resolve(provincesCache)
  if (provincesInflight) return provincesInflight

  provincesInflight = fetch(`${API}/api/shipping/ghn/provinces`)
    .then(parseJson)
    .then((data) => {
      provincesCache = data
      return data
    })
    .finally(() => {
      provincesInflight = null
    })

  return provincesInflight
}

export async function apiGhnProvinces() {
  if (provincesCache) return provincesCache
  return prefetchGhnProvinces()
}

export async function apiGhnDistricts(provinceId) {
  const key = String(provinceId)
  if (districtCache.has(key)) return districtCache.get(key)

  const qs = new URLSearchParams({ province_id: key })
  const res = await fetch(`${API}/api/shipping/ghn/districts?${qs}`)
  const data = await parseJson(res)
  districtCache.set(key, data)
  return data
}

export async function apiGhnWards(districtId) {
  const key = String(districtId)
  if (wardCache.has(key)) return wardCache.get(key)

  const qs = new URLSearchParams({ district_id: key })
  const res = await fetch(`${API}/api/shipping/ghn/wards?${qs}`)
  const data = await parseJson(res)
  wardCache.set(key, data)
  return data
}

export async function apiGhnQuote({
  toDistrictId,
  toWardCode,
  weight,
  serviceId,
  codValue = 0,
  signal,
}) {
  const res = await fetch(`${API}/api/shipping/ghn/quote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      to_district_id: toDistrictId,
      to_ward_code: toWardCode,
      weight,
      service_id: serviceId,
      cod_value: codValue,
    }),
    signal,
  })
  return parseJson(res)
}
