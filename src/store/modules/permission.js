import { constantRoutes, asyncRoutes } from '@/router'

// 过滤路由：根据用户roles匹配路由的meta.roles
function filterAsyncRoutes(routes, roles) {
  const res = []
  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(roles, tmp)) {
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, roles)
        // 若子路由过滤后为空，仍保留父路由（避免父路由消失）
        if (tmp.children.length === 0) {
          delete tmp.children // 防止空数组导致父路由不显示
        }
      }
      res.push(tmp)
    }
  })
  console.log('过滤后的完整路由结构:', res) // 确认父子层级是否完整
  return res
}

// 权限判断：路由的meta.roles是否包含用户角色（超级管理员角色['super_admin']会匹配meta.roles: ['super_admin']）
function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    // 角色匹配（只要用户有一个角色在路由roles中，就有权限）
    return roles.some(role => route.meta.roles.includes(role))
  } else {
    // 无meta.roles的路由视为公共路由（默认允许访问）
    return true
  }
}

const state = {
  routes: [], // 最终的完整路由表（constantRoutes + 过滤后的asyncRoutes）
  addRoutes: [] // 动态添加的权限路由（仅asyncRoutes）
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes // 存储动态路由
    state.routes = constantRoutes.concat(routes) // 合并公共路由和动态路由
  }
}

const actions = {
  // 生成权限路由（登录后调用，传入用户roles）
  // generateRoutes({ commit }, roles) {
  //   return new Promise(resolve => {
  //     let accessedRoutes
  //     // 过滤asyncRoutes（超级管理员['super_admin']会匹配“校园管理”路由）
  //     accessedRoutes = filterAsyncRoutes(asyncRoutes, roles)
  //     // 提交mutation，存储动态路由
  //     commit('SET_ROUTES', accessedRoutes)
  //     resolve(accessedRoutes)
  //   })
  // }
  generateRoutes({ commit }, roles) {
    return new Promise(resolve => {
      console.log('当前用户角色:', roles)  // 新增调试：超级管理员应输出 ['super_admin']
      let accessedRoutes = filterAsyncRoutes(asyncRoutes, roles)
      console.log('过滤后的路由:', accessedRoutes)  // 应输出包含"校园管理"的数组
      commit('SET_ROUTES', accessedRoutes)
      resolve(accessedRoutes)
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}