<template>
  <div class="login-container">
    <el-form ref="loginForm" :model="loginForm" :rules="loginRules" class="login-form" auto-complete="on" label-position="left">

      <div class="title-container">
        <h3 class="title">乒乓球培训系统</h3>
      </div>

      <el-form-item prop="username">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          ref="username"
          v-model="loginForm.username"
          placeholder="用户名（4-16位），仅支持字母数字下划线"
          name="username"
          type="text"
          tabindex="1"
          auto-complete="on"
        />
      </el-form-item>

      <el-form-item prop="password">
        <span class="svg-container">
          <svg-icon icon-class="password" />
        </span>
        <el-input
          :key="passwordType"
          ref="password"
          v-model="loginForm.password"
          :type="passwordType"
          placeholder="密码（8-16位），必须包含字母数字及特殊字符"
          name="password"
          tabindex="2"
          auto-complete="on"
          @keyup.enter.native="handleLogin"
        />
        <span class="show-pwd" @click="showPwd">
          <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
        </span>
      </el-form-item>

      <!-- 新增角色选择下拉框 -->
      <el-form-item prop="role">
        <span class="svg-container">
          <svg-icon icon-class="role" /> <!-- 可自行添加角色图标 -->
        </span>
        <el-select v-model="loginForm.role" placeholder="请选择角色">
          <el-option label="超级管理员" value="super_admin" /> 
          <el-option label="校区管理员" value="campus_admin" /> 
          <el-option label="学生" value="student" />
          <el-option label="教练" value="coach" />
        </el-select>
      </el-form-item>

      <el-button :loading="loading" type="primary" style="width:100%;margin-bottom:30px;" @click.native.prevent="handleLogin">登录</el-button>

      <div class="tips">
        <span>用户1: super_admin / super123@ / 超级管理员</span><br>
        <span>用户2: campus_admin / campus123@ / 校区管理员</span><br>
        <span>用户3: student_wang / bbbb2222@ / 学生</span><br>
        <span>用户3: coach_K / cccc3333@ / 教练</span>
         <span class="register-tip">没有账号？
          <span class="register-link" @click="handleToRegister">点击注册</span>
        </span>
      </div>

    </el-form>
  </div>
</template>

<script>
import { validUsername , validPassword} from '@/utils/validate'

