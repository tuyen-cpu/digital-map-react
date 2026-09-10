export function normalizeVietnamPhone(value = '') {
  let digits = String(value).replace(/\D/g, '')
  if (digits.startsWith('84') && digits.length >= 11) digits = `0${digits.slice(2)}`
  return digits
}

export function isValidVietnamMobilePhone(value = '') {
  const phone = normalizeVietnamPhone(value)
  return /^0(?:3|5|7|8|9)\d{8}$/.test(phone)
}

export function formatVietnamPhone(value = '') {
  const phone = normalizeVietnamPhone(value)
  if (phone.length !== 10) return phone
  return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`
}

export const VIETNAM_PHONE_HELP = 'Nhập số di động Việt Nam 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.'
