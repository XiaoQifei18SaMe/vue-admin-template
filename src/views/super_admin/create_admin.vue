<template>
  <div class="admin-management">
    
    <el-card class="create-form-card">
      <el-form 
        ref="adminForm" 
        :model="adminForm" 
        :rules="formRules" 
        label-width="120px"
        class="admin-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="adminForm.username" placeholder="用户名（4-16位，支持字母、数字和下划线）"></el-input>
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            :type="passwordType"
            v-model="adminForm.password"
            placeholder="密码（8-16位，包含字母、数字和特殊字符）"
          />
          <span class="show-pwd" @click="togglePasswordVisibility">
            <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
          </span>
        </el-form-item>
        
        <el-form-item label="真实姓名" prop="name">
          <el-input v-model="adminForm.name" placeholder="请输入管理员真实姓名"></el-input>
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="adminForm.phone" placeholder="请输入管理员手机号"></el-input>
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="adminForm.email" placeholder="请输入管理员邮箱（选填）"></el-input>
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            @click="submitForm"
            :loading="loading"
          >
            创建管理员
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script>
import { validUsername, validPassword, validPhone } from '@/utils/validate'
import { createAdmin } from '@/api/super_admin' // 假设API模块

export default {
  name: 'AdminCreate',
  data() {
    const validateUsername = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入用户名'))
      } else if (!validUsername(value)) {
        callback(new Error('用户名需4-16位，可以包含字母、数字和下划线'))
      } else {
        callback()
      }
    }

    const validatePassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入密码'))
      } else if (!validPassword(value)) {
        callback(new Error('密码需8-16位，包含字母、数字和特殊字符'))
      } else {
        callback()
      }
    }

    const validatePhone = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入手机号'))
      } else if (!validPhone(value)) {
        callback(new Error('请输入正确的电话号码'))
      } else {
        callback()
      }
    }

    return {
      loading: false,
      passwordType: 'password',
      adminForm: {
        username: '',
        password: '',
        name: '',
        phone: '',
        email: ''
      },
      formRules: {
        username: [
          { required: true, trigger: 'blur', validator: validateUsername }
        ],
        password: [
          { required: true, trigger: 'blur', validator: validatePassword }
        ],
        name: [
          { required: true, message: '请输入真实姓名', trigger: 'blur' }
        ],
        phone: [
          { required: true, trigger: 'blur', validator: validatePhone }
        ],
        email: [
          { required: false, type: 'email', trigger: 'blur', message: '请输入正确的邮箱格式' }
        ]
      }
    }
  },
  methods: {
    handleBack() {
      this.$router.go(-1)
    },
    togglePasswordVisibility() {
      this.passwordType = this.passwordType === 'password' ? '' : 'password'
      this.$nextTick(() => {
        this.$refs.adminForm.$el.querySelector('input[type="' + this.passwordType + '"]')?.focus()
      })
    },
    submitForm() {
      this.$refs.adminForm.validate(async (valid) => {
        if (valid) {
          this.loading = true
          try {
            const response = await createAdmin(this.adminForm)
            if (response.code === 20000) {
              this.$message.success('管理员创建成功！')
              this.resetForm()
            } else {
              this.$message.error(`创建失败：${response.message || '未知错误'}`)
            }
          } catch (error) {
            this.$message.error('网络请求失败，请稍后重试')
            console.error('创建管理员错误：', error)
          } finally {
            this.loading = false
          }
        } else {
          this.$message.warning('请完善表单信息')
          return false
        }
      })
    },
    resetForm() {
      this.$refs.adminForm.resetFields()
      this.passwordType = 'password'
    }
  }
}
</script>

<style scoped>
.admin-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
}

.create-form-card {
  margin-top: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.admin-form {
  padding: 30px;
}

.el-form-item {
  margin-bottom: 20px;
  position: relative; /* 用于密码显示图标定位 */
}

.show-pwd {
  position: absolute;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #999;
}
</style>