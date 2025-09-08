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
    url: '/vue-admin-template/campus/list',
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
    url: '/vue-admin-template/campus/admins',
    type: 'get',
    response: () => ({
      code: 20000,
      data: adminList
    })
  },

  // 3. 创建校区（新增功能：添加到模拟数据）
  {
    url: '/vue-admin-template/campus/create',
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

  // 4. 更新校区（编辑功能：修改模拟数据）
  {
    url: '/vue-admin-template/campus/update/.+',
    type: 'post',
    response: config => {
      // 从URL中提取ID（例如 /update/123 → 123）
      const id = config.url.split('/').pop()
      const updateData = config.body // 前端提交的更新数据
      const index = findCampusIndex(id)
      
      if (index !== -1) {
        // 找到对应校区并更新数据
        campusData.items[index] = {
          ...campusData.items[index],
          ...updateData,
          // 更新管理员信息
          admin: adminList.find(a => a.id === updateData.adminId) || campusData.items[index].admin
        }
        return {
          code: 20000,
          data: { success: true }
        }
      }
      
      return {
        code: 50000,
        data: { success: false, message: '校区不存在' }
      }
    }
  },

  // 5. 删除校区（删除功能：从模拟数据中移除）
  {
    url: '/vue-admin-template/campus/delete/.+',
    type: 'post',
    response: config => {
      const id = config.url.split('/').pop()
      const index = findCampusIndex(id)
      
      if (index !== -1) {
        campusData.items.splice(index, 1) // 从数组中删除
        return {
          code: 20000,
          data: { success: true }
        }
      }
      
      return {
        code: 50000,
        data: { success: false, message: '校区不存在' }
      }
    }
  }
]