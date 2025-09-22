import request from '@/utils/request'

export function getBalance(studentId) {
  return request({
    url: '/payment/balance',
    method: 'get',
    params: { studentId }
  })
}

export function createPayment(data) {
  return request({
    url: '/payment/create',
    method: 'post',
    params: data
  })
}

export function confirmPayment(recordId) {
  return request({
    url: '/payment/confirm',
    method: 'post',
    params: { recordId }
  })
}

export function cancelPayment(recordId) {
  return request({
    url: '/payment/cancel',
    method: 'post',
    params: { recordId }
  })
}

/**
 * 获取学生支付记录
 * @param {Object} params - 查询参数
 * @param {number} params.studentId - 学生ID
 * @param {number} params.page - 页码
 * @param {number} params.size - 每页条数
 * @param {string} [params.status] - 交易状态筛选
 * @param {string} [params.method] - 支付方式筛选
 */
export function getPaymentRecords(params) {
  return request({
    url: '/payment/records',
    method: 'get',
    params
  })
}