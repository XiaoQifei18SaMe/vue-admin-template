<template>
  <div class="student-account-container">
    <div class="page-header">
      <h2>我的账户</h2>
      <p>充值账户余额并查看交易记录</p>
    </div>

    <el-card class="balance-card">
      <div class="balance-info">
        <div class="balance-label">当前余额</div>
        <div class="balance-amount">¥ {{ balance !== null ? balance.toFixed(2) : '0.00' }}</div>
        <div class="balance-desc">
          余额可用于预约课程，支持多种充值方式
        </div>
      </div>
      <el-button 
        type="primary" 
        class="recharge-btn"
        @click="showRechargeDialog = true"
      >
        立即充值
      </el-button>
    </el-card>

    <!-- 充值弹窗 -->
    <el-dialog 
      title="账户充值" 
      :visible.sync="showRechargeDialog"
      width="500px"
      :close-on-click-modal="false"
    >
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
          @input="handleCustomAmount"
          min="1"
        ></el-input>
      </div>

      <div slot="footer">
        <el-button @click="showRechargeDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="createPayment"
          :disabled="!selectedAmount || !paymentMethod"
        >
          确认充值
        </el-button>
      </div>
    </el-dialog>

    <!-- 二维码支付弹窗 -->
    <el-dialog 
      title="请扫码支付" 
      :visible.sync="qrCodeVisible"
      width="30%"
    >
      <div class="qr-code-container">
        <img :src="qrCodeUrl" alt="支付二维码" v-if="qrCodeUrl">
        <p>请使用{{ paymentMethod === 'WECHAT' ? '微信' : '支付宝' }}扫描二维码支付</p>
        <p>金额: ¥{{ selectedAmount ? selectedAmount.toFixed(2) : '0.00' }}</p>
      </div>
      <div slot="footer">
        <el-button @click="cancelPayment">取消支付</el-button>
        <el-button type="primary" @click="confirmPayment">确认已支付</el-button>
      </div>
    </el-dialog>

    <el-card class="transaction-card">
      <div slot="header" class="transaction-header">
        <h3>交易记录</h3>
        <div class="transaction-filters">
          <el-select 
            v-model="transactionStatus" 
            placeholder="选择状态" 
            clearable
            @change="handleFilterChange"
            style="width: 150px; margin-right: 10px;"
          >
            <el-option label="全部状态" value=""></el-option>
            <el-option label="处理中" value="PENDING"></el-option>
            <el-option label="成功" value="SUCCESS"></el-option>
            <el-option label="失败" value="FAILED"></el-option>
            <el-option label="已退款" value="REFUNDED"></el-option>
          </el-select>
          <el-select 
            v-model="paymentMethodFilter" 
            placeholder="支付方式" 
            clearable
            @change="handleFilterChange"
            style="width: 150px;"
          >
            <el-option label="全部方式" value=""></el-option>
            <el-option label="微信支付" value="WECHAT"></el-option>
            <el-option label="支付宝" value="ALIPAY"></el-option>
            <el-option label="线下支付" value="OFFLINE"></el-option>
            <el-option label="账户扣款" value="ACCOUNT"></el-option>
          </el-select>
        </div>
      </div>
      
      <el-table
        :data="transactions"
        border
        stripe
        style="width: 100%;"
        v-loading="loading"
      >
        <el-table-column prop="id" label="交易ID" width="100" align="center"></el-table-column>
        <el-table-column prop="amount" label="金额" align="center">
          <template slot-scope="scope">
            <!-- 根据状态判断显示样式 -->
            <template v-if="['PENDING', 'FAILED'].includes(scope.row.status)">
              <!-- 处理中和失败状态：不显示符号，使用特殊颜色 -->
              <span :class="scope.row.status === 'PENDING' ? 'pending' : 'failed'">
                ¥{{ Math.abs(scope.row.amount).toFixed(2) }}
              </span>
            </template>
            <template v-else>
              <!-- 其他状态：显示符号和对应颜色 -->
              <span :class="scope.row.amount > 0 ? 'income' : 'expense'">
                {{ scope.row.amount > 0 ? '+' : '-' }}¥{{ Math.abs(scope.row.amount).toFixed(2) }}
              </span>
            </template>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" align="center">
          <template slot-scope="scope">
            <el-tag :type="getMethodTagType(scope.row.paymentMethod)">
              {{ getMethodText(scope.row.paymentMethod) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" align="center">
          <template slot-scope="scope">{{ formatTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="payTime" label="支付时间" align="center">
          <template slot-scope="scope">{{ formatTime(scope.row.payTime) || '-' }}</template>
        </el-table-column>
      </el-table>
      
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="page"
        :page-sizes="[10, 20, 50]"
        :page-size="size"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        style="margin-top: 15px; text-align: right;"
      ></el-pagination>
    </el-card>
  </div>
</template>

<script>
import { getBalance, createPayment, confirmPayment, cancelPayment, getPaymentRecords } from '@/api/payment'
import { Message } from 'element-ui'
import { mapGetters } from 'vuex'

export default {
  name: 'StudentRecharge',
  computed: {
    ...mapGetters(['userId', 'role'])
  },
  data() {
    return {
      balance: null,
      showRechargeDialog: false,
      paymentMethod: '',
      defaultAmounts: [30, 50, 80, 150, 200],
      selectedAmount: null,
      customAmount: null,
      qrCodeVisible: false,
      qrCodeUrl: '',
      currentRecordId: null,
      
      // 交易记录相关
      transactions: [],
      total: 0,
      page: 1,
      size: 10,
      transactionStatus: '',
      paymentMethodFilter: '',
      loading: false
    }
  },
  created() {
    if (this.role === 'student') {
      this.fetchBalance()
      this.fetchTransactions()
    } else {
      this.$router.push('/404')
    }
  },
  methods: {
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return date.toLocaleString()
    },
    getStatusText(status) {
      switch(status) {
        case 'PENDING': return '处理中';
        case 'SUCCESS': return '成功';
        case 'FAILED': return '失败';
        case 'REFUNDED': return '已退款';
        default: return status;
      }
    },
    getStatusTagType(status) {
      switch(status) {
        case 'SUCCESS': return 'success';
        case 'PENDING': return 'warning';
        case 'FAILED': return 'danger';
        case 'REFUNDED': return 'info';
        default: return 'default';
      }
    },
    getMethodText(method) {
      switch(method) {
        case 'WECHAT': return '微信支付';
        case 'ALIPAY': return '支付宝';
        case 'OFFLINE': return '线下支付';
        case 'ACCOUNT': return '账户扣款';
        default: return method;
      }
    },
    getMethodTagType(method) {
      switch(method) {
        case 'WECHAT': return 'success';
        case 'ALIPAY': return 'info';
        case 'OFFLINE': return 'warning';
        case 'ACCOUNT': return 'primary';
        default: return 'default';
      }
    },
    async fetchBalance() {
      try {
        const res = await getBalance(this.userId)
        this.balance = Number(res.data) || 0
      } catch (err) {
        Message.error(err.message || '获取余额失败')
        this.balance = 0
      }
    },
    async fetchTransactions() {
      this.loading = true
      try {
        const res = await getPaymentRecords({
          studentId: this.userId,
          page: this.page - 1,// 关键：前端页码减1传给后端
          size: this.size,
          status: this.transactionStatus,
          method: this.paymentMethodFilter
        })
        this.transactions = res.data.content || []
        this.total = res.data.totalElements || 0
      } catch (err) {
        Message.error(err.message || '获取交易记录失败')
      } finally {
        this.loading = false
      }
    },
    handleFilterChange() {
      this.page = 1
      this.fetchTransactions()
    },
    handleSizeChange(val) {
      this.size = val
      this.fetchTransactions()
    },
    handleCurrentChange(val) {
      this.page = val
      this.fetchTransactions()
    },
    selectAmount(amt) {
      this.selectedAmount = amt
      this.customAmount = null
    },
    handleCustomAmount() {
      const amount = Number(this.customAmount)
      if (amount && amount > 0) {
        this.selectedAmount = amount
      } else {
        this.selectedAmount = null
      }
    },
    createPayment() {
      if (isNaN(this.selectedAmount) || this.selectedAmount <= 0) {
        this.$message.error('请输入有效的充值金额')
        return
      }
      
      createPayment({
        studentId: this.userId,
        amount: this.selectedAmount,
        method: this.paymentMethod
      }).then(res => {
        this.qrCodeUrl = res.data.qrCodeUrl
        this.currentRecordId = res.data.id
        this.qrCodeVisible = true
        this.showRechargeDialog = false
      }).catch(err => {
        console.error('创建支付失败:', err)
        this.$message.error('创建支付失败，请稍后重试')
      })
    },
    confirmPayment() {
      confirmPayment(this.currentRecordId).then(res => {
        this.$message.success('支付成功，余额已更新')
        this.qrCodeVisible = false
        this.fetchBalance()
        this.fetchTransactions()
        this.resetPaymentForm()
      }).catch(err => {
        console.error('确认支付失败:', err)
        this.$message.error('确认支付失败，请稍后重试')
      })
    },
    cancelPayment() {
      cancelPayment(this.currentRecordId).then(res => {
        this.$message.info('已取消支付')
        this.qrCodeVisible = false
        this.resetPaymentForm()
      }).catch(err => {
        console.error('取消支付失败:', err)
        this.$message.error('取消支付失败，请稍后重试')
      })
    },
    resetPaymentForm() {
      this.selectedAmount = null
      this.customAmount = null
      this.paymentMethod = ''
      this.currentRecordId = null
      this.qrCodeUrl = ''
    }
  }
}
</script>

<style scoped>
.student-account-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0 0 10px 0;
  font-size: 18px;
  color: #333;
}

.page-header p {
  margin: 0;
  color: #666;
}

.balance-card {
  margin-bottom: 20px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance-info {
  flex: 1;
}

.balance-label {
  font-size: 16px;
  color: #666;
  margin-bottom: 10px;
}

.balance-amount {
  font-size: 32px;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.balance-desc {
  color: #999;
  font-size: 14px;
}

.recharge-btn {
  min-width: 120px;
}

.transaction-card {
  margin-bottom: 20px;
}

.transaction-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.transaction-filters {
  display: flex;
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

.payment-method {
  margin: 20px 0;
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

/* 金额样式调整 */
.income {
  color: #42b983; /* 绿色 - 收入 */
  font-weight: 500;
}

.expense {
  color: #f56c6c; /* 红色 - 支出 */
  font-weight: 500;
}

.pending {
  color: #e6a23c; /* 黄色 - 处理中 */
  font-weight: 500;
}

.failed {
  color: #ffffff; /* 白色 - 失败 */
  background-color: #f56c6c; /* 红色背景 */
  padding: 2px 4px;
  border-radius: 3px;
  font-weight: 500;
}

.refund {
  color: #1890ff;
}
</style>
