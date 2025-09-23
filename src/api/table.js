import request from '@/utils/request'

export function getList(params) {
  return request({
    url: '/vue-admin-template/table/list',
    method: 'get',
    params
  })
}



/**
 * 球台相关API（用于获取球台名称）
 */
export default {
  /**
   * 获取所有球台列表（含ID和名称）
   */
  getAllTables() {
    return request({
      url: '/table/all',
      method: 'get'
    })
  }
}

export function getTablesBySchoolId(schoolId) {
  return request({
    url: '/table/by-school',
    method: 'get',
    params: {
      schoolId // 后端接口要求的参数名，与@RequestParam保持一致
    }
  })
}
