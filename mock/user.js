
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

// 1. 系统默认用户（初始数据）
const defaultUsers  = {
  // 1. 新增超级管理员
  'super_admin': {
    password: 'super123@',
    role: 'super_admin', // 角色标识
    token: 'super-admin-token',
    info: {
      roles: ['super_admin'],
      name: '超级管理员',
      avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
      // 超级管理员无校区限制，无需campus字段
    }
  },
  // 2. 新增校区管理员（示例：东校区管理员）
  'campus_admin': {
    password: 'campus123@',
    role: 'campus_admin', // 角色标识
    token: 'campus-admin-east-token',
    info: {
      roles: ['campus_admin'],
      name: '东校区管理员',
      avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
      campus: 'east' // 核心：关联所属校区（对应校区value）
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
  },
}

// 2. 注册用户存储（模拟数据库表）
const registeredUsers = {} // 独立对象，避免嵌套问题

module.exports = [
  // 登录接口：必须同时查询默认用户和注册用户（核心修复点）
  {
    url: '/vue-admin-template/user/login',
    type: 'post',
    response: config => {
      const { username, password, role } = config.body;

      // 关键修复：先查默认用户，再查注册用户（覆盖所有用户来源）
      const user = defaultUsers[username] || registeredUsers[username];

      // 修复错误处理逻辑，避免返回500
      if (!user) {
        return { code: 60204, message: '用户名不存在' }; // 明确错误码
      } else if (user.password !== password) {
        return { code: 60204, message: '密码错误' };
      } else if (user.role !== role) {
        return { code: 60204, message: '角色不匹配' };
      }

      // 确保返回正确的token结构
      return {
        code: 20000,
        data: { token: user.token } // 必须返回token，否则登录后无法获取用户信息
      };
    }
  },

  // 获取用户信息接口：修复token查询逻辑（避免500）
  {
    url: '/vue-admin-template/user/info\.*',
    type: 'get',
    response: config => {
      const { token } = config.query;

      // 修复：同时从默认用户和注册用户中查询token对应的信息
      let userInfo = null;
      // 检查默认用户
      Object.values(defaultUsers).forEach(user => {
        if (user.token === token) {
          userInfo = user.info;
        }
      });
      // 检查注册用户
      if (!userInfo) {
        Object.values(registeredUsers).forEach(user => {
          if (user.token === token) {
            userInfo = user.info;
          }
        });
      }

      // 明确错误处理，避免返回500
      if (!userInfo) {
        return { code: 50008, message: '登录已过期，请重新登录' };
      }

      return { code: 20000, data: userInfo };
    }
  },
  // // 登录接口修改：验证用户名、密码、角色
  // {
  //   url: '/vue-admin-template/user/login',
  //   type: 'post',
  //   response: config => {
  //     const { username, password, role } = config.body
  //    // 先查默认用户，再查注册用户
  //    const user = defaultUsers[username] || registeredUsers[username]

  //     // 验证逻辑
  //     if (!user) {
  //       return { code: 60204, message: '用户名不存在' }
  //     } else if (user.password !== password) {
  //       return { code: 60204, message: '密码错误' }
  //     } else if (user.role !== role) {
  //       return { code: 60204, message: '角色不匹配' }
  //     }

  //     // 验证通过返回token
  //     return {
  //       code: 20000,
  //       data: { token: user.token }
  //     }
  //   }
  // },

  // // 获取用户信息接口（根据token返回对应角色信息）
  // {
  //   url: '/vue-admin-template/user/info\.*',
  //   type: 'get',
  //   response: config => {
  //     const { token } = config.query
  //     // 根据token反向查找用户信息
  //     const userInfo = Object.values(users).find(u => u.token === token)?.info
      
  //     if (!userInfo) {
  //       return { code: 50008, message: '用户信息不存在' }
  //     }
  //     return { code: 20000, data: userInfo }
  //   }
  // },


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
  },

  // 文件上传接口（必须添加）
  {
    url: '/vue-admin-template/user/upload',
    type: 'post',
    response: () => {
      // 模拟返回上传成功的响应
      return {
        code: 20000,
        message: '图片上传成功',
        data: {
          url: `https://picsum.photos/400/400?random=${Math.random()}`
        }
      }
    }
  },

  // 新增：注册接口（核心缺失部分）
  {
    url: '/vue-admin-template/user/register',
    type: 'post',
    response: config => {
      const { username, role, password } = config.body;

      // 1. 模拟验证：用户名已存在
      // 检查用户名是否已存在（默认用户或注册用户中）
      if (defaultUsers[username] || registeredUsers[username]) {
        return { code: 60204, message: '用户名已存在' }
      }

      // 2. 模拟注册成功：保存用户到模拟数据库

      // 保存到注册用户表
      registeredUsers[username] = {
        username,
        password,
        role,
        token: `${role}-${username}-token`,
        info: {
          roles: [role],
          name: config.body.realName || username,
          avatar: config.body.photo || 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
        }
      };
      // users.registered_users[username] = {
      //   username,
      //   password,
      //   role,
      //   token: `${role}-${username}-token`, // 生成临时token
      //   info: {
      //     roles: [role],
      //     name: config.body.realName || username,
      //     avatar: config.body.photo || 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
      //   }
      // };

      // 3. 返回注册成功响应
      return {
        code: 20000, // 成功码（与其他接口保持一致）
        message: role === 'student' ? '注册成功' : '注册申请已提交',
        data: { success: true }
      };
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

