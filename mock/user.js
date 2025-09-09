const Mock = require('mockjs') // 引入Mock用于生成随机ID

// 1. 系统默认用户（初始数据）：用id作为键，所有字段平级存放
const defaultUsers = {
  // 超级管理员（id: 1）
  '1': {
    id: '1', // 新增id字段，与键保持一致
    username: 'super_admin', // 原用户名作为字段
    password: 'super123@',
    role: 'super_admin', // 单个角色（非数组）
    token: 'super-admin-token',
    name: '超级管理员', // 原info中的name
    avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif', // 原info中的avatar
    phone: '13800138000', // 原info中的phone
    email: 'super@example.com' // 原info中的email
    // 超级管理员无校区，不填campus
  },
  // 校区管理员（id: 2）
  '2': {
    id: '2',
    username: 'campus_admin',
    password: 'campus123@',
    role: 'campus_admin',
    token: 'campus-admin-east-token',
    name: '东校区管理员',
    avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
    phone: '13900139000',
    email: 'east@example.com',
    campus: 'east' // 关联校区
  },
  // 学生（id: 3）
  '3': {
    id: '3',
    username: 'student_wang',
    password: 'bbbb2222@',
    role: 'student',
    token: 'student-token',
    name: '学生小王',
    avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
    // 学生可按需添加phone/email等字段
  },
  // 教练（id: 4）
  '4': {
    id: '4',
    username: 'coach_K',
    password: 'cccc3333@',
    role: 'coach',
    token: 'coach-token',
    name: '教练K',
    avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif'
  }
}

// 2. 注册用户存储（模拟数据库表）：键为id，结构与默认用户一致
const registeredUsers = {}


// 通用登录验证函数：调整为通过username查找用户（因键改为id）
const validateLogin = (config, role) => {
  const { username, password } = config.body;
  
  // 从默认用户中查找（遍历values，按username匹配）
  const defaultUser = Object.values(defaultUsers).find(user => user.username === username);
  // 从注册用户中查找
  const registeredUser = Object.values(registeredUsers).find(user => user.username === username);
  // 优先取默认用户，再取注册用户
  const user = defaultUser || registeredUser;

  // 验证逻辑
  if (!user) {
    return { code: 60204, message: '用户名不存在' };
  } else if (user.password !== password) {
    return { code: 60204, message: '密码错误' };
  } else if (user.role !== role) {
    return { code: 60204, message: `角色不匹配，应为${user.role}` };
  }

  return {
    code: 20000,
    data: { token: user.token }
  };
};

module.exports = [
  // 超级管理员登录
  {
    url: '/super_admin/login',
    type: 'post',
    response: (config) => {
      console.log('超级管理员登录请求', config.body);
      return validateLogin(config, 'super_admin');
    }
  },
  
  // 管理员登录
  {
    url: '/admin/login',
    type: 'post',
    response: (config) => {
      console.log('管理员登录请求', config.body);
      return validateLogin(config, 'campus_admin');
    }
  },
  
  // 教练登录
  {
    url: '/coach/login',
    type: 'post',
    response: (config) => {
      console.log('教练登录请求', config.body);
      return validateLogin(config, 'coach');
    }
  },
  
  // 学生登录
  {
    url: '/student/login',
    type: 'post',
    response: (config) => {
      console.log('学生登录请求', config.body);
      return validateLogin(config, 'student');
    }
  },
    
  // 获取用户信息接口：返回平级字段（无info嵌套）
  {
    url: '/info',
    type: 'get',
    response: config => {
      const { token } = config.query;

      // 从默认用户和注册用户中按token查找
      let user = null;
      // 检查默认用户
      Object.values(defaultUsers).forEach(u => {
        if (u.token === token) {
          user = u;
        }
      });
      // 检查注册用户
      if (!user) {
        Object.values(registeredUsers).forEach(u => {
          if (u.token === token) {
            user = u;
          }
        });
      }

      if (!user) {
        return { code: 50008, message: '登录已过期，请重新登录' };
      }

      // 返回用户平级数据（前端需要的字段）
      return { 
        code: 20000, 
        data: {
          id: user.id,
          username: user.username,
          role: user.role, // 单个角色
          name: user.name,
          avatar: user.avatar,
          phone: user.phone || '', // 非必填字段默认空
          email: user.email || '',
          campus: user.campus || ''
        } 
      };
    }
  },

  // 用户登出
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

  // 文件上传接口
  {
    url: '/vue-admin-template/user/upload',
    type: 'post',
    response: () => {
      return {
        code: 20000,
        message: '图片上传成功',
        data: {
          url: `https://picsum.photos/400/400?random=${Math.random()}`
        }
      }
    }
  },

  // 注册接口：存储结构改为id键，平级字段
  {
    url: '/vue-admin-template/user/register',
    type: 'post',
    response: config => {
      const { username, role, password, realName, photo, phone, email, campus } = config.body;

      // 检查用户名是否已存在（默认用户或注册用户）
      const isUsernameExist = [
        ...Object.values(defaultUsers),
        ...Object.values(registeredUsers)
      ].some(user => user.username === username);

      if (isUsernameExist) {
        return { code: 60204, message: '用户名已存在' }
      }

      // 生成唯一id（用Mock生成随机id）
      const id = Mock.mock('@id');
      // 生成token
      const token = `${role}-${username}-${id}-token`;

      // 保存到注册用户表（平级字段，无info）
      registeredUsers[id] = {
        id, // 键与id字段一致
        username,
        password,
        role,
        token,
        name: realName || username, // 原info.name -> 平级name
        avatar: photo || 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif', // 原info.avatar -> 平级avatar
        phone: phone || '',
        email: email || '',
        campus: campus || '' // 按需存储校区
      };

      return {
        code: 20000,
        message: role === 'student' ? '注册成功' : '注册申请已提交',
        data: { success: true, id } // 返回注册用户的id
      };
    }
  }
]