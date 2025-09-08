<!-- 校区编辑页：@/views/campus/edit.vue -->
<template>
  <el-form>
    <!-- 校区名称：仅超管或本校区管理员可编辑 -->
    <el-form-item label="校区名称">
      <el-input 
        v-model="campus.name" 
        :disabled="!canEdit" 
      />
    </el-form-item>

    <!-- 地理位置：仅超管或本校区管理员可编辑 -->
    <el-form-item label="地理位置">
      <el-input 
        v-model="campus.location" 
        :disabled="!canEdit" 
      />
    </el-form-item>

    <!-- 乒乓球桌数量：仅超管或本校区管理员可编辑 -->
    <el-form-item label="球桌数量">
      <el-input 
        v-model="campus.tableCount" 
        type="number" 
        :disabled="!canEdit" 
      />
    </el-form-item>

    <!-- 联系方式：自动显示本校区管理员信息（不可编辑） -->
    <el-form-item label="联系方式">
      <div>管理员：{{ campus.admin.realName }}</div>
      <div>电话：{{ campus.admin.phone }}</div>
      <div>邮箱：{{ campus.admin.email }}</div>
    </el-form-item>
  </el-form>
</template>

<script>
export default {
  data() {
    return {
      campus: {}, // 校区数据
      currentUser: {} // 当前登录用户信息
    }
  },
  computed: {
    // 判断是否有权编辑当前校区
    canEdit() {
      const { roles, campusId } = this.currentUser
      // 超级管理员：有权编辑所有校区
      if (roles.includes('admin')) return true
      // 校区管理员：仅能编辑自己所属的校区
      if (roles.includes('campus_admin') && campusId === this.campus.id) return true
      return false
    }
  },
  created() {
    this.getCurrentUser() // 获取当前用户信息（含roles和campusId）
    this.getCampusDetail() // 获取当前校区详情（含admin信息）
  }
}
</script>