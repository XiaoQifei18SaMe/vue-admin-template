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

