<!-- 管理员编辑页：@/views/admin/profile.vue -->
<template>
  <el-form>
    <!-- 用户名：仅超级管理员可修改（普通管理员不可改） -->
    <el-form-item label="用户名">
      <el-input 
        v-model="admin.username" 
        :disabled="!isSuperAdmin" 
      />
    </el-form-item>

    <!-- 真实姓名：超级管理员可改所有，管理员可改自己 -->
    <el-form-item label="真实姓名">
      <el-input 
        v-model="admin.realName" 
        :disabled="!canEditProfile" 
      />
    </el-form-item>

    <!-- 电话/邮箱：同真实姓名权限 -->
    <el-form-item label="电话">
      <el-input 
        v-model="admin.phone" 
        :disabled="!canEditProfile" 
      />
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  computed: {
    isSuperAdmin() {
      return this.currentUser.roles.includes('admin')
    },
    // 判断是否能修改当前管理员信息
    canEditProfile() {
      // 超级管理员：可修改所有
      if (this.isSuperAdmin) return true
      // 普通管理员：仅能修改自己的信息
      return this.currentUser.id === this.admin.id
    }
  }
}
</script>