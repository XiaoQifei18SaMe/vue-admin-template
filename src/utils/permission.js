// src/utils/permission.js
export function isCampusAdmin(roles) {
    return roles && roles.includes('campus_admin')
  }
  
  // 新增超级管理员判断
  export function isSuperAdmin(roles) {
    // 确保判断逻辑正确：角色数组中包含 'super_admin' 才返回 true
    console.log('当前用户角色：', roles); // 新增调试日志
    return roles && roles.includes('super_admin');
  }