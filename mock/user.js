const Mock = require('mockjs') // 引入Mock用于生成随机ID

// 1. 系统默认用户（初始数据）：用id作为键，所有字段平级存放
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
    age: '45',
    gender: '男',
    phone: '13800138000', // 原info中的phone
    email: 'super@example.com', // 原info中的email
    campus: 'main'
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
    age: '',
    gender: '',
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
    avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
    age: '',
    gender: '',
    phone: '13700137000', // 补充学生电话
    email: 'wang_student@example.com', // 补充学生邮箱
    campus: 'west' // 补充学生所属校区
  },
  // 教练（id: 4）
  '4': {
    id: '4',
    username: 'coach_K',
    password: 'cccc3333@',
    role: 'coach',
    token: 'coach-token',
    name: '教练K',
    avatar: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
    age: '',
    gender: '',
    phone: '13600136000', // 补充教练电话
    email: 'k_coach@example.com', // 补充教练邮箱
    campus: 'south', // 补充教练所属校区
    photo: 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
    achievements: '2023年市乒乓球比赛冠军' // 教练特有字段
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
    
  // 获取用户信息接口：适配新结构（平级字段）
  {
    url: '/info',
    type: 'get',
    response: config => {
      const { token } = config.query;

      // 从默认用户中通过token查找
      let userInfo = Object.values(defaultUsers).find(user => user.token === token);
      // 从注册用户中通过token查找
      if (!userInfo) {
        userInfo = Object.values(registeredUsers).find(user => user.token === token);
      }

      // 若找到用户，返回平级字段（无需嵌套info）
      if (userInfo) {
        return { 
          code: 20000, 
          data: {
            role: userInfo.role,
            id: userInfo.id,
            username: userInfo.username,
            name: userInfo.name,
            password: userInfo.password,
            avatar: userInfo.avatar,
            age: userInfo.age,
            gender: userInfo.gender,
            phone: userInfo.phone,
            email: userInfo.email,
            campus: userInfo.campus,
            achievements: userInfo.achievements // 教练特有字段
          } 
        };
      }

      // 未找到用户
      return { code: 50008, message: '登录已过期，请重新登录' };
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

  // 注册接口（适配新用户结构）
  {
    url: '/vue-admin-template/user/register',
    type: 'post',
    response: config => {
      const { username, role, password, realName, phone, email, campus, achievements } = config.body;

      // 1. 验证用户名是否已存在（默认用户或注册用户）
      const isUsernameExist = 
        Object.values(defaultUsers).some(user => user.username === username) ||
        Object.values(registeredUsers).some(user => user.username === username);
      
      if (isUsernameExist) {
        return { code: 60204, message: '用户名已存在' }
      }

      // 2. 生成新用户ID（模拟数据库自增ID）
      const newId = String(Math.max(...Object.keys(defaultUsers).map(Number), ...Object.keys(registeredUsers).map(Number), 0) + 1);

      // 3. 保存注册用户（与默认用户结构一致）
      registeredUsers[newId] = {
        id: newId,
        username,
        password,
        role,
        token: `${role}-${username}-${newId}-token`, // 生成唯一token
        name: realName || username,
        avatar: config.body.photo || 'https://wpimg.wallstcn.com/f778738c-e4f8-4870-b634-56703b4acafe.gif',
        phone: phone || '',
        email: email || '',
        campus: campus || '', // 学生/教练/校区管理员需关联校区
        achievements: role === 'coach' ? achievements : '' // 仅教练保留该字段
      };

      // 4. 返回注册成功响应
      return {
        code: 20000,
        message: role === 'student' ? '注册成功' : '注册申请已提交',
        data: { success: true }
      };
    }
  },

  // mock/user.js 中添加以下接口
{
  url: '/profile/update',
  type: 'post',
  response: config => {
    const { id, ...updateData } = config.body; // 提取id和其他更新字段（排除id）
    
    // 查找用户（同时检查默认用户和注册用户）
    let user = null;
    
    // 检查默认用户（根据id匹配）
    Object.values(defaultUsers).forEach(u => {
      if (u.id === id) {
        user = u;
      }
    });
    
    // 检查注册用户
    if (!user) {
      Object.values(registeredUsers).forEach(u => {
        if (u.id === id) {
          user = u;
        }
      });
    }

    // 用户不存在处理
    if (!user) {
      return { code: 50008, message: '用户不存在' };
    }

    // 允许修改所有字段（除id外）
    // 遍历更新字段并赋值（只更新传入的字段）
    Object.keys(updateData).forEach(key => {
      // 排除id字段，其他字段均可更新
      if (key !== 'id' && user.hasOwnProperty(key)) {
        user[key] = updateData[key];
        console.log(updateData[key]);
      }
    });

    return {
      code: 20000,
      message: '信息更新成功',
      data: { success: true }
    }
  }
  }
  // {
  //   url: '/profile/update',
  //   type: 'post',
  //   response: config => {
  //     const { token, ...updateData } = config.body;
  //     let user = null;
  
  //     // 检查默认用户（根据id匹配）
  //     Object.values(defaultUsers).forEach(u => {
  //       if (u.id === id) {
  //         user = u;
  //       }
  //     });
      
  //     // 检查注册用户
  //     if (!user) {
  //       Object.values(registeredUsers).forEach(u => {
  //         if (u.id === id) {
  //           user = u;
  //         }
  //       });
  //     }
  
  //     if (!user) {
  //       return { code: 50008, message: '用户不存在' };
  //     }
  
  //     // 3. 合并更新用户信息（仅更新传递的字段，保留其他原有字段）
  //     user.info = { ...user.info, ...updateData }; // ✅ 核心修复
  
  //     return { code: 20000, data: { success: true } };
  //   }
  // }
]