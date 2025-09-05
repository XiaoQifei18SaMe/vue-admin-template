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
// 修改用户名验证：至少4位，允许字母、数字、下划线
export function validUsername(str) {
  const reg = /^[a-zA-Z0-9_]{4,}$/
  return reg.test(str.trim())
}