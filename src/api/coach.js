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