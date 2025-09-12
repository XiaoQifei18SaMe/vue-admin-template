<template>
  <div class="profile-container">
    <div class="page-header">
      <h2>个人信息维护</h2>
      <p>您可以在这里查看和更新您的个人信息</p>
      <div class="role-indicator">
        <el-tag :type="roleTagType">{{ roleLabel }}</el-tag>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-loading="loading" class="loading-container">
      <el-card class="profile-card">
        <!-- 头像上传区域 - 整合展示与上传功能 -->
        <div class="form-item">
          <div class="item-label">个人头像</div>
          <div class="item-content">
            <el-upload
              class="avatar-uploader"
              :http-request="handleAvatarUpload"
              :on-success="handleAvatarSuccess"
              :on-error="handleUploadError"
              accept="image/*"
              list-type="picture-card"
              :before-upload="beforeAvatarUpload"
              :disabled="avatarUploadDisabled || avatarUrl"
              limit="1"
              :on-exceed="handleUploadExceed"
            >
            <div v-if="avatarUrl || avatarLoading">
              <el-loading-spinner v-if="avatarLoading" class="upload-loading"></el-loading-spinner>
              <!-- 关键修改：拼接完整头像URL + 错误兜底 -->
              <img 
                v-else 
                :src="`http://localhost:8080/user-avatars/${avatarUrl}`" 
                class="avatar-img" 
                @error="handleAvatarError"  
              />
            </div>
            <i v-else class="el-icon-plus avatar-upload-icon"></i>
          </el-upload>

            <el-progress 
              v-if="avatarUploadPercentage > 0 && avatarUploadPercentage < 100"
              :percentage="avatarUploadPercentage" 
              stroke-width="2" 
              style="width: 85%; margin-top: 10px;"
            ></el-progress>
          </div>
        </div>

        <!-- 基本信息区域 -->
        <form class="profile-form" ref="profileForm">
          <!-- 用户名 -->
          <div class="form-item">
            <div class="item-label">用户名</div>
            <div class="item-content">
              <el-input v-model="userInfo.username" :disabled="true" />
            </div>
          </div>

          <!-- 密码（可选修改） -->
          <div class="form-item">
            <div class="item-label">密码</div>
            <div class="item-content">
              <el-input
                :key="passwordType"
                v-model="userInfo.password"
                :type="passwordType"
                placeholder="请输入新密码（8-16位，包含字母、数字和特殊字符，不修改请留空）"
              />
              <span class="show-pwd" @click="togglePasswordVisibility('password')">
                <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
              </span>
            </div>
          </div>

          <!-- 确认密码 -->
          <div class="form-item">
            <div class="item-label">确认密码</div>
            <div class="item-content">
              <el-input
                :key="confirmPasswordType"
                v-model="userInfo.confirmPassword"
                :type="confirmPasswordType"
                placeholder="请再次输入密码"
              />
              <span class="show-pwd" @click="togglePasswordVisibility('confirmPassword')">
                <svg-icon :icon-class="confirmPasswordType === 'password' ? 'eye' : 'eye-open'" />
              </span>
            </div>
          </div>

          <!-- 真实姓名 -->
          <div class="form-item">
            <div class="item-label">真实姓名</div>
            <div class="item-content">
              <el-input v-model="userInfo.name" />
            </div>
          </div>

          <!-- 性别 -->
          <div class="form-item">
            <div class="item-label">性别</div>
            <div class="item-content">
              <el-select v-model="userInfo.gender" placeholder="请选择性别">
                <el-option label="男" value="male" />
                <el-option label="女" value="female" />
              </el-select>
            </div>
          </div>

          <!-- 年龄 -->
          <div class="form-item">
            <div class="item-label">年龄</div>
            <div class="item-content">
              <el-input v-model="userInfo.age" type="number" min="0" max="120" />
            </div>
          </div>

          <!-- 电话 -->
          <div class="form-item">
            <div class="item-label">电话</div>
            <div class="item-content">
              <el-input v-model="userInfo.phone" type="tel" />
            </div>
          </div>

          <!-- 邮箱 -->
          <div class="form-item">
            <div class="item-label">邮箱</div>
            <div class="item-content">
              <el-input v-model="userInfo.email" type="email" />
            </div>
          </div>

          <!-- 校区（针对管理员、教练、学生） -->
          <div class="form-item" v-if="showCampusField">
            <div class="item-label">所属校区</div>
            <div class="item-content">
              <el-select v-model="userInfo.campus" placeholder="请选择校区">
                <el-option 
                  v-for="campus in campuses" 
                  :key="campus.value" 
                  :label="campus.label" 
                  :value="campus.value" 
                />
              </el-select>
            </div>
          </div>

          <!-- 教练特有字段 -->
          <template v-if="isCoach">
            <!-- 教练照片 - 整合展示与上传功能 -->
            <div class="form-item">
              <div class="item-label">教练照片</div>
              <div class="item-content">
               <el-upload
                  class="avatar-uploader"
                  :http-request="handlePhotoUpload" 
                  :on-success="handlePhotoSuccess" 
                  :on-error="handleUploadError" 
                  accept="image/*" 
                  list-type="picture-card" 
                  :before-upload="beforePhotoUpload"
                  :disabled="photoUploadDisabled || coachPhotoUrl"
                  limit="1"
                  :on-exceed="handleUploadExceed"
              >
                <div v-if="coachPhotoUrl || photoLoading">
                  <el-loading-spinner v-if="photoLoading" class="upload-loading"></el-loading-spinner>
                  <!-- 关键修改：复用教练照片URL规则 + 错误兜底 -->
                  <img 
                    v-else 
                    :src="`http://localhost:8080/coach-photos/${coachPhotoUrl}`" 
                    class="avatar-img" 
                    @error="handlePhotoError"  
                  />
                </div>
            <i v-else class="el-icon-plus avatar-upload-icon"></i>
          </el-upload>

                <el-progress 
                  v-if="photoUploadPercentage > 0 && photoUploadPercentage < 100"
                  :percentage="photoUploadPercentage" 
                  stroke-width="2" 
                  style="width: 85%; margin-top: 10px;"
                ></el-progress>
              </div>
            </div>

            <!-- 比赛成绩 -->
            <div class="form-item">
              <div class="item-label">比赛成绩</div>
              <div class="item-content">
                <el-input
                  v-model="userInfo.achievements"
                  placeholder="请输入您的比赛成绩"
                  type="textarea"
                  rows="3"
                />
              </div>
            </div>
          </template>

          <!-- 操作按钮 -->
          <div class="form-actions">
            <el-button 
              type="primary" 
              @click="handleSubmit"
              :loading="submitLoading"
            >
              保存修改
            </el-button>
            <el-button 
              @click="handleReset"
              style="margin-left: 10px"
            >
              取消
            </el-button>
          </div>
        </form>
      </el-card>
    </div>
  </div>
