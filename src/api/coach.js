import request from '@/utils/request'
// 获取学员申请列表
export function getStudentApplications(coachId) {
    return request({
      url: '/coach/selected_by_student',
      method: 'get',
      params: { coachId }
    })
  }
  
  // 获取学员详情
  export function getStudentDetail(studentId) {
    return request({
      url: '/coach/get_student_detail',
      method: 'get',
      params: { studentId }
    })
  }
  
  // 审核学员申请
  export function reviewStudentApplication(applicationId, isAccepted) {
    return request({
      url: '/coach/review_student_select',
      method: 'post',
      params: {
        coachTeachStudentId: applicationId,
        isAccepted
      }
    })
}
  
export function getRelatedStudents(coachId) {
  return request({
    url: '/coach/get_related_students',
    method: 'get',
    params: { coachId }
  })
}

/**
 * 获取教练账户余额
 * @param {number} coachId - 教练ID
 */
export function getCoachAccountBalance(coachId) {
  return request({
    url: '/coach/account/balance',
    method: 'get',
    params: { coachId }
  })
}

/**
 * 获取教练账户流水记录
 * @param {number} coachId - 教练ID
 * @param {number} page - 页码
 * @param {number} size - 每页条数
 * @param {string} type - 交易类型，可选值：COURSE_INCOME、WITHDRAW
 */
export function getAccountTransactions(coachId, page = 1, size = 10, type = '') {
  return request({
    url: '/coach/account/transactions',
    method: 'get',
    params: { coachId, page, size, type }
  })
}

/**
 * 提交提现申请
 * @param {Object} data - 提现信息
 * @param {number} data.coachId - 教练ID
 * @param {number} data.amount - 提现金额
 * @param {string} data.bankAccount - 银行账号
 * @param {string} data.bankName - 银行名称
 * @param {string} data.accountHolder - 账户持有人姓名
 */
export function submitWithdrawApplication(data) {
  return request({
    url: '/coach/account/withdraw',
    method: 'post',
    params: data
  })
}
