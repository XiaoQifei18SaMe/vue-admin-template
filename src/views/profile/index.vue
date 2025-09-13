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
        <!-- 头像上传区域 -->
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
              :disabled="avatarLoading || avatarUploadDisabled" 
              limit="1"
              :on-exceed="handleUploadExceed"
            >
              <!-- 1. 头像预览/删除层（hover显示删除图标） -->
              <div 
                v-if="!isAvatarDeleted || avatarLoading || isAvatarDeleted"  
                class="avatar-preview-container"
              >
                <!-- 加载中 -->
                <el-loading-spinner v-if="avatarLoading" class="upload-loading"></el-loading-spinner>
                <!-- 头像预览（修改src逻辑） -->
                <img 
                  v-else 
                  :src="avatarUrl ? `http://localhost:8080/user-avatars/${avatarUrl}` : '/default-avatar.gif'"  
                  class="avatar-img" 
                  @error="handleAvatarError"  
                />
                <!-- 删除图标（hover显示） -->
                <div class="avatar-delete-icon" @click.stop="handleAvatarDelete">
                  <i class="el-icon-delete"></i>
                </div>
              </div>

              <!-- 2. 无头像/已删除时，显示「上传加号」 -->
              <div v-else class="avatar-upload-placeholder">
                <i class="el-icon-plus avatar-upload-icon"></i>
              </div>
            </el-upload>

            <el-progress 
              v-if="avatarUploadPercentage > 0 && avatarUploadPercentage < 100"
              :percentage="avatarUploadPercentage" 
              stroke-width="2" 
              style="width: 85%; margin-top: 10px;"
            ></el-progress>
          </div>
        </div>

        <!-- 关键修改：将form改为el-form并绑定规则 -->
        <el-form 
          class="profile-form" 
          ref="profileForm" 
          :model="userInfo" 
          :rules="formRules"
          label-width="100px"
        >
          <!-- 用户名 -->
          <el-form-item label="用户名" prop="username">
            <el-input v-model="userInfo.username" :disabled="true" />
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
            <div class="form-item">
              <div class="item-label">教练照片</div>
              <div class="item-content">
                <el-upload
                  class="photo-uploader" 
                  :http-request="handlePhotoUpload" 
                  :on-success="handlePhotoSuccess" 
                  :on-error="handleUploadError" 
                  accept="image/*" 
                  list-type="picture-card" 
                  :before-upload="beforePhotoUpload"
                  :disabled="photoLoading || photoUploadDisabled" 
                  limit="1"
                  :on-exceed="handleUploadExceed"
                >
                  <!-- 1. 教练照片预览/删除层（hover显示删除图标） -->
                  <div 
                    v-if="(coachPhotoUrl && !isPhotoDeleted) || photoLoading" 
                    class="photo-preview-container" 
                  >
                    <!-- 加载中 -->
                    <el-loading-spinner v-if="photoLoading" class="upload-loading"></el-loading-spinner>
                    <!-- 教练照片预览 -->
                    <img 
                      v-else 
                      :src="`http://localhost:8080/coach-photos/${coachPhotoUrl}`" 
                      class="avatar-img"
                      @error="handlePhotoError"  
                    />
                    <!-- 教练照片删除图标（hover显示） -->
                    <div class="photo-delete-icon" @click.stop="handlePhotoDelete"> <!-- 改类名+绑定删除方法 -->
                      <i class="el-icon-delete"></i>
                    </div>
                  </div>

                  <!-- 2. 无照片/已删除时，显示「上传加号」 -->
                  <div v-else class="photo-upload-placeholder"> <!-- 改类名：适配教练照片占位样式 -->
                    <i class="el-icon-plus avatar-upload-icon"></i> <!-- 复用加号图标样式 -->
                  </div>
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
            <el-form-item label="比赛成绩" prop="description">
              <el-input
                v-model="userInfo.description"
                placeholder="请输入您的比赛成绩"
                type="textarea"
                rows="3"
              />
            </el-form-item>
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
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
// 引入必要的API
import { getInfo, uploadAvatar, uploadCoachPhoto } from '@/api/user'
import { validPhone, validUsername, validPassword} from '@/utils/validate'

