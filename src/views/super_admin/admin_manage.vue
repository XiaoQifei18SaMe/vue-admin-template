<template>
  <div class="admin-management">
    <!-- 新增的标题和提示文本 -->
    <div class="page-header">
      <h2>管理员管理</h2>
      <p>您可以在这里查看、新增、编辑和删除系统管理员</p>
    </div>
    
    <el-card class="admin-card">
      <div class="card-header">
        <el-button type="primary" @click="handleAdd">新增管理员</el-button>
      </div>
      
      <el-table 
        :data="adminList" 
        border 
        stripe 
        :loading="tableLoading"
        style="width: 100%; margin-top: 15px"
      >
        <el-table-column prop="id" label="管理员ID" width="80" align="center"></el-table-column>
        <el-table-column prop="username" label="用户名" min-width="150"></el-table-column>
        <el-table-column prop="name" label="姓名" min-width="120"></el-table-column>
        <el-table-column prop="phone" label="联系电话" min-width="130"></el-table-column>
        <el-table-column prop="email" label="联系邮箱" min-width="180"></el-table-column>
        <el-table-column label="操作" width="180" align="center">
          <template #default="scope">
            <el-button 
              type="primary" 
              size="small" 
              @click="handleEdit(scope.row)"
              icon="Edit"
            >编辑</el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="handleDelete(scope.row)"
              icon="Delete"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 管理员表单弹窗 -->
    <el-dialog 
      :title="dialogTitle" 
      :visible.sync="dialogVisible" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="adminForm" 
        :model="formData" 
        :rules="formRules" 
        label-width="120px"
        class="admin-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input 
            v-model="formData.username" 
            placeholder="请输入用户名"
            :disabled="!!formData.id"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input 
            :key="passwordType"
            v-model="formData.password" 
            :type="passwordType" 
            placeholder="请输入新密码（8-16位，含字母、数字、特殊字符）"
          ></el-input>
          <span class="show-pwd" @click="togglePasswordVisibility('password')">
            <i :class="passwordType === 'password' ? 'el-icon-view' : 'el-icon-hide'"></i>
          </span>
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input 
            :key="confirmPasswordType"
            v-model="formData.confirmPassword" 
            :type="confirmPasswordType" 
            placeholder="请再次输入密码"
          ></el-input>
          <span class="show-pwd" @click="togglePasswordVisibility('confirmPassword')">
            <i :class="confirmPasswordType === 'password' ? 'el-icon-view' : 'el-icon-hide'"></i>
          </span>
        </el-form-item>
        
        <el-form-item label="姓名" prop="name">
          <el-input v-model="formData.name" placeholder="请输入管理员姓名"></el-input>
        </el-form-item>
        
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="formData.phone" placeholder="请输入联系电话"></el-input>
        </el-form-item>
        
        <el-form-item label="联系邮箱" prop="email">
          <el-input v-model="formData.email" placeholder="请输入联系邮箱（选填）"></el-input>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getAdmins, createAdmin, updateAdmin, deleteAdmin } from '@/api/super_admin'
import { validPhone, validPassword, validUsername } from '@/utils/validate'

