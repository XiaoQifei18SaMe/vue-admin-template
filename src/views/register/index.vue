<template>
  <div class="register-container">
    <el-form v-if="registerForm" ref="registerForm" :model="registerForm" :rules="registerRules" class="register-form" auto-complete="on" label-position="left">
      <div class="title-container">
        <h3 class="title">注册账号</h3>
      </div>

      <!-- 角色选择 -->
      <el-form-item prop="role">
        <span class="svg-container">
          <svg-icon icon-class="role" />
        </span>
        <el-select v-model="registerForm.role" placeholder="请选择注册角色" @change="handleRoleChange">
          <el-option label="学员" value="student" />
          <el-option label="教练" value="coach" />
        </el-select>
      </el-form-item>

      <!-- 用户名 -->
      <el-form-item prop="username">
        <span class="svg-container">
          <svg-icon icon-class="user" />
        </span>
        <el-input
          v-model="registerForm.username"
          placeholder="用户名（4-16位，仅支持字母数字下划线）"
          name="username"
          type="text"
          auto-complete="on"
        />
      </el-form-item>

      <!-- 密码 -->
      <el-form-item prop="password">
        <span class="svg-container">
          <svg-icon icon-class="password" />
        </span>
        <el-input
          :key="passwordType"
          v-model="registerForm.password"
          :type="passwordType"
          placeholder="密码（8-16位，必须包含字母数字及特殊字符）"
          auto-complete="on"
        />
        <span class="show-pwd" @click="togglePasswordVisibility('password')">
          <svg-icon :icon-class="passwordType === 'password' ? 'eye' : 'eye-open'" />
        </span>
      </el-form-item>

      <!-- 确认密码 -->
      <el-form-item prop="confirmPassword">
        <span class="svg-container">
          <svg-icon icon-class="password" />
        </span>
        <el-input
          :key="confirmPasswordType"
          v-model="registerForm.confirmPassword"
          :type="confirmPasswordType"
          placeholder="确认密码"
          auto-complete="on"
        />
        <span class="show-pwd" @click="togglePasswordVisibility('confirmPassword')">
          <svg-icon :icon-class="confirmPasswordType === 'password' ? 'eye' : 'eye-open'" />
        </span>
      </el-form-item>

      <!-- 真实姓名 -->
      <el-form-item prop="realName">
        <span class="svg-container">
          <svg-icon icon-class="realname" />
        </span>
        <el-input
          v-model="registerForm.realName"
          placeholder="真实姓名"
          type="text"
        />
      </el-form-item>

      <!-- 性别 -->
      <el-form-item prop="gender">
        <span class="svg-container">
          <svg-icon icon-class="gender" />
        </span>
        <el-select v-model="registerForm.gender" placeholder="请选择性别">
          <el-option label="男" value="male" />
          <el-option label="女" value="female" />
        </el-select>
      </el-form-item>

      <!-- 年龄 -->
      <el-form-item prop="age">
        <span class="svg-container">
          <svg-icon icon-class="age" />
        </span>
        <el-input
          v-model="registerForm.age"
          placeholder="年龄"
          type="number"
        />
      </el-form-item>

      <!-- 校区 -->
      <el-form-item prop="campus">
        <span class="svg-container">
          <svg-icon icon-class="campus" />
        </span>
        <el-select v-model="registerForm.campus" placeholder="请选择校区">
          <el-option 
            v-for="campus in campuses" 
            :key="campus.value" 
            :label="campus.label" 
            :value="campus.value" 
          />
        </el-select>
      </el-form-item>

      <!-- 电话 -->
      <el-form-item prop="phone">
        <span class="svg-container">
          <svg-icon icon-class="phone" />
        </span>
        <el-input
          v-model="registerForm.phone"
          placeholder="电话号码"
          type="tel"
        />
      </el-form-item>

      <!-- 邮箱 -->
      <el-form-item prop="email">
        <span class="svg-container">
          <svg-icon icon-class="email" />
        </span>
        <el-input
          v-model="registerForm.email"
          placeholder="邮箱地址"
          type="email"
        />
      </el-form-item>

      <!-- 教练特有字段 -->
      <template v-if="registerForm.role === 'coach'">
        <!-- 教练照片 -->
        <!-- 移除action，改用http-request自定义请求 -->
      <el-form-item prop="photo">
        <span class="svg-container">
            <svg-icon icon-class="photo" />
        </span>
        <el-upload
            class="upload-demo"
            :http-request="handleHttpUpload" 
            :on-success="handlePhotoUpload" 
            :on-error="handleUploadError" 
            :on-preview="handlePhotoPreview" 
            :on-progress="handleUploadProgress"
            :file-list="fileList" 
            accept="image/*" 
            list-type="picture-card" 
            :before-upload="beforePhotoUpload"
            :disabled="uploadDisabled"
        >
            <i v-if="!uploadLoading" class="el-icon-plus"></i>
            <el-loading-spinner v-else class="upload-loading"></el-loading-spinner>
        </el-upload>

        <!-- 进度条和预览弹窗不变 -->
        <el-progress 
            v-if="uploadPercentage > 0 && uploadPercentage < 100"
            :percentage="uploadPercentage" 
            stroke-width="2" 
            style="width: 85%; margin-top: 10px;"
        ></el-progress>
        <el-dialog :visible.sync="photoDialogVisible" title="照片预览" width="30%">
            <img width="100%" :src="previewPhotoUrl" alt="教练照片">
        </el-dialog>
        </el-form-item>

        <!-- 比赛成绩 -->
        <el-form-item prop="achievements">
          <span class="svg-container">
            <svg-icon icon-class="achievement" />
          </span>
          <el-input
            v-model="registerForm.achievements"
            placeholder="以往比赛成绩描述"
            type="textarea"
            rows="3"
          />
        </el-form-item>
      </template>

      <el-button 
        :loading="loading" 
        type="primary" 
        style="width:100%;margin-bottom:30px;" 
        @click.native.prevent="handleRegister"
      >
        注册
      </el-button>

      <div class="tips">
        <span>已有账号？</span>
        <router-link to="/login" class="login-link">点击登录</router-link>
      </div>
    </el-form>
  </div>
