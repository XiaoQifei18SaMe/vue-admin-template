// src/api/campus.js
import request from '@/utils/request'

// 获取校区列表
export function getCampusList(params) {
  return request({
    url: '/vue-admin-template/campus/list',
    method: 'get',
    params
  })
}

// 获取管理员列表（用于选择校区管理员）
export function getAdminList() {
  return request({
    url: '/vue-admin-template/campus/admins',
    method: 'get'
  })
}

// 创建校区
export function createCampus(data) {
  return request({
    url: '/vue-admin-template/campus/create',
    method: 'post',
    data
  })
}

// 更新校区
export function updateCampus(id, data) {
  return request({
    url: `/vue-admin-template/campus/update/${id}`,
    method: 'post',
    data
  })
}

// 删除校区
export function deleteCampus(id) {
  return request({
    url: `/vue-admin-template/campus/delete/${id}`,
    method: 'post'
  })
}