</template>

<script>
import { getInfo } from '@/api/user'
import { uploadFile } from '@/api/user'
import { validPhone, validUsername, validPassword} from '@/utils/validate'
export default {
  name: 'Profile',
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

    const validatePhone = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入电话号码'))
      } else if (!validPhone(value)) {
        callback(new Error('请输入正确的电话号码'))
      } else {
        callback()
      }
    }

    const validateAge = (rule, value, callback) => {
      if (value && (value < 0 || value > 120)) {
        callback(new Error('请输入有效的年龄（0-120岁）'))
      } else {
        callback()
      }
    }

    const validatePassword = (rule, value, callback) => {
      if (!value) {
        // 密码为空时不验证（允许不修改密码）
        callback()
      } else if (!validPassword(value)) {
        callback(new Error('密码需8-16位，包含字母、数字和特殊字符'))
      } else {
        // 若已输入确认密码，触发确认密码验证
        if (this.userInfo.confirmPassword) {
          this.$refs.profileForm.validateField('confirmPassword')
        }
        callback()
      }
    }

    const validateConfirmPassword = (rule, value, callback) => {
      if (!value) {
        // 确认密码为空时，只有密码不为空才验证
        if (this.userInfo.password) {
          callback(new Error('请确认密码'))
        } else {
          callback()
        }
      } else if (value !== this.userInfo.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    return {
      // 用户信息
      userInfo: {
        username: '',
        password: '',       // 密码字段（可选修改）
        confirmPassword: '', // 确认密码字段
        name: '',
        gender: '',
        age: '',
        phone: '',
        email: '',
        campus: '',
        avatar: '', // 头像字段
        photo: '',  // 教练照片
        achievements: ''
      },
      // 密码显示类型
      passwordType: 'password',
      confirmPasswordType: 'password',
      // 校区列表
      campuses: [
        { label: '总校区', value: 'main' },
        { label: '东校区', value: 'east' },
        { label: '西校区', value: 'west' },
        { label: '南校区', value: 'south' },
        { label: '北校区', value: 'north' }
      ],
      // 表单验证规则
      formRules: {
        username: [
          { required: true, trigger: 'blur', validator: validateUsername }
        ],
        password: [
          { trigger: 'blur', validator: validatePassword }
        ],
        confirmPassword: [
          { trigger: 'blur', validator: validateConfirmPassword }
        ],
        name: [
          { required: true, trigger: 'blur', message: '请输入真实姓名' }
        ],
        phone: [
          { required: true, trigger: 'blur', validator: validatePhone }
        ],
        email: [
          { type: 'email', trigger: 'blur', message: '请输入正确的邮箱地址' }
        ],
        age: [
          { trigger: ['blur', 'change'], validator: validateAge }
        ],
        campus: [
          { required: true, trigger: 'change', message: '请选择校区' }
        ],
        avatar: [
          { 
            required: true, 
            trigger: 'change', 
            message: '请上传个人头像', 
            validator: (rule, value, callback) => {
              // 已有头像或已上传新头像都算有效
              if (!value && !this.avatarUrl) {
                callback(new Error('请上传个人头像'))
              } else {
                callback()
              }
            }
          }
        ],
        photo: [
          { 
            required: this.isCoach, 
            trigger: 'change',
            validator: (rule, value, callback) => {
              if (this.isCoach && !value && !this.coachPhotoUrl) {
                callback(new Error('请上传教练照片'))
              } else {
                callback()
              }
            }
          }
        ],
        achievements: [
          { required: this.isCoach, trigger: 'blur', validator: (rule, value, callback) => {
                if (this.isCoach && !value) {
                  callback(new Error('请输入比赛成绩'))
                } else {
                  callback()
                }
              }
          }
        ]
      },
      // 头像上传相关
      avatarUrl: '',
      avatarUploadPercentage: 0,
      avatarLoading: false,       // 头像上传独立loading
      avatarUploadDisabled: false, // 头像上传禁用状态
      
      // 教练照片上传相关
      coachPhotoUrl: '',
      photoLoading: false,        // 照片上传独立loading
      photoUploadPercentage: 0,
      photoUploadDisabled: false,  // 照片上传禁用状态
      
      // 提交状态
      submitLoading: false,
      loading: false
    }
  },
  computed: {
    // 当前用户角色信息（从Vuex获取）
    currentUser() {
      return this.$store.getters.userInfo || this.$store.state.user // 兼容不同存储方式
    },
    // 角色标签文本
    roleLabel() {
      const roleMap = {
        'super_admin': '超级管理员',
        'admin': '管理员',
        'coach': '教练',
        'student': '学员'
      }
      return roleMap[this.currentUser.role] || '未知角色'
    },
    // 角色标签类型
    roleTagType() {
      const typeMap = {
        'super_admin': 'warning',
        'admin': 'primary',
        'coach': 'success',
        'student': 'info'
      }
      return typeMap[this.currentUser.role] || 'default'
    },
    // 是否为教练
    isCoach() {
      return this.currentUser.role === 'coach'
    },
    // 是否为超级管理员
    isSuperAdmin() {
      return this.currentUser.role === 'super_admin'
    },
    // 是否显示校区字段（超级管理员不显示）
    showCampusField() {
      return !this.isSuperAdmin
    }
  },
  created() {
    this.getUserInfo()
  },
  methods: {
    // 获取用户信息
    getUserInfo() {
      this.loading = true
      console.log("getinfo发送: " + this.currentUser.token)
      getInfo(this.currentUser.token).then(response => {
        const { data } = response
        this.userInfo = { ...this.userInfo, ...data }
        console.log(data.avatar)
        console.log(data.photoPath)
        this.userInfo.confirmPassword = this.userInfo.password
        
        // 关键修改：仅存储图片文件名（后端返回的avatar/photo应是文件名，如"123.jpg"）
        this.avatarUrl = data.avatar || ''  // 假设data.avatar是文件名（如"user123.jpg"）
        this.coachPhotoUrl = data.photoPath || ''  // 假设data.photo是文件名（如"coach456.jpg"）
        
        this.loading = false
      }).catch(error => {
        this.$message.error('获取用户信息失败：' + (error.message || '未知错误'))
        this.loading = false
      })
    },

    // 切换密码显示状态
    togglePasswordVisibility(type) {
      if (type === 'password') {
        this.passwordType = this.passwordType === 'password' ? '' : 'password'
      } else {
        this.confirmPasswordType = this.confirmPasswordType === 'password' ? '' : 'password'
      }
      this.$nextTick(() => {
        const inputRef = type === 'password' ? 'password' : 'confirmPassword'
        this.$refs[inputRef]?.focus()
      })
    },

    // 处理表单提交
    async handleSubmit() {
      this.$refs.profileForm.validate(async (valid) => {
        if (valid) {
          this.submitLoading = true
          try {
            // 过滤不需要提交的字段
            const submitData = { ...this.userInfo }
            delete submitData.confirmPassword
            // 调用action更新个人信息
            const response = await this.$store.dispatch('user/updateProfile', submitData)
            this.$message.success('个人信息更新成功')
            // 重新获取最新用户信息
            await this.$store.dispatch('user/getInfo')
            // 刷新页面数据
            this.getUserInfo()
          } catch (error) {
            this.$message.error('更新失败：' + (error.message || '未知错误'))
          } finally {
            this.submitLoading = false
          }
        }
      })
    },

    // 重置表单
    handleReset() {
      this.$refs.profileForm.resetFields()
      // 清空图片URL
      this.avatarUrl = ''
      this.coachPhotoUrl = ''
      this.getUserInfo() // 恢复原始数据
    },

    // 超过上传数量处理
    handleUploadExceed(files, uploadList) {
      this.$message.warning('最多只能上传1张图片')
    },

    // 头像上传相关
    handleAvatarUpload(options) {
      this.avatarLoading = true
      this.avatarUploadPercentage = 0
      
      const formData = new FormData()
      formData.append('file', options.file)
      
      uploadFile(formData).then(response => {
        this.avatarLoading = false
        this.avatarUploadPercentage = 100
        options.onSuccess(response)
        setTimeout(() => {
          this.avatarUploadPercentage = 0
        }, 1000)
      }).catch(error => {
        this.avatarLoading = false
        options.onError(error)
      })
    },

    // 2. 头像上传成功 - 仅存储文件名（后端返回的url应是文件名）
    handleAvatarSuccess(response) {
      // 关键修改：假设后端返回 { data: { url: "user123.jpg" } }（仅文件名）
      const imgFileName = response.data.url  
      this.userInfo.avatar = imgFileName  // 存储文件名到表单
      this.avatarUrl = imgFileName        // 用于回显的文件名
      this.$message.success('头像上传成功')
    },

    beforeAvatarUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isImage) {
        this.$message.error('仅支持 JPG、PNG、GIF 格式的图片！')
      }
      if (!isLt2M) {
        this.$message.error('图片大小不能超过 2MB！')
      }
      return isImage && isLt2M
    },

    // 教练照片上传相关
    handlePhotoUpload(options) {
      this.photoLoading = true
      this.photoUploadPercentage = 0
      
      const formData = new FormData()
      formData.append('file', options.file)
      
      uploadFile(formData).then(response => {
        this.photoLoading = false
        this.photoUploadPercentage = 100
        options.onSuccess(response)
        setTimeout(() => {
          this.photoUploadPercentage = 0
        }, 1000)
      }).catch(error => {
        this.photoLoading = false
        options.onError(error)
      })
    },

   // 3. 教练照片上传成功 - 仅存储文件名
    handlePhotoSuccess(response) {
      // 关键修改：假设后端返回 { data: { url: "coach456.jpg" } }（仅文件名）
      const imgFileName = response.data.url  
      this.userInfo.photoPath = imgFileName   // 存储文件名到表单
      this.coachPhotoUrl = imgFileName    // 用于回显的文件名
      this.$message.success('照片上传成功')
    },

    handleUploadError(error) {
      this.$message.error('上传失败：' + (error.message || '未知错误'))
    },

    // 4. 头像加载失败 - 显示默认图
    handleAvatarError(e) {
      e.target.src = '/default-avatar.gif'  // 需在前端public目录放置默认头像
    },

    // 5. 教练照片加载失败 - 显示默认图（复用教练审核页面的默认图）
    handlePhotoError(e) {
      e.target.src = '/default-coach.png'  // 需在前端public目录放置默认教练图
    },

    beforePhotoUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif'
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isImage) {
        this.$message.error('仅支持 JPG、PNG、GIF 格式的图片！')
      }
      if (!isLt2M) {
        this.$message.error('图片大小不能超过 2MB！')
      }
      return isImage && isLt2M
    }
  }
}
</script>

