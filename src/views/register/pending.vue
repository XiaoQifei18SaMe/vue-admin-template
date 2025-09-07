<template>
  <div class="pending-container">
    <div class="pending-card">
      <div class="icon-container">
        <svg-icon icon-class="waiting" class="waiting-icon" />
      </div>
      <h2>您的注册申请已提交</h2>
      <p>我们将尽快审核您的信息，请耐心等待</p>
      <p>审核通过后，您将收到通知并可以登录系统</p>
      <el-button type="primary" @click="$router.push('/login')" style="margin-top: 20px;">
        返回登录页
      </el-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'RegisterPending'
}
</script>

<style lang="scss" scoped>
.pending-container {
  min-height: 100vh;
  background-color: #2d3a4b;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.pending-card {
  background-color: #fff;
  border-radius: 10px;
  padding: 40px;
  text-align: center;
  width: 100%;
  max-width: 500px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.icon-container {
  margin-bottom: 20px;
}

.waiting-icon {
  font-size: 60px;
  color: #409EFF;
}

h2 {
  color: #303133;
  margin-bottom: 10px;
}

p {
  color: #606266;
  margin-bottom: 10px;
  line-height: 1.6;
}
</style>