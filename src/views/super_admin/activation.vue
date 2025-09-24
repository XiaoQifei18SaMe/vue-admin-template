<template>
  <div class="activation-container">
    <el-card class="activation-card">
      <div slot="header" class="card-header">
        <h2>系统激活</h2>
        <p>请完成付费以激活系统功能</p>
      </div>
      
      <div class="activation-content">
        <el-alert
          title="系统当前处于未激活状态，仅超级管理员可访问此页面"
          type="warning"
          show-icon
          :closable="false"
        ></el-alert>
        
        <div class="pricing-info">
          <h3>服务费用：<span class="price">¥500</span>/年</h3>
          <p class="service-description">
            激活后可使用系统全部功能，包括：
          </p>
          <el-checkbox-group v-model="checkedServices" disabled>
            <el-checkbox label="管理员账户管理" checked></el-checkbox>
            <el-checkbox label="校区管理与配置" checked></el-checkbox>
            <el-checkbox label="教练与学员管理" checked></el-checkbox>
            <el-checkbox label="课程与预约系统" checked></el-checkbox>
            <el-checkbox label="财务与充值功能" checked></el-checkbox>
          </el-checkbox-group>
        </div>
        
        <div class="payment-method">
          <h3>支付方式</h3>
          <!-- 删除「银行转账」选项，仅保留支付宝、微信支付 -->
          <el-radio-group v-model="paymentMethod">
            <el-radio label="alipay">支付宝</el-radio>
            <el-radio label="wechat">微信支付</el-radio>
          </el-radio-group>
        </div>
        
        <!-- 完全删除「银行信息展示区」和「付款凭证上传」相关内容 -->
        
        <div class="activation-actions">
          <el-button 
            type="primary" 
            size="large" 
            :loading="loading"
            @click="handleActivate"
          >
            <!-- 统一按钮文字（无需区分银行支付） -->
            立即支付并激活
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { payServiceFee, activateSystem, verifyActivation } from '@/api/super_admin'
import { getDeviceId } from '@/utils/device'

export default {
  name: 'SystemActivation',
  data() {
    return {
      checkedServices: [],
      paymentMethod: 'alipay', // 默认支付宝支付（无银行选项）
      loading: false,
      // 删除「paymentProof」变量（无需上传凭证）
      adminId: '',
      deviceId: ''
    }
  },
  created() {
    // 获取当前超级管理员ID
    this.adminId = this.$store.getters.userId || '',
    this.deviceId = getDeviceId()
  },
  methods: {
    // 删除「handlePaymentProof」方法（无需处理凭证上传）
    
    async handleActivate() {
      this.loading = true
      try {
        // 删除「银行支付时校验凭证」的逻辑（无银行支付场景）
        
        // 1. 处理支付
        const payResult = await payServiceFee(this.adminId)
        
        if (payResult.code !== 20000) {
          this.$message.error(payResult.message || '支付处理失败')
          this.loading = false
          return
        }
        
        // 2. 激活系统
        const activateResult = await activateSystem({
          superAdminId: this.adminId,
          deviceId: this.deviceId,
        })
        
        if (activateResult.code === 20000) {
          this.$message.success('系统激活成功！即将刷新页面...')
          
          // 3. 验证激活状态
          setTimeout(async () => {
            const verifyResult = await verifyActivation()
            if (verifyResult.code === 20000 && verifyResult.data) {
              // 激活成功，跳转到首页
              this.$router.push('/')
              // 刷新页面使权限生效
              location.reload()
            } else {
              this.$message.error('系统激活验证失败，请稍后重试')
              this.loading = false
            }
          }, 3000)
        } else {
          this.$message.error(activateResult.message || '系统激活失败')
          this.loading = false
        }
      } catch (error) {
        console.error('激活失败:', error)
        this.$message.error(error.message || '激活过程发生错误')
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.activation-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 60px);
  background-color: #f5f7fa;
  padding: 20px;
}

.activation-card {
  width: 100%;
  max-width: 800px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.card-header {
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 15px;
  
  h2 {
    margin-bottom: 10px;
    color: #1890ff;
  }
  
  p {
    color: #666;
    margin: 0;
  }
}

.activation-content {
  padding: 30px;
  
  .el-alert {
    margin-bottom: 25px;
  }
}

.pricing-info {
  margin-bottom: 30px;
  
  .price {
    color: #f56c6c;
    font-size: 24px;
    font-weight: bold;
  }
  
  .service-description {
    margin: 15px 0;
    color: #666;
  }
  
  .el-checkbox-group {
    margin-top: 10px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.payment-method {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 4px;
  
  h3 {
    margin-top: 0;
    margin-bottom: 15px;
  }
  
  .el-radio-group {
    display: flex;
    gap: 20px;
  }
}

/* 删除「银行信息区」相关样式（对应元素已删除） */

.activation-actions {
  margin-top: 30px;
  text-align: center;
}
</style>