import request from '@/utils/request'

export function login(data) {
  console.log("login的data : " + data.username + " " + data.password)
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
  console.log("getInfo携带的token " + token)
  return request({
    url: '/token/info',
    method: 'get',
    params: { token }
  })
}

export function logout(data) {
  console.log("logout携带的token " + data)
  return request({
    url: '/token/logout',
    method: 'post',
    data: { token: data }  // 包装成JSON对象，键为token
  })
}
// 添加注册接口
export function register(data, role) {
  console.log("register的role : " + role)
  console.log("register的data : " + data)
  //console.log("baseurl" + VUE_APP_BASE_API)
  return request({
    url: `/${role}/create_user`, // 学员：/student/create_user；教练：/coach/create_user
    method: 'post',
    data,
    // 教练提交FormData时，Axios会自动设置Content-Type为multipart/form-data，无需手动指定
   // headers: role === 'student' ? { 'Content-Type': 'application/json' } : {}
  });
}

// export function uploadFile(data) {
//   return request({
//     url: '/coach/upload_photo', // 后端接收照片的接口路径
//     method: 'post',
//     data,
//     headers: {
//       'Content-Type': 'multipart/form-data' // 上传文件必须的类型
//     }
//   })
// }
