import { constantRoutes, asyncRoutes } from '@/router'

// 过滤路由：根据用户单个角色匹配路由的 meta.roles
function filterAsyncRoutes(routes, role) { // 参数从 roles 改为 role
  const res = []
  routes.forEach(route => {
    const tmp = { ...route }
    if (hasPermission(role, tmp)) { // 传入单个角色
      if (tmp.children) {
        tmp.children = filterAsyncRoutes(tmp.children, role) // 递归过滤子路由
        if (tmp.children.length === 0) {
          delete tmp.children
        }
      }
      res.push(tmp)
    }
  })
  return res
}

// 权限判断：路由的 meta.roles 是否包含当前用户的单个角色
function hasPermission(role, route) {
  if (route.meta && route.meta.roles) {
    // 单个角色是否在路由允许的角色列表中
    console.log("hasPermission " + role)
    return route.meta.roles.includes(role)
  } else {
    // 无 meta.roles 的路由视为公共路由
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
  generateRoutes({ commit }, role) { // 参数从 roles 改为 role
    return new Promise(resolve => {
      console.log('当前用户角色:', role) 
      let accessedRoutes = filterAsyncRoutes(asyncRoutes, role) // 传入单个角色
      console.log('过滤后的路由:', accessedRoutes)
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