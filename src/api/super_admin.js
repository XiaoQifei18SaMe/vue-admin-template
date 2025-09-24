import request from '@/utils/request'
import { getDeviceId } from '@/utils/device' 

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
  



export function getAllUncertifiedCoaches() {
  return request({
    url: '/super_admin/get_all_uncertified_coaches',
    method: 'get'
  })
}

export function getSuperCoachDetail(coachId) {
  return request({
    url: '/super_admin/get_super_coach_detail',
    method: 'get',
    params: {coachId}
  })
}

export function superCertifyCoach(coachId, isAccepted, level) {
  return request({
    url: '/super_admin/super_certify_coach',
    method: 'post',
    data: {
      coachId,
      isAccepted,
      level
    }
  })
}

// 分页查询所有校区学生（支持筛选）
export function getAllStudents(params) {
  return request({
    url: '/super_admin/all-students',
    method: 'get',
    params
  })
}

// 分页查询所有已认证教练（支持筛选）
export function getAllCertifiedCoaches(params) {
  return request({
    url: '/super_admin/all-certified-coaches',
    method: 'get',
    params
  })
}

// 超级管理员更新学生信息
export function updateStudent(token, student) {
  return request({
    url: '/super_admin/update-student',
    method: 'post',
    params: { token },
    data: student
  })
}

// 超级管理员更新已认证教练信息
export function updateCertifiedCoach(token, coach) {
  return request({
    url: '/super_admin/update-certified-coach',
    method: 'post',
    params: { token },
    data: coach
  })
}

export function superAdminOfflineRecharge(studentId, amount) {
  return request({
    url: '/super_admin/recharge', // 与后端接口URL完全匹配
    method: 'post',
    params: {  // 这里使用params而不是data
      studentId, 
      amount 
    }
  })
}


export function payServiceFee(superAdminId) {
  return request({
    url: '/super_admin/pay_service_fee',
    method: 'get',
    params: { superAdminId } // 关键：用 params 传递，拼到 URL 后（如 ?superAdminId=1）
  });
}

// 激活系统
export function activateSystem(data) {
  return request({
    url: '/super_admin/activate_system',
    method: 'post',
    params: {
      superAdminId: data.superAdminId, // 匹配后端 superAdminId
      deviceId: data.deviceId          // 匹配后端 deviceId
    }
  })
}

// 验证系统是否已激活
export function verifyActivation() {
  const deviceId = getDeviceId(); // 获取当前设备的deviceId
  return request({
    url: '/super_admin/verify_activation',
    method: 'get',
    params: { deviceId } // 作为请求参数传给后端
  })
}