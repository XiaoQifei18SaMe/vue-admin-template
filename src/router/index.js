import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

/* Layout */
import Layout from '@/layout'
import { title } from '@/settings'

/**
 * Note: sub-menu only appear when route children.length >= 1
 * Detail see: https://panjiachen.github.io/vue-element-admin-site/guide/essentials/router-and-nav.html
 *
 * hidden: true                   if set true, item will not show in the sidebar(default is false)
 * alwaysShow: true               if set true, will always show the root menu
 *                                if not set alwaysShow, when item has more than one children route,
 *                                it will becomes nested mode, otherwise not show the root menu
 * redirect: noRedirect           if set noRedirect will no redirect in the breadcrumb
 * name:'router-name'             the name is used by <keep-alive> (must set!!!)
 * meta : {
    roles: ['admin','editor']    control the page roles (you can set multiple roles)
    title: 'title'               the name show in sidebar and breadcrumb (recommend set)
    icon: 'svg-name'/'el-icon-x' the icon show in the sidebar
    breadcrumb: false            if set false, the item will hidden in breadcrumb(default is true)
    activeMenu: '/example/list'  if set path, the sidebar will highlight the path you set
  }
 */

/**
 * constantRoutes
 * a base page that does not have permission requirements
 * all roles can be accessed
 */
export const constantRoutes = [
  {
    path: '/login',
    component: () => import('@/views/login/index'),
    hidden: true
  },

  {
    path: '/register',
    component: () => import('@/views/register/index'),//注册页面
    hidden: true
  },

  {
    path: '/register/pending',
    component: () => import('@/views/register/pending'), // 等待审核页面
    hidden: true
  },

  {
    path: '/404',
    component: () => import('@/views/404'),
    hidden: true
  },

  {
    path: '/',
    redirect: '/dashboard',
    component: Layout,
    children: [{
      path: 'dashboard',
      name: 'Dashboard',
      component: () => import('@/views/dashboard/index'),
      meta: { title: 'Dashboard', icon: 'dashboard' }
    }]
  },

  // {
  //   path: '/example',
  //   component: Layout,
  //   redirect: '/example/table',
  //   name: 'Example',
  //   meta: { title: 'Example', icon: 'el-icon-s-help' },
  //   children: [
  //     {
  //       path: 'table',
  //       name: 'Table',
  //       component: () => import('@/views/table/index'),
  //       meta: { title: 'Table', icon: 'table' }
  //     },
  //     {
  //       path: 'tree',
  //       name: 'Tree',
  //       component: () => import('@/views/tree/index'),
  //       meta: { title: 'Tree', icon: 'tree' }
  //     }
  //   ]
  // },

  // {
  //   path: '/form',
  //   component: Layout,
  //   children: [
  //     {
  //       path: 'index',
  //       name: 'Form',
  //       component: () => import('@/views/form/index'),
  //       meta: { title: 'Form', icon: 'form' }
  //     }
  //   ]
  // },
  {
    path: '/profile',
    component: Layout,
    hidden: false, // 显示在侧边栏
    children: [
      {
        path: 'index',
        name: 'Profile',
        component: () => import('@/views/profile/index'), // 指向个人信息页面
        meta: {
          title: '个人信息', // 侧边栏显示的标题
          icon: 'user', // 侧边栏图标（使用 Element UI 内置图标）
        }
      }
    ]
  },

  {
    path: '/nested',
    component: Layout,
    redirect: '/nested/menu1',
    name: 'Nested',
    meta: {
      title: 'Nested',
      icon: 'nested'
    },
    children: [
      {
        path: 'menu1',
        component: () => import('@/views/nested/menu1/index'), // Parent router-view
        name: 'Menu1',
        meta: { title: 'Menu1' },
        children: [
          {
            path: 'menu1-1',
            component: () => import('@/views/nested/menu1/menu1-1'),
            name: 'Menu1-1',
            meta: { title: 'Menu1-1' }
          },
          {
            path: 'menu1-2',
            component: () => import('@/views/nested/menu1/menu1-2'),
            name: 'Menu1-2',
            meta: { title: 'Menu1-2' },
            children: [
              {
                path: 'menu1-2-1',
                component: () => import('@/views/nested/menu1/menu1-2/menu1-2-1'),
                name: 'Menu1-2-1',
                meta: { title: 'Menu1-2-1' }
              },
              {
                path: 'menu1-2-2',
                component: () => import('@/views/nested/menu1/menu1-2/menu1-2-2'),
                name: 'Menu1-2-2',
                meta: { title: 'Menu1-2-2' }
              }
            ]
          },
          {
            path: 'menu1-3',
            component: () => import('@/views/nested/menu1/menu1-3'),
            name: 'Menu1-3',
            meta: { title: 'Menu1-3' }
          }
        ]
      },
      {
        path: 'menu2',
        component: () => import('@/views/nested/menu2/index'),
        name: 'Menu2',
        meta: { title: 'menu2' }
      }
    ]
  },

  // {
  //   path: 'external-link',
  //   component: Layout,
  //   children: [
  //     {
  //       path: 'https://panjiachen.github.io/vue-element-admin-site/#/',
  //       meta: { title: 'External Link', icon: 'link' }
  //     }
  //   ]
  // },

  // 404 page must be placed at the end !!!
  // { path: '*', redirect: '/404', hidden: true }
]

