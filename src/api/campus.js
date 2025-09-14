// src/api/campus.js
import request from '@/utils/request'

// 获取校区列表
// export function getCampusList(params) {
//   return request({
//     url: '/campus/list',
//     method: 'get',
//     params
//   })
// }
export function getSchoolOptions() {
  return request({
    url: '/common/school_options', // 后端公共接口路径
    method: 'get', // 请求方式为GET
  })
}

// 获取管理员列表（用于选择校区管理员）
export function getAdminList() {
  return request({
    url: '/campus/admins',
    method: 'get'
  })
}

// 创建校区
export function createCampus(data) {
  return request({
    url: '/campus/create',
    method: 'post',
    data
  })
}

// 更新校区
export function updateCampus(id, data) {
  return request({
    url: `/campus/update/${id}`,
    method: 'post',
    data
  })
}

// 删除校区
export function deleteCampus(id) {
  return request({
    url: `/campus/delete/${id}`,
    method: 'post'
  })
}