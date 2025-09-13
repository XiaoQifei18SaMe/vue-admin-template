import { login, logout, getInfo } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import { resetRouter } from '@/router'
import { updateProfile } from '@/api/user'

const getDefaultState = () => {
  return {
    token: getToken(),
    name: '',
    avatar: '',
    role: ''// （关键！用于权限判断）
  }
}

const state = getDefaultState()

const mutations = {
  RESET_STATE: (state) => {
    Object.assign(state, getDefaultState())
  },
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  // 2. 新增：设置用户角色的mutation
  SET_ROLE: (state, role) => {
    state.role = role
  }
}

// const actions = {
//   // user login
//   login({ commit }, userInfo) {
//     const { username, password } = userInfo
//     return new Promise((resolve, reject) => {
//       login({ username: username.trim(), password: password }).then(response => {
//         const { data } = response
//         commit('SET_TOKEN', data.token)
//         setToken(data.token)
//         resolve()
//       }).catch(error => {
//         reject(error)
//       })
//     })
//   },
const actions = {
  // user login
  // 将原来的解构赋值改为传递整个 userInfo
  login({ commit }, userInfo) {
    // 移除解构，直接使用 userInfo
    return new Promise((resolve, reject) => {
      login(userInfo).then(response => { // 直接传递整个 userInfo
        const { data } = response
        commit('SET_TOKEN', data)
        console.log("login返回" + data)
        setToken(data)
        this._vm.$message.success('登录成功')
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },



  // // get user info
  // getInfo({ commit, state }) {
  //   return new Promise((resolve, reject) => {
  //     getInfo(state.token).then(response => {
  //       const { data } = response

  //       if (!data) {
  //         return reject('Verification failed, please Login again.')
  //       }

  //       const { name, avatar } = data

  //       commit('SET_NAME', name)
  //       commit('SET_AVATAR', avatar)
  //       resolve(data)
  //     }).catch(error => {
  //       reject(error)
  //     })
  //   })
  // },
  // get user info（核心修改：获取并存储角色信息）
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      getInfo(state.token).then(response => {
        const { data } = response

        if (!data) {
          return reject('Verification failed, please Login again.')
        }

        // 3. 从接口返回数据中提取角色信息（关键！）
        const { username, avatar, role } = data
        console.log("getinfo返回" + data)
        // 4. 存储角色信息（用于permission.js过滤路由）
        commit('SET_ROLE', role)
        console.log("vuex存储role: " + role)
        commit('SET_NAME', username)
        commit('SET_AVATAR', avatar)
        
        // 5. 将完整用户信息返回（供登录后调用generateRoutes使用）
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  },

  // user logout
  logout({ commit, state }) {
    return new Promise((resolve, reject) => {
      logout(state.token).then(() => {
        removeToken() // must remove  token  first
        resetRouter()
        commit('RESET_STATE')
         // 增加登出成功提示
        this._vm.$message.success('登出成功，即将返回登录页') // 若在Vue组件中可直接用this.$message
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      removeToken() // must remove  token  first
      commit('RESET_STATE')
      resolve()
    })
  },

  // 新增：更新个人信息
  updateProfile({ commit }, { userInfo, role }) {
    return new Promise((resolve, reject) => {
      // 调用更新个人信息的API，传入角色参数
      updateProfile(userInfo, role).then(response => {
        const { data } = response
        if (!data) {
          return reject('更新失败，请重试')
        }
        // 更新store中的用户信息
        commit('SET_NAME', userInfo.name)
        commit('SET_AVATAR', userInfo.avatar || data.avatar)
        resolve(response)
      }).catch(error => {
        reject(error)
      })
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

