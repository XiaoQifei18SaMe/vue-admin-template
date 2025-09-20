import request from '@/utils/request'

// 获取未审核教练列表
export function getUncertifiedCoaches(token) {
  return request({
    url: '/admin/get_coach_register',
    method: 'get',
    params: {token}
  })
}

// 获取教练详情
export function getCoachDetail(coachId) {
  return request({
    url: '/admin/get_coach_detail',
    method: 'get',
    params: {coachId}
  })
}

// 审核教练（通过/拒绝）
export function certifyCoach(coachId, isAccepted, level) {
  return request({
    url: '/admin/certify_coach',
    method: 'post',
    data: {
      coachId,
      isAccepted,
      level
    }
  })
}

// 获取已审核教练列表（扩展功能，可选）
export function getCertifiedCoaches(params) {
  return request({
    url: '/admin/certified_coaches',
    method: 'get',
    params
  })
}

// 禁用/启用教练（扩展功能，可选）
export function toggleCoachStatus(id, status) {
  return request({
    url: `/admin/coach_status/${id}`,
    method: 'post',
    data: {
      status // 例如：'active' 或 'inactive'
    }
  })
}

/**
 * 按校区ID获取教练列表（管理员接口）
 * @param {String} token - 管理员token
 * @param {Number} schoolId - 校区ID
 * @returns {Promise} - 包含教练列表的响应
 */
export function getCoachesBySchoolId(token, schoolId) {
  return request({
    url: '/admin/get_coaches_by_school',
    method: 'get',
    params: {
      token,
      schoolId
    }
  })
}

/**
 * 按校区ID获取学生列表（管理员接口）
 * @param {String} token - 管理员token
 * @param {Number} schoolId - 校区ID
 * @returns {Promise} - 包含学生列表的响应
 */
export function getStudentsBySchoolId(token, schoolId) {
  return request({
    url: '/admin/get_students_by_school',
    method: 'get',
    params: {
      token,
      schoolId
    }
  })
}
    