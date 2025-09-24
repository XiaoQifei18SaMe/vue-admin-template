<template>
  <div class="activation-container">
    <el-card class="activation-card">
      <div slot="header" class="card-header">
        <h2>系统激活</h2>
        <p v-if="!isActivated">请完成付费以激活系统功能</p>
        <p v-else class="activated-subtitle">系统已激活，当前为有效状态</p>
      </div>

      <div class="activation-content">
        <!-- 未激活：显示原有激活表单 -->
        <div v-if="!isActivated">
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
            <el-radio-group v-model="paymentMethod">
              <el-radio label="alipay">支付宝</el-radio>
              <el-radio label="wechat">微信支付</el-radio>
            </el-radio-group>
          </div>

          <div class="activation-actions">
            <el-button
              type="primary"
              size="large"
              :loading="loading"
              @click="handleActivate"
            >
              立即支付并激活
            </el-button>
          </div>
        </div>

        <!-- 已激活：显示到期时间+实时倒计时 -->
        <div v-else class="activated-success">
          <el-alert
            title="系统激活成功！"
            type="success"
            show-icon
            :closable="false"
          ></el-alert>

          <div class="expiry-info">
            <h3>服务到期时间</h3>
            <p class="valid-to">{{ expiryTime }}</p>
            <div class="countdown-container">
              <span class="countdown-label">距离到期还剩：</span>
              <span class="countdown-value" :class="{ expired: isExpired }">
                {{ countdown }}
              </span>
            </div>
            <el-button
              type="warning"
              size="medium"
              @click="handleRenew"
              v-if="!isExpired"
            >
              提前续费
            </el-button>
            <el-button
              type="danger"
              size="medium"
              @click="handleReactivate"
              v-if="isExpired"
            >
              已过期，请重新激活
            </el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import {
  payServiceFee,
  activateSystem,
  verifyActivation,
  getActivationExpiry // 引入新增接口
} from '@/api/super_admin'
import { getDeviceId } from '@/utils/device'

