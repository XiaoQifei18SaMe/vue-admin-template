import request from '@/utils/request'

//获取管理员列表
export function getAdmins() {
    return request({
        url: '/super_admin/admins',
        method: 'get'
    })
}

// 创建管理员
export function createAdmin(data) {
  return request({
    url: '/super_admin/create_admin',
    method: 'post',
    data
  })
}

export function updateAdmin(data) {
    return request({
        url: '/super_admin/edit_admin',
        method: 'post',
        data
    })
}

export function deleteAdmin(id) {
    return request({
        url: `/super_admin/delete_admin/${id}`,
        method: 'delete'
    })
}


// 获取所有校区列表
export function getSchools() {
    return request({
      url: '/super_admin/schools',
      method: 'get'
    })
  }
  
  // 创建新校区
  export function createSchool(data) {
    return request({
      url: '/super_admin/create_school',
      method: 'post',
      data
    })
  }
  
  // 更新校区信息
  export function updateSchool(data) {
    return request({
      url: '/super_admin/manage_school_info',
      method: 'post',
      data
    })
  }
  
  // 删除校区
  export function deleteSchool(id) {
    return request({
      url: `/super_admin/delete_school/${id}`,
      method: 'delete'
    })
  }