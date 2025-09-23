import request from '@/utils/request'

/**
 * 获取教练列表（带筛选条件）
 * @param {Object} params - 筛选参数
 * @param {string} params.name - 教练姓名（模糊匹配）
 * @param {boolean} params.isMale - 性别（true为男，false为女）
 * @param {number} params.age_low - 最小年龄
 * @param {number} params.age_high - 最大年龄
 * @param {number} params.level - 教练等级（10：初级，100：中级，1000：高级）
 * @param {number} params.schoolId - 所属校区ID（必传）
 * @returns {Promise}
 */
export function getCoachList(params) {
  return request({
    url: '/student/get_coach_list',
    method: 'get',
    params
  })
}

/**
 * 获取教练详情
 * @param {number} coachId - 教练ID
 * @returns {Promise}
 */
export function getCoachDetail(coachId) {
  return request({
    url: '/student/get_coach_detail', // 改为学生端接口路径
    method: 'get',
    params: { coachId }
  })
}

/**
 * 学员选择教练（提交申请）
 * @param {Object} data - 申请参数
 * @param {number} data.coachId - 教练ID
 * @param {number} data.studentId - 学员ID
 * @returns {Promise}
 */
export function selectCoach(data) {
  return request({
    url: '/student/select_coach',
    method: 'post',
    params: data // 后端使用@RequestParam接收，故用params传递
  })
}


export function getRelatedCoaches(studentId) {
  return request({
    url: '/student/get_related_coaches',
    method: 'get',
    params: { studentId }
  })
}


  /**
   * 根据ID查询学生信息
   * @param {number} studentId - 学生ID
   */
export function getStudentById(studentId) {
    return request({
      url: '/student/get-by-id',
      method: 'get',
      params: { studentId }
    })
  }
