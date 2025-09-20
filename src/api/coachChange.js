// src/api/coachChange.js
import request from '@/utils/request'

/**
 * 获取学员当前的教练
 * @param {number} studentId - 学员ID
 */
export function getCurrentCoaches(studentId) {
  return request({
    url: '/coach-change/current-coaches',
    method: 'get',
    params: { studentId }
  })
}

/**
 * 获取学员所在校区的所有教练
 * @param {number} studentId - 学员ID
 */
export function getSchoolCoaches(studentId) {
  return request({
    url: '/coach-change/school-coaches',
    method: 'get',
    params: { studentId }
  })
}

/**
 * 提交更换教练申请
 * @param {number} studentId - 学员ID
 * @param {number} currentCoachId - 当前教练ID
 * @param {number} targetCoachId - 目标教练ID
 */
export function submitChangeRequest(studentId, currentCoachId, targetCoachId) {
  return request({
    url: '/coach-change/submit-request',
    method: 'post',
    params: { studentId, currentCoachId, targetCoachId }
  })
}

/**
 * 处理更换教练申请
 * @param {number} requestId - 申请ID
 * @param {number} handlerId - 处理人ID
 * @param {string} handlerType - 处理人类型(STUDENT/COACH/ADMIN)
 * @param {boolean} approve - 是否同意
 */
export function handleChangeRequest(requestId, handlerId, handlerType, approve) {
  return request({
    url: '/coach-change/handle-request',
    method: 'post',
    params: { requestId, handlerId, handlerType, approve }
  })
}

/**
 * 获取用户相关的更换教练申请
 * @param {number} userId - 用户ID
 * @param {string} userType - 用户类型(STUDENT/COACH/ADMIN)
 */
export function getRelatedRequests(userId, userType) {
  return request({
    url: '/coach-change/related-requests',
    method: 'get',
    params: { userId, userType }
  })
}