</template>

<script>
import { validUsername, validPassword } from '@/utils/validate'
import { register, uploadFile } from '@/api/user'

export default {
  name: 'Register',
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

    const validatePassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请输入密码'))
      } else if (!validPassword(value)) {
        callback(new Error('密码需8-16位，包含字母、数字和特殊字符'))
      } else {
        if (this.registerForm.confirmPassword && value !== this.registerForm.confirmPassword) {
          this.$refs.registerForm.validateField('confirmPassword')
        }
        callback()
      }
    }

    const validateConfirmPassword = (rule, value, callback) => {
      if (!value) {
        callback(new Error('请确认密码'))
      } else if (value !== this.registerForm.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }

    // 修改后：年龄验证（选填，填则校验有效性）
  const validateAge = (rule, value, callback) => {
    // 1. 若未输入值（不填），直接通过验证（选填逻辑）
    if (!value) {
      callback(); // 不填则通过，不报错
    } 
    // 2. 若输入了值，先判断是否为有效整数（避免字符串、小数）
    else if (isNaN(Number(value)) || !Number.isInteger(Number(value))) {
      callback(new Error('年龄必须是整数'));
    } 
    // 3. 输入了有效整数，再按角色判断合理范围（保持场景适配）
    else {
      const age = Number(value);
      let minAge, maxAge = 60; // 所有角色上限统一60岁

      // 按角色动态设下限（学员6岁，教练18岁）
      if (this.registerForm.role === 'student') {
        minAge = 6;
      } else if (this.registerForm.role === 'coach') {
        minAge = 18;
      }

      // 范围校验
      if (age < minAge) {
        callback(new Error(`${this.registerForm.role === 'student' ? '学员' : '教练'}年龄不能低于${minAge}岁`));
      } else if (age > maxAge) {
        callback(new Error(`年龄不能超过${maxAge}岁`));
      } else {
        callback(); // 验证通过
      }
    }
  };

    const validatePhone = (rule, value, callback) => {
      const reg = /^1[3-9]\d{9}$/
      if (!value) {
        callback(new Error('请输入电话号码'))
      } else if (!reg.test(value)) {
        callback(new Error('请输入正确的电话号码'))
      } else {
        callback()
      }
    }

    return {
      registerForm: {
        role: 'coach',
        username: '',
        password: '',
        confirmPassword: '',
        realName: '',
        gender: '',
        age: '',
        campus: '',
        phone: '',
        email: '',
        photo: '',
        achievements: '',
        uploadLoading: false,       // 上传加载状态
        uploadPercentage: 0,        // 上传进度
        uploadDisabled: false       // 上传控件是否禁用
      },
      registerRules: {
        role: [
          { required: true, trigger: 'change', message: '请选择注册角色' }
        ],
        username: [
          { required: true, trigger: 'blur', validator: validateUsername }
        ],
        password: [
          { required: true, trigger: 'blur', validator: validatePassword }
        ],
        confirmPassword: [
          { required: true, trigger: 'blur', validator: validateConfirmPassword }
        ],
        realName: [
          { required: true, trigger: 'blur', message: '请输入真实姓名' }
        ],
        age: [
            {
            required: false, // 关键：改为false，允许不填
            trigger: ['blur', 'change'], // 只有输入值时，失焦/变化才触发校验
            validator: validateAge 
            }
        ],
        phone: [
          { required: true, trigger: 'blur', validator: validatePhone }
        ],
        campus: [
          { required: true, trigger: 'change', message: '请选择校区' }
        ],
        email: [
          { type: 'email', trigger: 'blur', message: '请输入正确的邮箱地址' }
        ],
        photo: [
          { required: true, trigger: 'change', message: '请上传教练照片', validator: (rule, value, callback) => {
                if (this.registerForm.role === 'coach' && !value) {
                callback(new Error('请上传教练照片'))
                } else {
                callback()
                }
            }
          }
        ],
        achievements: [
          { required: true, trigger: 'blur', message: '请输入比赛成绩', validator: (rule, value, callback) => {
                if (this.registerForm.role === 'coach' && !value) {
                callback(new Error('请输入比赛成绩'))
                } else {
                callback()
                }
            }
          }
        ]
      },
      campuses: [
        { label: '总校区', value: 'main' },
        { label: '东校区', value: 'east' },
        { label: '西校区', value: 'west' },
        { label: '南校区', value: 'south' },
        { label: '北校区', value: 'north' }
      ],
      loading: false,
      passwordType: 'password',
      confirmPasswordType: 'password',
      fileList: [], // 已上传文件列表（原有，保留）
      photoDialogVisible: false, // 预览弹窗的显示状态（新增）
      previewPhotoUrl: '' // 预览图片的 URL（新增）
    }
  },
  methods: {
    togglePasswordVisibility(type) {
      if (type === 'password') {
        this.passwordType = this.passwordType === 'password' ? '' : 'password'
      } else {
        this.confirmPasswordType = this.confirmPasswordType === 'password' ? '' : 'password'
      }
      this.$nextTick(() => {
        // 保持与登录页一致的聚焦行为
        const inputRef = type === 'password' ? 'password' : 'confirmPassword'
        this.$refs[inputRef]?.focus()
      })
    },

    handleRoleChange() {
      if (this.registerForm.role === 'student') {
        this.registerForm.photo = ''
        this.registerForm.achievements = ''
        this.fileList = []
      }
      this.$refs.registerForm.clearValidate()
    },

    // handlePhotoUpload(response, file, fileList) {
    //   this.registerForm.photo = response.data.url
    //   this.fileList = fileList
    // },

    // 核心修改：自定义上传方法（与登录的handleLogin调用方式一致）
    handleHttpUpload(options) {
      // 构建FormData（文件上传必须用FormData格式）
      const formData = new FormData()
      formData.append('file', options.file) // 'file'为后端接收文件的参数名

      // 调用API层的上传方法（与登录的login方法调用风格一致）
      uploadFile(formData)
        .then(response => {
          // 上传成功：调用el-upload的success回调
          options.onSuccess(response)
        })
        .catch(error => {
          // 上传失败：调用el-upload的error回调
          options.onError(error)
        })
    },
    // 上传前校验
    beforePhotoUpload(file) {
      // 校验格式：仅允许 jpg/png/gif
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif'
      // 校验大小：不超过 2MB
      const isLt2M = file.size / 1024 / 1024 < 2

      if (!isImage) {
        this.$message.error('仅支持 JPG、PNG、GIF 格式的图片！')
        return false
      }
      if (!isLt2M) {
        this.$message.error('图片大小不能超过 2MB！')
        return false
      }
      
      // 开始上传前的准备
      this.uploadLoading = true
      this.uploadPercentage = 0
      this.uploadDisabled = true
      return true
    },

    // 上传进度处理
    handleUploadProgress(event, file, fileList) {
      this.uploadPercentage = Math.floor(event.percent * 100)
    },

    // 上传成功处理
    handlePhotoUpload(response, file, fileList) {
      this.uploadLoading = false
      this.uploadDisabled = false
      
      if (response.code === 20000) {
        this.registerForm.photo = response.data.url
        this.fileList = fileList
        this.$message.success(response.message || '照片上传成功！')
      } else {
        this.uploadPercentage = 0
        this.$message.error('照片上传失败：' + (response.message || '未知错误'))
      }
    },

    // 上传失败处理
    handleUploadError(error, file, fileList) {
      this.uploadLoading = false
      this.uploadDisabled = false
      this.uploadPercentage = 0
      this.$message.error('上传失败，请稍后重试')
      console.error('上传错误详情：', error)
    },

    // 移除已上传文件
    handleRemove(file, fileList) {
      this.fileList = fileList
      if (fileList.length === 0) {
        this.registerForm.photo = ''
      }
    },

    handleRegister() {
      this.$refs.registerForm.validate(valid => {
        if (valid) {
          this.loading = true
          register(this.registerForm).then(() => {
            this.loading = false
            if (this.registerForm.role === 'student') {
              this.$message.success('注册成功，请登录')
              this.$router.push('/login')
            } else {
              this.$message.success('注册申请已提交，请等待管理员审核')
              this.$router.push('/register/pending')
            }
          }).catch(error => {
            this.$message.error(error.message || '注册失败')
            this.loading = false
          })
        } else {
          console.log('表单验证失败')
          return false
        }
      })
    }
  }
}
</script>

