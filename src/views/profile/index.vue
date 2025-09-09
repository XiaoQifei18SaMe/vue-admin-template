<!-- 个人信息维护页面：@/views/profile/index.vue -->
<template>
  <div class="profile-container">
    <el-card>
      <div slot="header" class="card-header">
        <h2>个人信息维护</h2>
        <p>您可以在这里查看和更新您的个人信息</p>
      </div>

      <el-form 
        ref="profileForm" 
        :model="userInfo" 
        :rules="formRules" 
        label-width="120px"
        class="profile-form"
      >
        <!-- 头像上传（所有用户可见） -->
        <el-form-item label="个人头像" prop="avatar">
          <el-upload
            class="avatar-uploader"
            :http-request="handleAvatarUpload"
            :on-success="handleAvatarSuccess"
            :on-error="handleUploadError"
            :on-preview="handleAvatarPreview"
            :file-list="avatarList"
            accept="image/*"
            list-type="picture-card"
            :before-upload="beforeAvatarUpload"
            :disabled="avatarUploadDisabled"
          >
            <i v-if="!avatarLoading && !avatarList.length" class="el-icon-plus"></i>
            <img v-else-if="!avatarLoading && avatarList.length" :src="avatarList[0].url" class="avatar-img" />
            <el-loading-spinner v-else class="upload-loading"></el-loading-spinner>
          </el-upload>

          <el-progress 
            v-if="avatarUploadPercentage > 0 && avatarUploadPercentage < 100"
            :percentage="avatarUploadPercentage" 
            stroke-width="2" 
            style="width: 85%; margin-top: 10px;"
          ></el-progress>
          
          <el-dialog :visible.sync="avatarDialogVisible" title="头像预览" width="30%">
            <img width="100%" :src="previewAvatarUrl" alt="个人头像">
          </el-dialog>
        </el-form-item>

        <!-- 用户名 -->
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userInfo.username" />
        </el-form-item>

        <!-- 密码（可选修改） -->
        <el-form-item label="密码" prop="password">
            <el-input
                :key="passwordType"
                v-model="userInfo.password"
                :type="passwordType"
                placeholder="请输入新密码（8-16位，包含字母、数字和特殊字符，不修改请留空）"
            />
            <span class="show-pwd" @click="togglePasswordVisibility('password')">
                <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
            </span>
        </el-form-item>

        <!-- 确认密码 -->
        <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
                :key="confirmPasswordType"
                v-model="userInfo.confirmPassword"
                :type="confirmPasswordType"
                placeholder="请再次输入密码"
            />
            <span class="show-pwd" @click="togglePasswordVisibility('confirmPassword')">
                <svg-icon :icon-class="confirmPasswordType === 'password' ? 'eye' : 'eye-open'" />
            </span>
        </el-form-item>

        <!-- 真实姓名 -->
        <el-form-item label="真实姓名" prop="name">
          <el-input v-model="userInfo.name" />
        </el-form-item>

        <!-- 性别 -->
        <el-form-item label="性别" prop="gender">
          <el-select v-model="userInfo.gender" placeholder="请选择性别">
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>

        <!-- 年龄 -->
        <el-form-item label="年龄" prop="age">
          <el-input v-model="userInfo.age" type="number" min="0" max="120" />
        </el-form-item>

        <!-- 电话 -->
        <el-form-item label="电话" prop="phone">
          <el-input v-model="userInfo.phone" type="tel" />
        </el-form-item>

        <!-- 邮箱 -->
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userInfo.email" type="email" />
        </el-form-item>

        <!-- 校区（针对管理员、教练、学生） -->
        <el-form-item label="所属校区" prop="campus" v-if="showCampusField">
          <el-select v-model="userInfo.campus" placeholder="请选择校区">
            <el-option 
              v-for="campus in campuses" 
              :key="campus.value" 
              :label="campus.label" 
              :value="campus.value" 
            />
          </el-select>
        </el-form-item>

        <!-- 教练特有字段 -->
        <template v-if="isCoach">
          <!-- 教练照片 -->
          <el-form-item label="教练照片" prop="photo">
            <el-upload
              class="upload-demo"
              :http-request="handlePhotoUpload" 
              :on-success="handlePhotoSuccess" 
              :on-error="handleUploadError" 
              :on-preview="handlePhotoPreview" 
              :file-list="fileList" 
              accept="image/*" 
              list-type="picture-card" 
              :before-upload="beforePhotoUpload"
              :disabled="photoUploadDisabled"
            >
              <i v-if="!photoLoading" class="el-icon-plus"></i>
              <el-loading-spinner v-else class="upload-loading"></el-loading-spinner>
            </el-upload>

            <el-progress 
              v-if="photoUploadPercentage > 0 && photoUploadPercentage < 100"
              :percentage="photoUploadPercentage" 
              stroke-width="2" 
              style="width: 85%; margin-top: 10px;"
            ></el-progress>
            
            <el-dialog :visible.sync="photoDialogVisible" title="照片预览" width="30%">
              <img width="100%" :src="previewPhotoUrl" alt="教练照片">
            </el-dialog>
          </el-form-item>

          <!-- 比赛成绩 -->
          <el-form-item label="比赛成绩" prop="achievements">
            <el-input
              v-model="userInfo.achievements"
              placeholder="请输入您的比赛成绩"
              type="textarea"
              rows="3"
            />
          </el-form-item>
        </template>

        <!-- 操作按钮 -->
        <el-form-item>
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
        </el-form-item>
      </el-form>
    </el-card>
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
      // 密码显示类型（移到data根级别）
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
          { required: false, trigger: 'blur', validator: validateUsername }
        ],
        password: [
          { trigger: 'blur', validator: validatePassword }
        ],
        confirmPassword: [
          { trigger: 'blur', validator: validateConfirmPassword }
        ],
        name: [
          { required: false, trigger: 'blur', message: '请输入真实姓名' }
        ],
        phone: [
          { required: false, trigger: 'blur', validator: validatePhone }
        ],
        email: [
          { type: 'email', trigger: 'blur', message: '请输入正确的邮箱地址' }
        ],
        age: [
          { trigger: ['blur', 'change'], validator: validateAge }
        ],
        campus: [
          { required: false, trigger: 'change', message: '请选择校区' }
        ],
        avatar: [
          { required: false, trigger: 'change', message: '请上传个人头像', validator: (rule, value, callback) => {
                // 已有头像或已上传新头像都算有效
                if (!value && this.avatarList.length === 0) {
                  callback(new Error('请上传个人头像'))
                } else {
                  callback()
                }
              }
          }
        ],
        photo: [
          { required: false, trigger: 'change', validator: (rule, value, callback) => {
                if (this.isCoach && !value && this.fileList.length === 0) {
                  callback(new Error('请上传教练照片'))
                } else {
                  callback()
                }
              }
          }
        ],
        achievements: [
          { required: false, trigger: 'blur', validator: (rule, value, callback) => {
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
      avatarList: [],
      avatarUploadPercentage: 0,
      avatarDialogVisible: false,
      previewAvatarUrl: '',
      avatarLoading: false,       // 头像上传独立loading
      avatarUploadDisabled: false, // 头像上传禁用状态
      
      // 教练照片上传相关
      fileList: [],
      photoLoading: false,        // 照片上传独立loading
      photoUploadPercentage: 0,
      photoUploadDisabled: false,  // 照片上传禁用状态
      photoDialogVisible: false,
      previewPhotoUrl: '',
      
      // 提交状态
      submitLoading: false
    }
  },
  computed: {
    // 当前用户角色信息（从Vuex获取）
    currentUser() {
      return this.$store.getters.userInfo || this.$store.state.user // 兼容不同存储方式
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
      getInfo(this.currentUser.token).then(response => {
        const { data } = response
        this.userInfo = { ...this.userInfo, ...data }
        console.log(this.userInfo.campus)
        this.userInfo.confirmPassword = this.userInfo.password
        // 初始化头像列表
        if (this.userInfo.avatar) {
          this.avatarList = [{
            url: this.userInfo.avatar,
            name: '个人头像'
          }]
        }
        // 初始化教练照片列表
        if (this.userInfo.photo) {
          this.fileList = [{
            url: this.userInfo.photo,
            name: '教练照片'
          }]
        }
      }).catch(error => {
        this.$message.error('获取用户信息失败：' + (error.message || '未知错误'))
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
          // 关键修改：通过store.dispatch调用action，仿照handleLogin
          const response = await this.$store.dispatch('user/updateProfile', submitData)
          this.$message.success('个人信息更新成功')
          // 重新获取最新用户信息（可选，根据实际需求）
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
      this.getUserInfo() // 恢复原始数据
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

    handleAvatarSuccess(response) {
      this.userInfo.avatar = response.data.url
      this.avatarList = [{
        url: response.data.url,
        name: '个人头像'
      }]
      this.$message.success('头像上传成功')
    },

    handleAvatarPreview(file) {
      this.previewAvatarUrl = file.url
      this.avatarDialogVisible = true
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

    handlePhotoSuccess(response) {
      this.userInfo.photo = response.data.url
      this.fileList = [{
        url: response.data.url,
        name: '教练照片'
      }]
      this.$message.success('照片上传成功')
    },

    handleUploadError(error) {
      this.$message.error('上传失败：' + (error.message || '未知错误'))
    },

    handlePhotoPreview(file) {
      this.previewPhotoUrl = file.url
      this.photoDialogVisible = true
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
}

.card-header {
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  
  h2 {
    margin: 0 0 10px 0;
    font-size: 20px;
    color: #333;
  }
  
  p {
    margin: 0;
    color: #666;
  }
}

.profile-form {
  margin-top: 30px;
  max-width: 800px;
}

::v-deep .el-form-item {
  margin-bottom: 20px;
}

::v-deep .upload-demo,
::v-deep .avatar-uploader {
  display: inline-block;
  margin-left: 10px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-loading {
  line-height: 100px;
  text-align: center;
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