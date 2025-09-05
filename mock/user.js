
const tokens = {
  admin: {
    token: 'admin-token'
  },
  editor: {
    token: 'editor-token'
  }
}

// const users = {
//   'admin-token': {
//     roles: ['admin'],
//     introduction: 'I am a super administrator',
//     avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
//     name: 'Super Admin'
//   },
//   'editor-token': {
//     roles: ['editor'],
//     introduction: 'I am an editor',
//     avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
//     name: 'Normal Editor'
//   }
// }

// 存储用户信息（包含密码和角色）
const users = {
  'admin': {
    password: 'aaaa1111@',
    role: 'admin',
    token: 'admin-token',
    info: {
      roles: ['admin'],
      name: '管理员',
      avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
    }
  },
  'student_wang': {
    password: 'bbbb2222@',
    role: 'student',
    token: 'student-token',
    info: {
      roles: ['student'],
      name: '学生小王',
      avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
    }
  },
  'coach_K': {
    password: 'cccc3333@',
    role: 'coach',
    token: 'coach-token',
    info: {
      roles: ['coach'],
      name: '教练K',
      avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
    }
  }
}

module.exports = [
  // 登录接口修改：验证用户名、密码、角色
  {
    url: '/vue-admin-template/user/login',
    type: 'post',
    response: config => {
      const { username, password, role } = config.body
      const user = users[username]

      // 验证逻辑
      if (!user) {
        return { code: 60204, message: '用户名不存在' }
      } else if (user.password !== password) {
        return { code: 60204, message: '密码错误' }
      } else if (user.role !== role) {
        return { code: 60204, message: '角色不匹配' }
      }

      // 验证通过返回token
      return {
        code: 20000,
        data: { token: user.token }
      }
    }
  },

  // 获取用户信息接口（根据token返回对应角色信息）
  {
    url: '/vue-admin-template/user/info\.*',
    type: 'get',
    response: config => {
      const { token } = config.query
      // 根据token反向查找用户信息
      const userInfo = Object.values(users).find(u => u.token === token)?.info
      
      if (!userInfo) {
        return { code: 50008, message: '用户信息不存在' }
      }
      return { code: 20000, data: userInfo }
    }
  },


  // user logout
  {
    url: '/vue-admin-template/user/logout',
    type: 'post',
    response: _ => {
      return {
        code: 20000,
        data: 'success'
      }
    }
  }
]

// module.exports = [
//   // user login
//   {
//     url: '/vue-admin-template/user/login',
//     type: 'post',
//     response: config => {
//       const { username } = config.body
//       const token = tokens[username]

//       // mock error
//       if (!token) {
//         return {
//           code: 60204,
//           message: 'Account and password are incorrect.'
//         }
//       }

//       return {
//         code: 20000,
//         data: token
//       }
//     }
//   },

//   // get user info
//   {
//     url: '/vue-admin-template/user/info\.*',
//     type: 'get',
//     response: config => {
//       const { token } = config.query
//       const info = users[token]

//       // mock error
//       if (!info) {
//         return {
//           code: 50008,
//           message: 'Login failed, unable to get user details.'
//         }
//       }

//       return {
//         code: 20000,
//         data: info
//       }
//     }
//   },

//   // user logout
//   {
//     url: '/vue-admin-template/user/logout',
//     type: 'post',
//     response: _ => {
//       return {
//         code: 20000,
//         data: 'success'
//       }
//     }
//   }
// ]

