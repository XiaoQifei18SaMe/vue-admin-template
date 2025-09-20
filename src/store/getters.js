const getters = {
  sidebar: state => state.app.sidebar,
  device: state => state.app.device,
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  name: state => state.user.name,
  role: state => state.user.role,
  userId: state => state.user.userId,
  schoolId: state => state.user.schoolId,
  realname: state => state.user.realname,
  userType: state => state.user.userType,
  'permission/routes': state => state.permission.routes
}
export default getters
