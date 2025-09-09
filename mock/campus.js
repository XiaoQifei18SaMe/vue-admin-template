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

// 更新校区接口（相对路径正则）
{
  url: /^\/campus\/update\/.*$/, // 匹配 /campus/update/任意ID
  type: 'post',
  response: config => {
    // 防御性处理：确保 url 存在
    if (!config.url) {
      return { code: 50000, message: 'URL 解析失败', data: { success: false } }
    }
    // 提取 ID（兼容相对路径，如 /campus/update/123）
    const urlParts = config.url.split('/').filter(part => part); // 过滤空字符串
    const id = urlParts.pop() || ''; // 取最后一段
    const updateData = config.body;

    const index = campusData.items.findIndex(item => item.id === id);
    if (index !== -1) {
      const admin = adminList.find(a => a.id === Number(updateData.adminId));
      campusData.items[index] = {
        ...campusData.items[index],
        ...updateData,
        admin: admin || { realName: '未知', phone: '未知' }
      };
      return { code: 20000, data: { success: true } };
    }
    return { code: 50000, message: '校区不存在', data: { success: false } };
  }
},

// 删除校区接口（相对路径正则）
{
  url: /^\/campus\/delete\/.*$/, // 匹配 /campus/delete/任意ID
  type: 'post',
  response: config => {
    if (!config.url) { // 防御性处理
      return { code: 50000, message: 'URL 解析失败', data: { success: false } }
    }
    const urlParts = config.url.split('/').filter(part => part);
    const id = urlParts.pop() || '';
    const index = campusData.items.findIndex(item => item.id === id);
    
    if (index !== -1) {
      campusData.items.splice(index, 1);
      return { code: 20000, data: { success: true } };
    }
    return { code: 50000, message: '校区不存在', data: { success: false } };
  }
}

]