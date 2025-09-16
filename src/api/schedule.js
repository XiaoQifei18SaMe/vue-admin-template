

import request from '@/utils/request'

// 获取默认课表模板（区分超级管理员和普通管理员）
export function getDefaultSchedule(isSuper) {
  const baseUrl = isSuper ? '/super_admin/schedule' : '/admin/schedule'
  return request({
    url: `${baseUrl}/default`,
    method: 'get'
  })
}

// 获取可选校区列表（超级管理员全量，普通管理员仅管辖校区）
export function getAvailableSchools(isSuper, token) {
  const url = isSuper 
    ? '/super_admin/schedule/schools' 
    : '/admin/schedule/managed-schools'
  
  return request({
    url,
    method: 'get',
    params: !isSuper ? { token } : {} // 普通管理员需要传token
  })
}

// 检查单个校区是否已有课表
export function checkSchoolHasSchedule(schoolId, isSuper) {
  const baseUrl = isSuper ? '/super_admin/schedule' : '/admin/schedule'
  return request({
    url: `${baseUrl}/check/${schoolId}`,
    method: 'get'
  })
}

// 保存课表到指定校区
export function saveScheduleToSchool(schoolId, schedules, isSuper) {
  const baseUrl = isSuper ? '/super_admin/schedule' : '/admin/schedule'
  return request({
    url: `${baseUrl}/save/${schoolId}`,
    method: 'post',
    data: schedules
  })
}

// 获取指定校区的课表
export function getSchoolSchedule(schoolId, isSuper) {
  const baseUrl = isSuper ? '/super_admin/schedule' : '/admin/schedule'
  return request({
    url: `${baseUrl}/school/${schoolId}`,
    method: 'get'
  })
}