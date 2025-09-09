// 校区管理员判断（单个角色）
export function isCampusAdmin(role) {
  return role === 'campus_admin' // 原为 roles.includes('campus_admin')
}

// 超级管理员判断（单个角色）
export function isSuperAdmin(role) {
  console.log('当前用户角色：', role);
  return role === 'super_admin' // 原为 roles.includes('super_admin')
}