export default {
  name: 'AdminManagement',
  data() {
    const validatePhone = (rule, value, callback) => {
      if (value && !validPhone(value)) {
        callback(new Error('请输入正确的电话号码'))
      } else {
        callback()
      }
    }

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
        callback()
      } else if (!validPassword(value)) {
        callback(new Error('密码需8-16位，包含字母、数字和特殊字符'))
      } else {
        if (this.formData.confirmPassword) {
          this.$refs.adminForm.validateField('confirmPassword')
        }
        callback()
      }
    }

    const validateConfirmPassword = (rule, value, callback) => {
      if (!value) {
        if (this.formData.password) {
          callback(new Error('请确认密码'))
        } else {
          callback()
        }
      } else if (value !== this.formData.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    return {
      tableLoading: false,
      adminList: [],
      dialogVisible: false,
      dialogTitle: '新增管理员',
      passwordType: 'password',
      confirmPasswordType: 'password',
      formData: {
        id: null,
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        email: ''
      },
      formRules: {
        username: [
          { required: true, trigger: 'blur', validator: validateUsername },
          { max: 20, message: '用户名最长20个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, trigger: 'blur', validator: validatePassword }
        ],
        confirmPassword: [
          { required: true, trigger: 'blur', validator: validateConfirmPassword }
        ],
        name: [
          { required: true, message: '请输入姓名', trigger: 'blur' },
          { max: 20, message: '姓名最长20个字符', trigger: 'blur' }
        ],
        phone: [
          { required: true, message: '请输入联系电话', trigger: 'blur' },
          { validator: validatePhone, trigger: 'blur' }
        ],
        email: [
          { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.fetchAdmins()
  },
  methods: {
    togglePasswordVisibility(type) {
      if (type === 'password') {
        this.passwordType = this.passwordType === 'password' ? 'text' : 'password'
      } else {
        this.confirmPasswordType = this.confirmPasswordType === 'password' ? 'text' : 'password'
      }
      this.$nextTick(() => {
        const inputDom = document.querySelector(`.admin-form .el-form-item:nth-child(${type === 'password' ? 2 : 3}) .el-input__inner`)
        inputDom && inputDom.focus()
      })
    },

    async fetchAdmins() {
      this.tableLoading = true
      try {
        const response = await getAdmins()
        if (response.code === 20000) {
          this.adminList = response.data
        } else {
          this.$message.error(`获取管理员列表失败：${response.message}`)
        }
      } catch (error) {
        this.$message.error('获取管理员列表失败，请稍后重试')
        console.error('获取管理员列表错误：', error)
      } finally {
        this.tableLoading = false
      }
    },

    handleAdd() {
      this.dialogTitle = '新增管理员'
      this.passwordType = 'password'
      this.confirmPasswordType = 'password'
      this.formData = {
        id: null,
        username: '',
        password: '',
        confirmPassword: '',
        name: '',
        phone: '',
        email: ''
      }
      this.dialogVisible = true
      this.$nextTick(() => {
        this.$refs.adminForm.resetFields()
      })
    },

    handleEdit(row) {
      this.dialogTitle = '编辑管理员'
      this.passwordType = 'password'
      this.confirmPasswordType = 'password'
      this.formData = { 
        ...row,
        confirmPassword: row.password
      }
      this.dialogVisible = true
    },

    async submitForm() {
      this.$refs.adminForm.validate(async (valid) => {
        if (valid) {
          try {
            let response
            const submitData = { ...this.formData }
            delete submitData.confirmPassword
            
            if (this.formData.id) {
              delete submitData.username;
              
              const originalAdmin = this.adminList.find(item => item.id === this.formData.id)
              if (submitData.password === originalAdmin.password) {
                delete submitData.password
              }
              response = await updateAdmin(submitData)
            } else {
              response = await createAdmin(submitData)
            }

            if (response.code === 20000) {
              this.$message.success(this.formData.id ? '管理员更新成功' : '管理员创建成功')
              this.dialogVisible = false
              this.fetchAdmins()
            } else {
              this.$message.error(`${this.formData.id ? '更新' : '创建'}失败：${response.message}`)
            }
          } catch (error) {
            this.$message.error(`${this.formData.id ? '更新' : '创建'}管理员失败，请稍后重试`)
            console.error('管理员操作错误：', error)
          }
        }
      })
    },

    async handleDelete(row) {
      this.$confirm(`确定要删除管理员【${row.username}】吗？`, '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await deleteAdmin(row.id)
          if (response.code === 20000) {
            this.$message.success('管理员删除成功')
            this.fetchAdmins()
          } else {
            this.$message.error(`删除失败：${response.message}`)
          }
        } catch (error) {
          this.$message.error('删除管理员失败，请稍后重试')
          console.error('删除管理员错误：', error)
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    }
  }
}
</script>

<style lang = "scss" scoped>
.admin-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 64px);
}

/* 新增的标题样式 */
.page-header {
  margin-bottom: 20px;
  
  h2 {
    margin: 0 0 10px 0;
    font-size: 18px;
    color: #333;
  }
  
  p {
    margin: 0 0 10px 0;
    color: #666;
  }
}

.admin-card {
  margin-top: 20px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: flex-end;
  padding: 15px 20px 0;
}

.admin-form {
  margin-top: 15px;
}

.el-form-item {
  margin-bottom: 18px;
  position: relative;
}

.show-pwd {
  position: absolute;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #999;
  z-index: 10;
}
</style>
