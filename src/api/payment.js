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