export default {
  name: 'Profile',
  data() {
    // 验证规则保持不变
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
        password: '',
        confirmPassword: '',
        name: '',
        gender: '',
        age: '',
        phone: '',
        email: '',
        campus: '',
        avatar: '',
        photoPath: '',  // 修正字段名与后端一致
        description: ''
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
            required: false, // 明确设为非必填
            trigger: 'change', 
            message: '头像可选，若上传请选择有效图片' // 可选提示，非强制
          }
        ],
        // 2. 教练照片规则：强化「删除后必须上传」的校验
        photoPath: [
          { 
            required: this.isCoach, // 仅教练角色需要校验
            trigger: ['change', 'blur', 'submit'], // 多触发时机，确保删除后立即校验
            validator: (rule, value, callback) => {
              // 逻辑：教练角色下，若「已删除原有照片」或「从未上传过照片」→ 强制上传
              console.log("isCoach " + this.isCoach);
              console.log("isDel " + this.isPhotoDeleted);
              if (this.isCoach) {
                // 已删除原有照片：isPhotoDeleted=true（无论是否有旧图）
                // 从未上传过：无表单值（value为空）且无预览地址（coachPhotoUrl为空）
                if (this.isPhotoDeleted || (!value && !this.coachPhotoUrl)) {
                  callback(new Error('教练照片不能为空，请上传新照片'));
                } else {
                  callback();
                }
              } else {
                console.log("不校验？？？？？")
                callback(); // 非教练角色，不校验
              }
            }
          }
        ],
        description: [
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
      avatarLoading: false,
      avatarUploadDisabled: false,
      isAvatarDeleted: false, // 新增：标记头像是否被临时删除
      
      // 教练照片上传相关
      coachPhotoUrl: '',
      photoLoading: false,
      photoUploadPercentage: 0,
      photoUploadDisabled: false,
      isPhotoDeleted: false, // 新增：标记教练照片是否被临时删除
      
      // 提交状态
      submitLoading: false,
      loading: false
    }
  },
  computed: {
    currentUser() {
      return this.$store.getters.userInfo || this.$store.state.user
    },
    roleLabel() {
      const roleMap = {
        'super_admin': '超级管理员',
        'admin': '管理员',
        'coach': '教练',
        'student': '学员'
      }
      return roleMap[this.currentUser.role] || '未知角色'
    },
    roleTagType() {
      const typeMap = {
        'super_admin': 'warning',
        'admin': 'primary',
        'coach': 'success',
        'student': 'info'
      }
      return typeMap[this.currentUser.role] || 'default'
    },
    isCoach() {
      return this.currentUser.role === 'coach'
    },
    isSuperAdmin() {
      return this.currentUser.role === 'super_admin'
    },
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
      getInfo(this.currentUser.token).then(response => {
        const { data } = response
        this.userInfo = { ...this.userInfo, ...data }
        console.log("密码" + data.password)
        this.userInfo.confirmPassword = data.password
        this.avatarUrl = data.avatar || ''
        this.isAvatarDeleted = false // 初始化：未删除
        this.coachPhotoUrl = data.photoPath || ''
        this.isPhotoDeleted = false // 初始化：未删除
        console.log("描述" + data.description)
        console.log("真实姓名" + data.name)
        console.log("确认密码" + this.confirmPassword)
        this.loading = false
      }).catch(error => {
        this.$message.error('获取用户信息失败：' + error.message)
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
            const submitData = { ...this.userInfo }
            delete submitData.confirmPassword
            
            // 获取当前用户角色
            const currentRole = this.currentUser.role
            console.log("profile submit role is " + currentRole)
            console.log("profile submit avatar is " + submitData.avatar)
            console.log("profile submit photo is " + submitData.photoPath)
            
            // 调用更新接口时传入角色参数
            await this.$store.dispatch('user/updateProfile', {
              userInfo: submitData,
              role: currentRole
            })
            
            this.$message.success('个人信息更新成功')
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
    // 重置表单（修改 handleReset，重置删除状态）
    handleReset() {
      this.$refs.profileForm.resetFields();
      // 重置头像状态（恢复原有数据）
      this.avatarUrl = this.userInfo.avatar || '';
      this.isAvatarDeleted = false;
      // 重置教练照片状态
      this.coachPhotoUrl = this.userInfo.photoPath || '';
      this.isPhotoDeleted = false;
      this.getUserInfo(); // 重新拉取原始数据
    },

    // 超过上传数量处理
    handleUploadExceed(files, uploadList) {
      this.$message.warning('最多只能上传1张图片')
    },

    // 头像上传
    handleAvatarUpload(options) {
      console.log("头像上传函数")
      this.avatarLoading = true
      this.avatarUploadPercentage = 0
      
      uploadAvatar(options.file).then(response => {
        this.avatarLoading = false
        this.avatarUploadPercentage = 100
        const imgFileName = response.data  
        this.userInfo.avatar = imgFileName
        this.avatarUrl = imgFileName
        this.$message.success('头像上传成功')
        setTimeout(() => this.avatarUploadPercentage = 0, 1000)
      }).catch(error => {
        this.avatarLoading = false
        this.$message.error('头像上传失败：' + error.message)
      })
    },

    // 头像上传成功（修改 handleAvatarSuccess）
    handleAvatarSuccess(response) {
      const imgFileName = response.data;
      this.userInfo.avatar = imgFileName; // 保存新文件名到表单
      this.avatarUrl = imgFileName; // 更新预览路径
      this.isAvatarDeleted = false; // 重置删除状态（新头像上传后，删除状态取消）
      console.log("success函数")
      this.$message.success('头像上传成功');
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

    // 教练照片上传
    handlePhotoUpload(options) {
      this.photoLoading = true
      this.photoUploadPercentage = 0
      
      uploadCoachPhoto(options.file).then(response => {
        this.photoLoading = false
        this.photoUploadPercentage = 100
        const imgFileName = response.data  
        this.userInfo.photoPath = imgFileName
        this.coachPhotoUrl = imgFileName
        this.$message.success('照片上传成功')
        setTimeout(() => this.photoUploadPercentage = 0, 1000)
      }).catch(error => {
        this.photoLoading = false
        this.$message.error('照片上传失败：' + error.message)
      })
    },

    // 教练照片上传成功（同理修改，确保替换逻辑一致）
    handlePhotoSuccess(response) {
      const imgFileName = response.data;
      this.userInfo.photoPath = imgFileName;
      this.coachPhotoUrl = imgFileName;
      this.isPhotoDeleted = false; // 重置教练照片删除状态
      this.$message.success('照片上传成功');
    },

    handleUploadError(error) {
      this.$message.error('上传失败：' + (error.message || '未知错误'))
    },

    handleAvatarError(e) {
      e.target.src = '/default-avatar.gif'
    },

    handlePhotoError(e) {
      e.target.src = '/default-coach.png'
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
    },

      // 新增：临时删除头像（前端预览）
    handleAvatarDelete() {
      this.isAvatarDeleted = true; // 标记为已删除，隐藏预览
      this.avatarUrl = ''; // 清空预览路径
      this.userInfo.avatar = ''; // 关键：将头像字段设为空，提交时传给后端
      console.log("头像删除? " + this.userInfo.avatar);
      // 触发表单验证（删除后需重新验证「是否上传头像」）
      this.$refs.profileForm.validateField('avatar');
    },

    // 新增：临时删除教练照片（同理，教练照片也需要）
    handlePhotoDelete() {
      this.isPhotoDeleted = true;
      this.coachPhotoUrl = '';
      this.userInfo.photoPath = '';
      console.log("删除照片? " + this.isPhotoDeleted );
      console.log("isCoach? " + this.isCoach)
      console.log("this照片? " + this.photoPath);
      this.$refs.profileForm.validateField('photoPath');
    },
  }
}
</script>

<style lang="scss" scoped>
/* 样式保持不变 */
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

.el-form-item {
  margin-bottom: 15px;
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

/* 新增：头像预览容器（控制 hover 显示删除图标） */
.avatar-preview-container {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;

  /* 鼠标 hover 时加暗层 */
  &:hover {
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      z-index: 1;
    }
  }
}

/* 新增：删除图标（默认隐藏，hover显示） */
.avatar-delete-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 24px;
  z-index: 2;
  opacity: 0; /* 默认隐藏 */
  transition: opacity 0.3s ease;

  /* 父容器 hover 时显示 */
  .avatar-preview-container:hover & {
    opacity: 1;
  }

  /* 点击删除图标时的反馈 */
  &:hover {
    color: #ff4d4f; /* 红色高亮 */
  }
}

/* 新增：上传占位符（和原有图标样式保持一致） */
.avatar-upload-placeholder {
  width: 120px;
  height: 120px;
  text-align: center;
  line-height: 120px;
  border-radius: 6px;
  border: 1px dashed #dcdcdc;
}

/* 教练照片同理（复制上面的样式，改个类名即可） */
.photo-preview-container {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    &::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.4);
      z-index: 1;
    }
  }
}

.photo-delete-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #fff;
  font-size: 24px;
  z-index: 2;
  opacity: 0;
  transition: opacity 0.3s ease;

  .photo-preview-container:hover & {
    opacity: 1;
  }

  &:hover {
    color: #ff4d4f;
  }
}

.photo-upload-placeholder {
  width: 120px;
  height: 120px;
  text-align: center;
  line-height: 120px;
  border-radius: 6px;
  border: 1px dashed #dcdcdc;
}

</style>