export default {
  name: 'SystemActivation',
  data() {
    return {
      // 原有数据
      checkedServices: [],
      paymentMethod: 'alipay',
      loading: false,
      adminId: '',
      deviceId: '',

      // 新增：激活状态与过期信息
      isActivated: false, // 是否已激活
      expiryTime: '', // 到期时间（yyyy-MM-dd HH:mm:ss）
      countdown: '0天00时00分00秒', // 实时倒计时
      countdownTimer: null, // 定时器实例（用于销毁）
      isExpired: false, // 是否已过期
      token: '' // 超级管理员token（从store获取）
    }
  },
  created() {
    // 1. 获取基础信息（管理员ID、设备ID、token）
    this.adminId = this.$store.getters.userId || ''
    this.deviceId = getDeviceId()
    this.token = this.$store.getters.token || '' // 假设store中存储了token

    // 2. 初始化时查询激活状态与过期信息
    this.initActivationStatus()
  },
  beforeDestroy() {
    // 销毁定时器（避免内存泄漏）
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer)
    }
  },
  methods: {
    // 原有方法：处理激活逻辑（保持不变）
    async handleActivate() {
      this.loading = true
      try {
        // 1. 发起支付
        const payResult = await payServiceFee(this.adminId)
        if (payResult.code !== 20000) {
          this.$message.error(payResult.message || '支付处理失败')
          this.loading = false
          return
        }

        // 2. 激活系统
        const activateResult = await activateSystem({
          superAdminId: this.adminId,
          deviceId: this.deviceId
        })
        if (activateResult.code !== 20000) {
          this.$message.error(activateResult.message || '系统激活失败')
          this.loading = false
          return
        }

        // 3. 激活成功后，重新查询激活状态
        this.$message.success('系统激活成功！')
        await this.initActivationStatus()
      } catch (error) {
        console.error('激活失败:', error)
        this.$message.error(error.message || '激活过程发生错误')
      } finally {
        this.loading = false
      }
    },

    // 新增：初始化激活状态（查询是否激活+过期时间）
    async initActivationStatus() {
  try {
    // 1. （可选）若 verifyActivation 接口可靠，可保留；若不可靠，建议注释（优先以 getActivationExpiry 结果为准）
    const verifyResult = await verifyActivation(this.deviceId)
    if (verifyResult.code !== 20000 || !verifyResult.data) {
      // 此处可改为“不直接返回”，仅做警告，避免覆盖后续正确状态
      console.warn('激活验证接口返回未激活，但将以过期信息接口为准')
      // this.isActivated = false; // 注释这行，避免覆盖
      // return; // 注释这行，继续执行后续逻辑
    }

    // 2. 查询激活过期信息（核心：字段名从 isActive 改为 active）
    const expiryResult = await getActivationExpiry({
      token: this.token,
      deviceId: this.deviceId
    })
    if (expiryResult.code !== 20000) {
      this.$message.error(expiryResult.message || '获取过期信息失败')
      return
    }

    // 3. 修复：解构后端返回的 active 字段（而非 isActive）
    const { active, validTo } = expiryResult.data // 关键修改：isActive → active
    this.isActivated = active // 正确赋值为 true
    if (active && validTo) { // 条件成立，启动倒计时
      this.expiryTime = validTo // 正确赋值到期时间
      this.startCountdown() // 启动倒计时（终于执行！）
    }
  } catch (error) {
    console.error('初始化激活状态失败:', error)
    this.isActivated = false
  }
},

    // 新增：启动倒计时（实时计算剩余时间）
    startCountdown() {
      // 销毁原有定时器（避免重复）
      if (this.countdownTimer) {
        clearInterval(this.countdownTimer)
      }

      // 每秒计算一次剩余时间
      this.countdownTimer = setInterval(() => {
        this.calculateCountdown()
      }, 1000)

      // 初始计算一次
      this.calculateCountdown()
    },

    // 新增：计算倒计时（当前时间 - 到期时间）
    calculateCountdown() {
      // 解析到期时间（后端返回格式：yyyy-MM-dd HH:mm:ss）
      const expiryDate = new Date(this.expiryTime.replace(/-/g, '/'))
      const now = new Date()

      // 计算时间差（毫秒）
      const timeDiff = expiryDate - now

      if (timeDiff <= 0) {
        // 已过期
        this.countdown = '0天00时00分00秒'
        this.isExpired = true
        this.isActivated = false // 过期后标记为未激活
        clearInterval(this.countdownTimer) // 停止定时器
        return
      }

      // 未过期：转换为天、时、分、秒
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000)

      // 格式化为：X天XX时XX分XX秒（补零）
      this.countdown = `${days}天${this.padZero(hours)}时${this.padZero(minutes)}分${this.padZero(seconds)}秒`
      this.isExpired = false
    },

    // 新增：补零函数（如 9 → 09）
    padZero(num) {
      return num < 10 ? `0${num}` : num
    },

    // 新增：续费逻辑（可跳转至续费页面或复用激活逻辑）
    handleRenew() {
      this.$message.info('跳转至续费页面...')
      // 逻辑：可复用激活逻辑（重新发起支付），或跳转至单独的续费页面
      // this.paymentMethod = 'alipay' // 重置支付方式
      // this.isActivated = false // 显示激活表单（实际项目中建议单独做续费页面）
    },

    // 新增：重新激活逻辑（过期后触发）
    handleReactivate() {
      this.isActivated = false // 显示激活表单，重新激活
      this.$message.warning('系统已过期，请重新完成支付以激活')
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

  .activated-subtitle {
    color: #67c23a;
    margin: 0;
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

/* 未激活表单样式（保持不变） */
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

.activation-actions {
  margin-top: 30px;
  text-align: center;
}

/* 已激活样式：到期时间+倒计时 */
.activated-success {
  .expiry-info {
    text-align: center;
    padding: 20px;
    background-color: #f0f9eb;
    border-radius: 8px;

    h3 {
      color: #67c23a;
      margin-bottom: 15px;
    }

    .valid-to {
      font-size: 18px;
      color: #303133;
      margin-bottom: 20px;
    }

    .countdown-container {
      margin-bottom: 25px;
      font-size: 16px;

      .countdown-label {
        color: #666;
        margin-right: 10px;
      }

      .countdown-value {
        color: #f56c6c;
        font-weight: bold;
      }

      .expired {
        color: #ff4d4f;
      }
    }
  }
}
</style>