<style lang="scss" scoped>
.profile-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

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

.role-indicator {
  margin-top: 5px;
}

.loading-container {
  min-height: 500px;
}

.profile-card {
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.profile-form {
  padding: 20px;
}

.form-item {
  background-color: rgba(240, 247, 255, 0.8);
  border-radius: 12px;
  padding: 15px 20px;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-start;
  
  &:hover {
    background-color: rgba(224, 236, 255, 0.9);
    transform: translateX(4px);
  }
}

.item-label {
  flex-shrink: 0;
  width: 100px;
  font-weight: 600;
  color: #1890ff;
  margin-right: 15px;
  padding-right: 15px;
  border-right: 1px solid rgba(24, 144, 255, 0.2);
  padding-top: 5px;
}

.item-content {
  flex-grow: 1;
  position: relative;
  
  ::v-deep .el-input,
  ::v-deep .el-select {
    width: 100%;
    max-width: 500px;
  }
}

.form-actions {
  margin-top: 30px;
  text-align: center;
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

.avatar-uploader {
  width: 120px;
  height: 120px;
  position: relative;
  
  ::v-deep .el-upload {
    width: 100%;
    height: 100%;
  }
  
  ::v-deep .el-upload--picture-card {
    width: 100%;
    height: 100%;
    border-radius: 6px;
  }
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 6px;
}

.avatar-upload-icon {
  font-size: 28px;
  color: #8c939d;
  width: 120px;
  height: 120px;
  text-align: center;
  line-height: 120px;
}

.upload-loading {
  line-height: 120px;
  text-align: center;
}

::v-deep .el-textarea__inner {
  min-height: 100px;
  resize: vertical;
}
</style>
