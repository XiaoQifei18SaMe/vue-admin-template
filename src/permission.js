import router from './router'
import store from './store'
import { Message } from 'element-ui'
import NProgress from 'nprogress' // progress bar
import 'nprogress/nprogress.css' // progress bar style
import { getToken } from '@/utils/auth' // get token from cookie
import getPageTitle from '@/utils/get-page-title'

NProgress.configure({ showSpinner: false }) // NProgress Configuration

const whiteList = ['/login','/register','/register/pending'] // no redirect whitelist

// router.beforeEach(async(to, from, next) => {
//   // start progress bar
//   NProgress.start()

//   // set page title
//   document.title = getPageTitle(to.meta.title)

//   // determine whether the user has logged in
//   const hasToken = getToken()

//   if (hasToken) {
//     if (to.path === '/login') {
//       // if is logged in, redirect to the home page
//       next({ path: '/' })
//       NProgress.done()
//     } else {
//       const hasGetUserInfo = store.getters.name
//       if (hasGetUserInfo) {
//         next()
//       } else {
//         try {
//           // get user info
//           await store.dispatch('user/getInfo')

//           next()
//         } catch (error) {
//           // remove token and go to login page to re-login
//           await store.dispatch('user/resetToken')
//           Message.error(error || 'Has Error')
//           next(`/login?redirect=${to.path}`)
//           NProgress.done()
//         }
//       }
//     }
//   } else {
//     /* has no token*/

//     if (whiteList.indexOf(to.path) !== -1) {
//       // in the free login whitelist, go directly
//       next()
//     } else {
//       // other pages that do not have permission to access are redirected to the login page.
//       next(`/login?redirect=${to.path}`)
//       NProgress.done()
//     }
//   }
// })

// 修改 vue-admin-template/src/permission.js 的 router.beforeEach 部分
router.beforeEach(async (to, from, next) => {
  NProgress.start()
  document.title = getPageTitle(to.meta.title)
  const hasToken = getToken()

  if (hasToken) {
    if (to.path === '/login') {
      next({ path: '/' })
      NProgress.done()
    } else {
      // 关键修改：同时检查name和role是否存在（避免仅靠name判断的漏洞）
      const hasGetUserInfo = store.getters.name && store.getters.role
      if (hasGetUserInfo) {
        next()
      } else {
        try {
          // 1. 获取用户信息（确保后端返回role）
          const userInfo = await store.dispatch('user/getInfo')
          const { role } = userInfo 

          // 2. 新增：校验role是否存在，不存在则抛错进入catch
          if (!role) {
            throw new Error('未获取到用户角色信息')
          }
          
          // 3. 根据角色生成路由
          const accessedRoutes = await store.dispatch('permission/generateRoutes', role)
          
          // 4. 动态添加路由（Vue Router 3用addRoutes，4+用addRoute循环添加）
          router.addRoutes(accessedRoutes)
          
          // 5. 避免重复触发守卫：用replace确保不会再次进入当前钩子
          next({ ...to, replace: true })
        } catch (error) {
          // 出错时清除token，强制跳转登录
          await store.dispatch('user/resetToken')
          Message.error(error.message || '获取用户信息失败，请重新登录')
          next(`/login?redirect=${to.path}`)
          NProgress.done()
        }
      }
    }
  } else {
    if (whiteList.indexOf(to.path) !== -1) {
      next()
    } else {
      next(`/login?redirect=${to.path}`)
      NProgress.done()
    }
  }
})


router.afterEach(() => {
  // finish progress bar
  NProgress.done()
})

// // 过滤路由：只保留当前用户角色有权访问的路由
// function filterAsyncRoutes(routes, roles) {
//   const res = []
//   routes.forEach(route => {
//     const tmp = { ...route }
//     // 1. 路由无roles限制，直接放行
//     if (!tmp.meta || !tmp.meta.roles) {
//       res.push(tmp)
//     }
//     // 2. 路由有roles限制，检查当前用户角色是否包含在内
//     else if (roles.some(role => tmp.meta.roles.includes(role))) {
//       // 递归过滤子路由
//       if (tmp.children) {
//         tmp.children = filterAsyncRoutes(tmp.children, roles)
//       }
//       res.push(tmp)
//     }
//   })
//   return res
// }



