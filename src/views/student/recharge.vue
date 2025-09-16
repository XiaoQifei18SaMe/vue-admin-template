<!-- src/views/student/recharge/index.vue -->
<template>
  <div class="recharge-container">
    <el-card>
      <div slot="header">
        <h2>账户充值</h2>
      </div>
      
      <div class="balance-info">
        <!-- 修复：添加非空判断，确保balance有值再调用toFixed -->
        <p>当前余额: ¥{{ balance !== null && balance !== undefined ? balance.toFixed(2) : '0.00' }}</p>
      </div>

      <div class="payment-method">
        <el-radio-group v-model="paymentMethod">
          <el-radio label="WECHAT">微信支付</el-radio>
          <el-radio label="ALIPAY">支付宝支付</el-radio>
        </el-radio-group>
      </div>

      <div class="amount-select">
        <el-button 
          v-for="amt in defaultAmounts" 
          :key="amt"
          @click="selectAmount(amt)"
          :class="{ 'selected': selectedAmount === amt }"
        >
          {{ amt }}元
        </el-button>
        <el-input 
          v-model="customAmount" 
          placeholder="自定义金额" 
          type="number"
          @change="handleCustomAmount"
        ></el-input>
      </div>

      <el-button 
        type="primary" 
        @click="createPayment"
        :disabled="!selectedAmount || !paymentMethod"
      >
        确认充值
      </el-button>

      <!-- 二维码弹窗 -->
      <el-dialog 
        title="请扫码支付" 
        :visible.sync="qrCodeVisible"
        width="30%"
      >
        <div class="qr-code-container">
          <img :src="qrCodeUrl" alt="支付二维码" v-if="qrCodeUrl">
          <p>请使用{{ paymentMethod === 'WECHAT' ? '微信' : '支付宝' }}扫描二维码支付</p>
          <!-- 修复：selectedAmount也需要非空判断 -->
          <p>金额: ¥{{ selectedAmount ? selectedAmount.toFixed(2) : '0.00' }}</p>
        </div>
        <div slot="footer">
          <el-button @click="cancelPayment">取消支付</el-button>
          <el-button type="primary" @click="confirmPayment">确认已支付</el-button>
        </div>
      </el-dialog>
    </el-card>
  </div>
</template>

<script>
import { getBalance, createPayment, confirmPayment, cancelPayment } from '@/api/payment'

export default {
  data() {
    return {
      balance: null, // 初始值设为null更合理，明确表示未加载状态
      paymentMethod: '',
      defaultAmounts: [30, 50, 80, 150, 200],
      selectedAmount: null,
      customAmount: null,
      qrCodeVisible: false,
      qrCodeUrl: '',
      currentRecordId: null
    }
  },
  created() {
    this.fetchBalance()
  },
  methods: {
    fetchBalance() {
      const studentId = this.$store.getters.userId
      if (!studentId) {
        this.$message.error('未获取到用户信息，请重新登录')
        return
      }
      getBalance(studentId)
        .then(res => {
          // 确保余额是数字类型
          this.balance = Number(res.data) || 0
        })
        .catch(err => {
          console.error('获取余额失败:', err)
          this.$message.error('获取余额失败，请稍后重试')
          this.balance = 0 // 错误时默认显示0
        })
    },
    selectAmount(amt) {
      this.selectedAmount = amt
      this.customAmount = null
    },
    handleCustomAmount() {
      // 确保输入的是有效数字
      const amount = Number(this.customAmount)
      if (amount && amount > 0) {
        this.selectedAmount = amount
      } else {
        this.selectedAmount = null
      }
    },
    createPayment() {
      // 再次验证金额有效性
      if (isNaN(this.selectedAmount) || this.selectedAmount <= 0) {
        this.$message.error('请输入有效的充值金额')
        return
      }
      
      const studentId = this.$store.getters.userId
      createPayment({
        studentId,
        amount: this.selectedAmount,
        method: this.paymentMethod
      }).then(res => {
        this.qrCodeUrl = res.data.qrCodeUrl
        this.currentRecordId = res.data.id
        this.qrCodeVisible = true
      }).catch(err => {
        console.error('创建支付失败:', err)
        this.$message.error('创建支付失败，请稍后重试')
      })
    },
    confirmPayment() {
      confirmPayment(this.currentRecordId).then(res => {
        this.$message.success('支付成功，余额已更新')
        this.qrCodeVisible = false
        this.fetchBalance() // 刷新余额
      }).catch(err => {
        console.error('确认支付失败:', err)
        this.$message.error('确认支付失败，请稍后重试')
      })
    },
    cancelPayment() {
      cancelPayment(this.currentRecordId).then(res => {
        this.$message.info('已取消支付')
        this.qrCodeVisible = false
      }).catch(err => {
        console.error('取消支付失败:', err)
        this.$message.error('取消支付失败，请稍后重试')
      })
    }
  }
}
</script>

<style scoped>
/* 样式保持不变 */
.recharge-container {
  padding: 20px;
}
.balance-info {
  margin: 20px 0;
  font-size: 18px;
}
.payment-method {
  margin: 20px 0;
}
.amount-select {
  margin: 20px 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.amount-select .el-button {
  margin-bottom: 10px;
}
.selected {
  background-color: #409EFF;
  color: white;
}
.qr-code-container {
  text-align: center;
  padding: 20px;
}
.qr-code-container img {
  width: 200px;
  height: 200px;
  margin-bottom: 10px;
}
</style>