export default {
  name: 'Login',
  // data() {
  //   const validateUsername = (rule, value, callback) => {
  //     if (!validUsername(value)) {
  //       callback(new Error('Please enter the correct user name'))
  //     } else {
  //       callback()
  //     }
  //   }
  //   const validatePassword = (rule, value, callback) => {
  //     if (value.length < 6) {
  //       callback(new Error('The password can not be less than 6 digits'))
  //     } else {
  //       callback()
  //     }
  //   }
  //   return {
  //     loginForm: {
  //       username: 'admin',
  //       password: '111111'
  //     },
  //     loginRules: {
  //       username: [{ required: true, trigger: 'blur', validator: validateUsername }],
  //       password: [{ required: true, trigger: 'blur', validator: validatePassword }]
  //     },
  //     loading: false,
  //     passwordType: 'password',
  //     redirect: undefined
  //   }
  // },
  data() {
    const validateUsername = (rule, value, callback) => {
        if(!value){
          callback(new Error('请输入用户名'))
        }else if (!validUsername(value)) {
          callback(new Error('用户名需4-16位，可以包含字母、数字和下划线'))
        } else {
          callback()
        }
    }
    // 密码验证：8-16位，包含字母、数字、特殊字符
    const validatePassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入密码'))
      } else if (!validPassword(value)) {
        callback(new Error('密码需8-16位，包含字母、数字和特殊字符'))
      } else {
        callback()
      }
    }

    return {
      loginForm: {
        username: 'super_admin',
        password: 'super123@',
        role: 'super_admin' // 新增角色字段
      },
      loginRules: {
        username: [
          { required: true, trigger: 'blur', validator: validateUsername }
        ],
        password: [
          { required: true, trigger: 'blur', validator: validatePassword }
        ],
        role: [
          { required: true, trigger: 'change', message: '请选择角色' } // 角色必填验证
        ]
      },
      loading: false,
      passwordType: 'password',
      redirect: undefined
    }
  },
  watch: {
    $route: {
      handler: function(route) {
        this.redirect = route.query && route.query.redirect
      },
      immediate: true
    }
  },
  methods: {
    showPwd() {
      if (this.passwordType === 'password') {
        this.passwordType = ''
      } else {
        this.passwordType = 'password'
      }
      this.$nextTick(() => {
        this.$refs.password.focus()
      })
    },
    // handleLogin() {
    //   this.$refs.loginForm.validate(valid => {
    //     if (valid) {
    //       this.loading = true
    //       this.$store.dispatch('user/login', this.loginForm).then(() => {
    //         this.$router.push({ path: this.redirect || '/' })
    //         this.loading = false
    //       }).catch(() => {
    //         this.loading = false
    //       })
    //     } else {
    //       console.log('error submit!!')
    //       return false
    //     }
    //   })
    // },
    handleLogin() {
      this.$refs.loginForm.validate(async (valid) => {
        if (valid) {
          this.loading = true // 保留原有loading状态
          try {
            // 1. 原有登录逻辑：获取token
            await this.$store.dispatch('user/login', this.loginForm)
            
            // 2. 新增：获取用户信息（含roles）
            const userInfo = await this.$store.dispatch('user/getInfo')
            
            // 3. 新增：生成权限路由
            const accessedRoutes = await this.$store.dispatch('permission/generateRoutes', userInfo.roles)
            
            // 4. 新增：动态添加路由
            this.$router.addRoutes(accessedRoutes)
            
            // 5. 原有跳转逻辑（保留redirect参数）
            this.$router.push({ path: this.redirect || '/' })
          } catch (error) {
            // 保留原有错误处理
            console.error('登录失败', error)
          } finally {
            // 无论成功失败，都关闭loading（保留原有逻辑）
            this.loading = false
          }
        } else {
          // 保留原有表单验证失败逻辑
          console.log('error submit!!')
          return false
        }
      })
  },
    
    
    // 新增：跳转到注册页面的方法
    handleToRegister() {
       console.log("触发注册跳转"); // 新增日志，查看控制台是否输出
    // 路由跳转前先清空可能的表单状态（避免残留状态影响）
    this.$refs.loginForm && this.$refs.loginForm.resetFields();
    // 路由跳转（你的路由配置正确，直接用即可）
    this.$router.push("/register");
    }
  }
}
</script>

<style lang="scss">
/* 修复input 背景不协调 和光标变色 */
/* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */

$bg:#283443;
$light_gray:#fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}

/* reset element-ui css */
.login-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

    input {
      background: transparent;
      border: 0px;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: $light_gray;
      height: 47px;
      caret-color: $cursor;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px $bg inset !important;
        -webkit-text-fill-color: $cursor !important;
      }
    }
  }

  .el-form-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    color: #454545;
  }

  /* 修复el-select下拉三角形位置 */
  .el-select {
    width: 85%;
    
    .el-input {
      width: 100%;
    }
    
    .el-input__suffix {
      right: 0px;
    }
  }
}
</style>

<style lang="scss" scoped>
$bg:#2d3a4b;
$dark_gray:#889aa4;
$light_gray:#eee;
$primary-color: #409EFF; // 复用element-ui主题色，保持风格统一

.login-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  overflow: hidden;

  .login-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 160px 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  // .tips {
  //   font-size: 14px;
  //   color: #fff;
  //   margin-bottom: 10px;

  //   span {
  //     &:first-of-type {
  //       margin-right: 16px;
  //     }
  //   }
  // }
   .tips {
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;
    line-height: 1.8; // 增加行高，避免文字拥挤

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }

    // 新增：注册提示文字样式
    .register-tip {
      display: block; // 独占一行，提升可读性
      margin-top: 8px;
    }

    // 新增：注册链接样式（hover效果+主题色）
    .register-link {
      color: $primary-color;
      cursor: pointer;
      margin-left: 4px;

      &:hover {
        text-decoration: underline; //  hover时下划线，增强交互提示
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      font-weight: bold;
    }
  }

  .show-pwd {
    position: absolute;
    right: 40px;
    top: 7px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }

  
}
</style>

