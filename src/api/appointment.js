import request from '@/utils/request'

// 获取教练课表
export function getCoachSchedule(coachId) {
  return request({
    url: '/appointment/coach_schedule',
    method: 'get',
    params: { coachId }
  })
}

// 预约课程
export function bookCourse(data) {
  return request({
    url: '/appointment/book',
    method: 'post',
    params: data
  })
}

// 教练处理预约
export function handleCoachConfirmation(appointmentId, accept) {
  return request({
    url: '/appointment/coach_handle',
    method: 'post',
    params: { appointmentId, accept }
  })
}

// 发起取消申请
export function requestCancel(appointmentId, userId, userType) {
  return request({
    url: '/appointment/cancel_request',
    method: 'post',
    params: { appointmentId, userId, userType }
  })
}

// 处理取消申请
export function handleCancelRequest(cancelRecordId, approve) {
  return request({
    url: '/appointment/handle_cancel',
    method: 'post',
    params: { cancelRecordId, approve }
  })
}

// 获取学员的预约列表
export function getStudentAppointments(studentId) {
  return request({
    url: '/appointment/student_list',
    method: 'get',
    params: { studentId }
  })
}

// 获取教练的预约列表
export function getCoachAppointments(coachId) {
  return request({
    url: '/appointment/coach_list',
    method: 'get',
    params: { coachId }
  })
}

// 获取取消申请记录
export function getPendingCancelRecords(userId, userType) {
  return request({
    url: '/appointment/pending_cancel_records',
    method: 'get',
    params: { userId, userType }
  })
}