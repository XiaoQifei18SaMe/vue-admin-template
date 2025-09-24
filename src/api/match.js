import request from '@/utils/request'

/**
 * 月赛相关API
 */
export default {
  /**
   * 获取当前可报名的月赛
   */
  getAvailableMatches() {
    return request({
      url: '/monthly-match/available',
      method: 'get'
    })
  },
  
  /**
   * 学员报名月赛
   * @param {Object} params - 报名参数
   * @param {number} params.matchId - 月赛ID
   * @param {number} params.studentId - 学员ID
   * @param {string} params.groupType - 组别（GROUP_A, GROUP_B, GROUP_C）
   */
  registerForMatch(params) {
    return request({
      url: '/monthly-match/register',
      method: 'post',
      params
    })
  },
  
  /**
   * 获取学员的报名记录
   * @param {number} studentId - 学员ID
   */
  getStudentRegistrations(studentId) {
    return request({
      url: '/monthly-match/student-registrations',
      method: 'get',
      params: { studentId }
    })
  },
  
  /**
   * 获取月赛各组别报名人数
   * @param {number} matchId - 月赛ID
   */
  getGroupRegistrationCounts(matchId) {
    return request({
      url: '/monthly-match/group-counts',
      method: 'get',
      params: { matchId }
    })
  },

  /**
   * 获取单个月赛详情（根据月赛ID）
   * @param {number} matchId - 月赛ID
   */
  getMatchById(matchId) {
    return request({
      url: '/monthly-match/get-match',
      method: 'get',
      params: { matchId }
    })
  },

  /**
   * 获取学员的比赛安排（原有接口，确保存在）
   * @param {Object} params - 参数
   * @param {number} params.matchId - 月赛ID
   * @param {number} params.studentId - 学员ID
   */
  getStudentMatchSchedule(params) {
    return request({
      url: '/monthly-match/student-schedule',
      method: 'get',
      params
    })
  },
  
  /**
   * 管理员修改比赛时间
   * @param {Object} params - 参数
   * @param {number} params.matchId - 月赛ID
   * @param {string} params.startTime - 比赛开始时间（ISO格式）
   */
  updateMatchTime(params) {
    return request({
      url: '/monthly-match/admin/update-time',
      method: 'post',
      params
    })
  }
}


/**
 * 管理员创建新比赛
 * @param {Object} data - 比赛信息
 * @param {string} data.title - 比赛标题
 * @param {string} data.startTime - 比赛开始时间(ISO格式字符串)
 * @param {string} data.registrationDeadline - 报名截止时间(ISO格式字符串)
 */
export function createMonthlyMatch(data) {
  return request({
    url: '/monthly-match/admin/create',
    method: 'post',
    params: data
  })
}

/**
 * 管理员更新比赛信息
 * @param {Object} data - 比赛信息
 * @param {number} data.matchId - 比赛ID
 * @param {string} [data.title] - 比赛标题(可选)
 * @param {string} [data.startTime] - 比赛开始时间(可选)
 * @param {string} [data.registrationDeadline] - 报名截止时间(可选)
 * @param {string} [data.status] - 比赛状态(可选)
 */
export function updateMonthlyMatch(data) {
  return request({
    url: '/monthly-match/admin/update',
    method: 'put',
    params: data
  })
}

/**
 * 管理员获取所有比赛
 * @param {Object} [params] - 筛选参数
 * @param {number} [params.year] - 年份筛选
 * @param {number} [params.month] - 月份筛选
 */
export function getAllMonthlyMatches(params = {}) {
  return request({
    url: '/monthly-match/admin/all',
    method: 'get',
    params
  })
}

/**
 * 管理员手动触发赛程安排
 * @param {number} matchId - 比赛ID
 */
export function arrangeMatchSchedule(matchId) {
  return request({
    url: '/monthly-match/admin/arrange-schedule',
    method: 'post',
    params: { matchId }
  })
}

/**
 * 新增：管理员获取某比赛的全量赛程
 * @param {number} matchId - 月赛ID
 */
export function getAdminMatchSchedule(matchId) {
  return request({
    url: '/monthly-match/admin/schedule',
    method: 'get',
    params: { matchId } // 传递月赛ID
  })
}

export function getMatchById(matchId) {
  return request({
    url: '/monthly-match/get-match',
    method: 'get',
    params: { matchId } // 确保传递matchId参数
  })
}