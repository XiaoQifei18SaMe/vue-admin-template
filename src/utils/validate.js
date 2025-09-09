/**
 * Created by PanJiaChen on 16/11/18.
 */

/**
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path)
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
// export function validUsername(str) {
//   const valid_map = ['admin', 'editor']
//   return valid_map.indexOf(str.trim()) >= 0
// }
// 修改用户名验证：4-16位，允许字母、数字、下划线
export function validUsername(str) {
  const reg = /^[a-zA-Z0-9_]{4,16}$/
  return reg.test(str.trim())
}

// 密码验证：8-16位，包含字母、数字、特殊字符
export function validPassword(str) {
  const reg = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,16}$/
  return reg.test(str.trim())
}

/**
 * 验证手机号（中国大陆）
 * @param {string} str - 待验证的手机号字符串
 * @returns {Boolean} - 是否符合手机号格式
 * 规则：11位数字，以13/14/15/16/17/18/19开头
 */
export function validPhone(str) {
  const reg = /^1[3-9]\d{9}$/
  return reg.test(str.trim())
}

