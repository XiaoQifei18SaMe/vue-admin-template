const Mock = require('mockjs')

// 全局模拟数据（单次会话内保持修改状态）
let campusData = Mock.mock({
  'items|10': [{
    id: '@id', // 随机ID
    name: '@city 校区',
    location: '@county',
    tableCount: '@integer(5, 30)',
    'admin|1': [
      { id: 1, realName: '张三', phone: '13800138000' },
      { id: 2, realName: '李四', phone: '13900139000' }
    ]
  }]
})

// 模拟管理员列表
const adminList = [
  { id: 1, realName: '张三', phone: '13800138000' },
  { id: 2, realName: '李四', phone: '13900139000' },
  { id: 3, realName: '王五', phone: '13700137000' }
]

// 工具函数：根据ID查找校区索引
const findCampusIndex = (id) => {
  return campusData.items.findIndex(item => item.id === id)
}

module.exports = [
  // 1. 获取校区列表（不变）
  {
    url: '/campus/list',
    type: 'get',
    response: config => {
      const { page = 1, size = 10 } = config.query
      const items = campusData.items
      const total = items.length
      const paginatedItems = items.slice((page - 1) * size, page * size)
      return {
        code: 20000,
        data: { total, items: paginatedItems }
      }
    }
  },

  // 2. 获取管理员列表（不变）
  {
    url: '/campus/admins',
    type: 'get',
    response: () => ({
      code: 20000,
      data: adminList
    })
  },

  // 3. 创建校区（新增功能：添加到模拟数据）
  {
    url: '/campus/create',
    type: 'post',
    response: config => {
      const newCampus = config.body // 获取前端提交的表单数据
      // 生成新ID并添加到模拟数据
      newCampus.id = Mock.mock('@id')
      // 补充管理员信息（根据adminId匹配真实姓名和电话）
      const admin = adminList.find(a => a.id === newCampus.adminId)
      newCampus.admin = admin ? { ...admin } : { realName: '未知', phone: '未知' }
      // 添加到列表
      campusData.items.unshift(newCampus) // 新增项放最前面
      return {
        code: 20000,
        data: { success: true, id: newCampus.id }
      }
    }
  },

  {
    url: '/campus/update/:id', // 明确用 :id 定义路径参数
    type: 'post',
    response: config => {
      // 1. 从 Mock 原生参数中获取 ID（可靠，避免 split 解析错误）
      const id = config.params.id; // 关键修复：用 config.params.id 替代 split
      const updateData = config.body;
      console.log(id)

      // 2. 查找校区（确保 ID 类型一致，Mock 生成的 id 是字符串，直接比较）
      const index = campusData.items.findIndex(item => item.id === id);
      
      if (index !== -1) {
        // 3. 匹配管理员信息（确保 adminId 类型一致，前端传递的是数字，adminList 是数字 ID）
        const admin = adminList.find(a => a.id === Number(updateData.adminId));
        campusData.items[index] = {
          ...campusData.items[index],
          ...updateData,
          admin: admin || { realName: '未知', phone: '未知' }
        };
        return {
          code: 20000,
          data: { success: true }
        };
      }

      return {
        code: 50000,
        message: '校区不存在', // 明确错误信息，方便前端排查
        data: { success: false }
      }
    }
  },

  // 5. 修复：删除校区接口（同更新接口的 ID 解析方式）
  {
    url: '/campus/delete/:id', // 明确路径参数
    type: 'post',
    response: config => {
      // 1. 可靠获取 ID
      const id = config.params.id;
      const index = campusData.items.findIndex(item => item.id === id);
      
      if (index !== -1) {
        campusData.items.splice(index, 1);
        return {
          code: 20000,
          data: { success: true }
        };
      }

      return {
        code: 50000,
        message: '校区不存在',
        data: { success: false }
      }
    }
  }

]