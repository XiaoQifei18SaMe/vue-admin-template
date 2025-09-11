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
        <el-form-item prop="photo">
          <span class="svg-container">
            <svg-icon icon-class="photo" />
          </span>
          <el-upload
            class="upload-demo"
            :file-list="fileList"
            accept="image/*"
            list-type="picture-card"
            :before-upload="beforePhotoUpload"
            :on-remove="handleRemove"
            :on-change="handleFileChange"  
            :auto-upload="false"  
            :limit="1"
          >
            <i class="el-icon-plus"></i>
          </el-upload>
        </el-form-item>

        <!-- 个人简介/比赛成绩 -->
        <el-form-item prop="achievements">
          <span class="svg-container">
            <svg-icon icon-class="achievement" />
          </span>
          <el-input
            v-model="registerForm.achievements"
            placeholder="个人简介及以往比赛成绩描述"
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
import { register } from '@/api/user'

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

    const validateAge = (rule, value, callback) => {
      if (!value) {
        callback();
      } else if (isNaN(Number(value)) || !Number.isInteger(Number(value))) {
        callback(new Error('年龄必须是整数'));
      } else {
        const age = Number(value);
        let minAge, maxAge = 60;

        if (this.registerForm.role === 'student') {
          minAge = 6;
        } else if (this.registerForm.role === 'coach') {
          minAge = 18;
        }

        if (age < minAge) {
          callback(new Error(`${this.registerForm.role === 'student' ? '学员' : '教练'}年龄不能低于${minAge}岁`));
        } else if (age > maxAge) {
          callback(new Error(`年龄不能超过${maxAge}岁`));
        } else {
          callback();
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
        achievements: '',
      },
      fileList: [],  // 存储上传的图片文件
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
            required: false,
            trigger: ['blur', 'change'],
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
          { 
            required: true, 
            trigger: ['change', 'blur'],  // 增加blur触发，确保更多场景下校验
            message: '请上传教练照片', 
            validator: (rule, value, callback) => {
              if (this.registerForm.role === 'coach' && this.fileList.length === 0) {
                callback(new Error('请上传教练照片'));
              } else {
                callback();
              }
            }
          }
        ],
        achievements: [
          { required: true, trigger: 'blur', message: '请输入个人简介及比赛成绩', validator: (rule, value, callback) => {
                if (this.registerForm.role === 'coach' && !value) {
                callback(new Error('请输入个人简介及比赛成绩'))
                } else {
                callback()
                }
            }
          }
        ]
      },
      campuses: [
        { label: '总校区', value: 1 },
        { label: '东校区', value: 2 },
        { label: '西校区', value: 3 },
        { label: '南校区', value: 4 },
        { label: '北校区', value: 5 }
      ],
      loading: false,
      passwordType: 'password',
      confirmPasswordType: 'password',
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
        const inputRef = type === 'password' ? 'password' : 'confirmPassword'
        this.$refs[inputRef]?.focus()
      })
    },

    handleRoleChange() {
      if (this.registerForm.role === 'student') {
        this.registerForm.achievements = ''
        this.fileList = []
      }
      this.$refs.registerForm.clearValidate()
    },

    // 上传前校验
    beforePhotoUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif';
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isImage) this.$message.error('仅支持 JPG、PNG、GIF 格式的图片！');
      if (!isLt2M) this.$message.error('图片大小不能超过 2MB！');
      return isImage && isLt2M;
    },
    
      handleFileChange(file, fileList) {
      this.fileList = fileList;
      // 手动触发photo字段的验证
      this.$refs.registerForm.validateField('photo');
    },
    // 优化handleRemove方法，确保验证触发
    handleRemove(file, fileList) {
      this.fileList = fileList;
      this.$refs.registerForm.validateField('photo');
    },

    handleRegister() {
      this.$refs.registerForm.validate(valid => {
        if (valid) {
          this.loading = true;
          const isMale = this.registerForm.gender === 'male' ? true : false;

          // 构建基础数据
          const baseData = {
            username: this.registerForm.username,
            password: this.registerForm.password,
            name: this.registerForm.realName,
            isMale: isMale,
            age: this.registerForm.age ? Number(this.registerForm.age) : null,
            schoolId: this.registerForm.campus,
            phone: this.registerForm.phone,
            email: this.registerForm.email || ''
          };

          // 根据角色选择不同的请求方式和接口
          if (this.registerForm.role === 'student') {
            // 学员注册：使用JSON格式
            // 学员注册：使用JSON格式数据
            register(baseData, 'student')
                .then(response => {
                  this.loading = false;
                  // 统一通过根节点code判断（与教练注册逻辑一致）
                  if (response.code === 20000) {
                    this.$message.success('注册成功，请登录');
                    this.$router.push('/login');
                  } else {
                    this.$message.error(response.message || response || '注册失败');
                  }
                })
                .catch(error => {
                  this.$message.error(error.message || '注册失败');
                  this.loading = false;
                });
          } else if (this.registerForm.role === 'coach') {
            // 教练注册：使用FormData格式同时提交数据和文件
            if (this.fileList.length === 0) {
              this.$message.error('请上传教练照片');
              this.loading = false;
              return;
            }

            const formData = new FormData();
            // 追加基础字段
            Object.keys(baseData).forEach(key => {
              if (baseData[key] !== null && baseData[key] !== undefined) {
                formData.append(key, baseData[key]);
              }
            });
            // 追加教练特有字段
            formData.append('description', this.registerForm.achievements);
            // 追加图片文件
            formData.append('file', this.fileList[0].raw);

             register(formData, 'coach')
                .then(response => {
                  this.loading = false;
                  // 1. 直接访问response.code（根节点字段）
                  if (response.code === 20000) {
                    this.$message.success('注册申请已提交，请等待管理员审核');
                    this.$router.push('/register/pending');
                  } else {
                    // 2. 直接访问response.message（根节点字段），并增加空值保护
                    this.$message.error(response.message || '注册失败');
                  }
                })
                .catch(error => {
                  this.$message.error(error.message || '注册失败');
                  this.loading = false;
                });
          }
        }
      });
    }
  }
}
</script>

<style lang="scss">
$bg:#283443;
$light_gray:#fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .register-container .el-input input {
    color: $cursor;
  }
}

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
$primary-color: #409EFF;

.register-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  overflow: hidden;
    
  .register-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 160px 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .el-form-item.is-required .el-form-item__label:before {
    display: none !important;
  }

  .tips {
    font-size: 14px;
    color: #fff;
    text-align: center;
    margin-bottom: 10px;
    line-height: 1.8;

    .login-link {
      color: $primary-color;
      margin-left: 5px;
      cursor: pointer;
      
      &:hover {
        text-decoration: underline;
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
    z-index: 1;
  }

  ::v-deep .el-upload-list__item {
  position: relative;
}

::v-deep .el-upload-list__item:hover .el-upload-list__item-actions {
  display: flex !important;
}

/* 确保替换按钮显示 */
::v-deep .el-upload-list__item-actions {
  display: none;
  gap: 10px;
}

::v-deep .el-upload-list__item-actions .el-icon-delete {
  color: #f56c6c;
}

::v-deep .el-upload-list__item-actions .el-icon-refresh {
  color: #409eff;
  cursor: pointer;
}
}
</style>