import request from '@/utils/request'

export function login(data) {
  switch (data.role) {
    case 'super_admin':
      return request({
        url: '/super_admin/login',
        method: 'post',
        data
      })
    case 'campus_admin':
      return request({
        url: '/admin/login',
        method: 'post',
        data
      })
    case 'coach':
      return request({
        url: '/coach/login',
        method: 'post',
        data
      })
    case 'student':
      return request({
        url: '/student/login',
        method: 'post',
        data
      })

  }
  // return request({
  //   url: '/vue-admin-template/user/login',
  //   method: 'post',
  //   data
  // })
}

export function getInfo(token) {
  return request({
    url: '/info',
    method: 'get',
    params: { token }
  })
}

export function logout() {
  return request({
    url: '/vue-admin-template/user/logout',
    method: 'post'
  })
}

// 添加注册接口
export function register(data) {
  return request({
    url: '/vue-admin-template/user/register',
    method: 'post',
    data
  })
}

// 新增：文件上传接口（与登录接口风格一致）
export function uploadFile(data) {
  return request({
    url: '/vue-admin-template/user/upload',
    method: 'post',
    data,
    // 上传文件需要指定Content-Type为multipart/form-data
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
