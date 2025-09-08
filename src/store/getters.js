const getters = {
  sidebar: state => state.app.sidebar,
  device: state => state.app.device,
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  name: state => state.user.name,
  roles: state => state.user.roles,  // 从 user 模块的 state 中获取 roles
  'permission/routes': state => state.permission.routes
}
export default getters
