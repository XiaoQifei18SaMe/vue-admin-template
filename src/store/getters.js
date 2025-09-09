const getters = {
  sidebar: state => state.app.sidebar,
  device: state => state.app.device,
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  name: state => state.user.name,
  role: state => state.user.role, // 原为 roles: state => state.user.roles
  'permission/routes': state => state.permission.routes
}
export default getters
