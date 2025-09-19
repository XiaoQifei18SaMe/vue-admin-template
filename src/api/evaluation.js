import request from '@/utils/request'

/**
 * 新增评价（原submitEvaluation重命名，语义更清晰）
 * @param {Object} data - 评价数据
 * @param {number} data.appointmentId - 预约ID
 * @param {number} data.evaluatorId - 评价人ID
 * @param {string} data.evaluatorType - 评价人类型(STUDENT/COACH)
 * @param {string} data.content - 评价内容
 */
export function createEvaluation(data) {
  return request({
    url: '/evaluation/submit',
    method: 'post',
    params: data
  })
}

/**
 * 根据预约ID获取评价列表
 * @param {number} appointmentId - 预约ID
 */
export function getEvaluationsByAppointment(appointmentId) {
  return request({
    url: '/evaluation/by_appointment',
    method: 'get',
    params: { appointmentId }
  })
}

/**
 * 根据用户ID获取评价记录
 * @param {number} userId - 用户ID
 * @param {string} type - 评价人类型(STUDENT/COACH)
 */
export function getEvaluationsByUser(userId, type) {
  return request({
    url: '/evaluation/by_user',
    method: 'get',
    params: { userId, type }
  })
}

/**
 * 编辑评价（新增）
 * @param {Object} data - 编辑数据
 * @param {number} data.evaluationId - 评价ID
 * @param {string} data.content - 新评价内容
 * @param {number} data.evaluatorId - 评价人ID（用于权限校验）
 */
export function updateEvaluation(data) {
  return request({
    url: '/evaluation/update',
    method: 'put',
    params: data
  })
}

/**
 * 删除评价（新增）
 * @param {Object} data - 删除数据
 * @param {number} data.evaluationId - 评价ID
 * @param {number} data.evaluatorId - 评价人ID（用于权限校验）
 */
export function deleteEvaluation(data) {
  return request({
    url: '/evaluation/delete',
    method: 'delete',
    params: data
  })
}