<style lang="scss">
/* 修复input 背景不协调 和光标变色，与登录页保持一致 */
$bg:#283443;
$light_gray:#fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .register-container .el-input input {
    color: $cursor;
  }
}

/* reset element-ui css，与登录页保持一致 */
.register-container {
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

  /* 修复el-select下拉三角形位置，与登录页一致 */
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

.register-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  overflow: hidden;
    
  .register-form {
    position: relative;
    width: 520px; // 与登录页保持一致的宽度
    max-width: 100%;
    padding: 160px 35px 0; // 与登录页保持一致的顶部距离
    margin: 0 auto;
    overflow: hidden;
  }

  .el-form-item.is-required .el-form-item__label:before {
    display: none !important;
  }

  

//   // 统一表单项目样式，与登录页保持一致
//   .el-form-item {
//     display: flex;
//     align-items: center;
//     border: 1px solid rgba(255, 255, 255, 0.1);
//     background: rgba(0, 0, 0, 0.1);
//     border-radius: 5px;
//     margin-bottom: 15px; // 与登录页保持一致的间距
//     padding: 3px 5px;
    
//     // 输入框容器占满剩余空间
//     .el-input,
//     .el-select,
//     .upload-demo {
//       //flex: 1;
//       width: 85%;
//       margin: 0;
//       padding: 5px 0;
//     }
//   }

  .tips {
    font-size: 14px;
    color: #fff;
    text-align: center;
    margin-bottom: 10px;
    line-height: 1.8; // 与登录页保持一致的行高

    .login-link {
      color: $primary-color; // 使用主题色，与登录页一致
      margin-left: 5px;
      cursor: pointer;
      
      &:hover {
        text-decoration: underline; // 与登录页保持一致的hover效果
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
    flex-shrink: 0;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto; // 与登录页保持一致的标题间距
      text-align: center;
      font-weight: bold;
    }
  }

  .show-pwd {
    position: absolute;
    right: 40px;
    top: 7px; // 与登录页保持一致的位置
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
    z-index: 1;
  }

  // 上传组件样式调整，融入整体风格
//   .upload-demo {
//     padding: 5px 0;
    
//     .el-button {
//       width: 100%;
//       text-align: left;
//       padding-left: 15px;
//       background: transparent;
//       border: 1px solid rgba(255, 255, 255, 0.2);
      
//       &:hover {
//         background: rgba(255, 255, 255, 0.1);
//       }
//     }
//   }

//   // 文本域样式调整，与整体风格统一
//   .el-textarea {
//     width: 100% !important;    
//     textarea {
//       background: transparent;
//       border: 0;
//       color: $light_gray;
//       padding: 12px 15px;
//       resize: none;
//       height: 100px !important;
//     }
//   }
}
</style>