// 权限路由（需按角色过滤）
export const asyncRoutes = [
  {
    path: '/super_admin/admin_manage',
    component: Layout,
    meta: {
      roles: ['super_admin']
    },
    children: [
      {
        path: '',
        component: () => import('@/views/super_admin/admin_manage'),
        meta: { title: '管理员管理' ,icon: 'user'}
      }

    ]

  },
  {
    path: '/super_admin/school_manage',
    component: Layout,
    meta: { 
      roles: ['super_admin'] // 仅超级管理员可见
    },
    children: [
      { 
        path: '',  // 默认路由
        component: () => import('@/views/super_admin/school_manage'), 
        meta: { title: '校区管理', icon: 'campus' } 
      }
    ]
  },
  {
    path: '/admin/coach_audit',
    component: Layout,
    meta: {
      roles: ['super_admin','admin']
    },
    children: [{
      path: '',
      component: () => import('@/views/admin/coach_audit'),
      meta: { title: '教练审核', icon: 'user' }
    }]
  },

  // 1. 超级管理员专属：校区管理
  // {
  //   path: '/campusold',
  //   component: Layout,
  //   name: 'CampusManagement',
  //   meta: { 
  //     title: '校区管理', 
  //     icon: 'campus',
  //     roles: ['super_admin'] // 仅超级管理员可见
  //   },
  //   children: [
  //     { path: 'list', component: () => import('@/views/campusold/list'), meta: { title: '校区列表', icon : 'campus'} },
  //     { path: 'create', component: () => import('@/views/campusold/create'), meta: { title: '创建校区', icon : 'campus'} },
  //     { path: 'edit/:id', component: () => import('@/views/campusold/edit'), meta: { title: '编辑校区', icon : 'campus'} }
  //   ]
  // },
  // 2. 管理员通用：个人信息管理
  {
    path: '/admin',
    component: Layout,
    name: 'AdminManagement',
    meta: { 
      title: '管理员中心', 
      icon: 'user',
      roles: ['admin', 'campus_admin'] // 超级管理员和校区管理员可见
    },
    children: [
      { path: 'profile', component: () => import('@/views/admin/profile'), meta: { title: '个人信息' } },
      { 
        path: 'list', 
        component: () => import('@/views/admin/list'), 
        meta: { 
          title: '管理员列表',
          roles: ['admin'] // 仅超级管理员可见
        } 
      }
    ]
  },

  {
    path: '/student/coach_select',
    component: Layout,
    meta: {
      roles: ['student']
    },
    children: [{
      path: '',
      component: () => import('@/views/student/coach_select'),
      meta: { title: '选择教练', icon: 'role' }
    }]
  },

  {
    path: '/coach/student_audit',
    component: Layout,
    meta: {
      roles: ['coach']
    },
    children: [{
      path: '',
      component: () => import('@/views/coach/student_audit'),
      meta: { title: '审核学生', icon: 'role' }
    }]

  },

  {
    path: '/student',
    component: Layout,
    meta: {
      roles: ['student']
    },
    children: [
      {
        path: 'recharge',
        name: 'StudentRecharge',
        component: () => import('@/views/student/recharge'),
        meta: { title: '账户充值', icon: 'money-wallet' }
      }
    ]
  },

  {
    path: '/schedule',
    component: Layout,
    meta: {
      roles: ['super_admin', 'admin']
    },
    children: [
      {
        path: '',
        name: 'ScheduleManagement',
        component: () => import('@/views/schedule/index'),
        meta: { 
          title: '课表管理', icon: 'table',
        }
      }
    ]
  },

  {
    path: '/student/course-booking',
    component: Layout,
    meta: {
      roles: ['student']
    },
    children: [
      {
        path: '',
        name: 'CourseBooking',
        component: () => import('@/views/student/course_booking'),
        meta: { title: '课程预约', roles: ['student'], icon: 'user' }
      }
    ]
  },

  {
    path: '/coach/appointment-manage',
    component: Layout,
    meta: {
      roles: ['coach']
    },
    children: [
      {
        path: '',
        name: 'AppointmentManage',
        component: () => import('@/views/coach/appointment_manage'),
        meta: { title: '预约管理', roles: ['coach'], icon: 'user'}
      }
    ]
  },
  
  // 404 page must be placed at the end !!!
  { path: '*', redirect: '/404', hidden: true }
]
const createRouter = () => new Router({
  // mode: 'history', // require service support
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes,asyncRoutes
})

const router = createRouter()

// Detail see: https://github.com/vuejs/vue-router/issues/1234#issuecomment-357941465
export function resetRouter() {
  const newRouter = createRouter()
  router.matcher = newRouter.matcher // reset router
}

export default router
