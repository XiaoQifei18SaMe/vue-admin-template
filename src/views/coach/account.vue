<template>
  <div class="coach-account-container">
    <div class="page-header">
      <h2>我的账户</h2>
      <p>查看您的账户余额及交易记录</p>
    </div>

    <el-card class="balance-card">
      <div class="balance-info">
        <div class="balance-label">当前余额</div>
        <div class="balance-amount">¥ {{ balance.toFixed(2) }}</div>
        <div class="balance-desc">
          余额来源于课程收入，可随时申请提现
        </div>
      </div>
      <el-button 
        type="primary" 
        class="withdraw-btn"
        @click="handleWithdraw"
        :loading="withdrawLoading"
      >
        申请提现
      </el-button>
    </el-card>

    <el-card class="transaction-card">
      <div slot="header" class="transaction-header">
        <h3>交易记录</h3>
        <el-select 
          v-model="transactionType" 
          placeholder="选择交易类型" 
          clearable
          @change="handleTypeChange"
          style="width: 200px;"
        >
          <el-option label="全部交易" value=""></el-option>
          <el-option label="课程收入" value="COURSE_INCOME"></el-option>
          <el-option label="提现" value="WITHDRAW"></el-option>
        </el-select>
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
            <span :class="scope.row.type === 'COURSE_INCOME' ? 'income' : 'expense'">
              {{ scope.row.type === 'COURSE_INCOME' ? '+' : '-' }}¥{{ 
                (scope.row.type === 'COURSE_INCOME' ? scope.row.amount : Math.abs(scope.row.amount)).toFixed(2) 
              }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="交易类型" align="center">
          <template slot-scope="scope">
            <el-tag :type="scope.row.type === 'COURSE_INCOME' ? 'success' : 'info'">
              {{ scope.row.type === 'COURSE_INCOME' ? '课程收入' : '提现' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="relatedId" label="关联ID" align="center">
          <template slot-scope="scope">
            <span v-if="scope.row.type === 'COURSE_INCOME'">
              课程 #{{ scope.row.relatedId }}
            </span>
            <span v-else>
              提现 #{{ scope.row.relatedId }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="交易时间" align="center">
          <template slot-scope="scope">{{ formatTime(scope.row.createTime) }}</template>
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

    <!-- 提现申请弹窗 -->
    <el-dialog
      title="申请提现"
      :visible.sync="showWithdrawDialog"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="withdrawForm"
        :model="withdrawForm"
        :rules="withdrawRules"
        label-width="120px"
      >
        <el-form-item label="提现金额" prop="amount">
          <el-input
            v-model="withdrawForm.amount"
            placeholder="请输入提现金额"
            type="number"
            min="100"
            step="100"
            @input="handleAmountInput"
          >
            <template slot="append">元</template>
          </el-input>
          <div class="form-hint">最低提现金额为100元，每次提现需为100元的整数倍</div>
        </el-form-item>
        
        <el-form-item label="当前余额" disabled>
          <el-input :value="balance.toFixed(2)" disabled>
            <template slot="append">元</template>
          </el-input>
        </el-form-item>
        
        <el-form-item label="银行名称" prop="bankName">
          <el-input
            v-model="withdrawForm.bankName"
            placeholder="请输入银行名称"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="银行账号" prop="bankAccount">
          <el-input
            v-model="withdrawForm.bankAccount"
            placeholder="请输入银行账号"
          ></el-input>
        </el-form-item>
        
        <el-form-item label="账户持有人" prop="accountHolder">
          <el-input
            v-model="withdrawForm.accountHolder"
            placeholder="请输入账户持有人姓名"
          ></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="showWithdrawDialog = false">取消</el-button>
        <el-button type="primary" @click="submitWithdraw">确认提现</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getCoachAccountBalance, getAccountTransactions, submitWithdrawApplication } from '@/api/coach'
import { Message } from 'element-ui'
import { mapGetters } from 'vuex'

export default {
  name: 'CoachAccount',
  computed: {
    ...mapGetters(['userId', 'role'])
  },
  data() {
    return {
      balance: 0,
      transactions: [],
      total: 0,
      page: 1,
      size: 10,
      transactionType: '',
      loading: false,
      withdrawLoading: false,
      showWithdrawDialog: false,
      withdrawForm: {
        amount: null,
        bankAccount: '',
        bankName: '',
        accountHolder: ''
      },
      withdrawRules: {
        amount: [
          { required: true, message: '请输入提现金额', trigger: ['blur', 'input'] },
          { 
            validator: (rule, value, callback) => {
              // 检查是否为有效数字
              if (isNaN(value) || value === null || value === '') {
                callback(new Error('请输入有效的金额'))
              } 
              // 检查最低金额
              else if (value < 100) {
                callback(new Error('最低提现金额为100元'))
              }
              // 检查是否为100的整数倍
              else if (value % 100 !== 0) {
                callback(new Error('提现金额需为100元的整数倍'))
              }
              // 检查是否超过余额
              else if (value > this.balance) {
                callback(new Error('提现金额不能超过当前余额'))
              } else {
                callback()
              }
            },
            trigger: ['blur', 'input']
          }
        ],
        bankName: [
          { required: true, message: '请输入银行名称', trigger: 'blur' }
        ],
        bankAccount: [
          { required: true, message: '请输入银行账号', trigger: 'blur' }
        ],
        accountHolder: [
          { required: true, message: '请输入账户持有人姓名', trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    if (this.role === 'coach') {
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
        case 'SUCCESS': return '已完成';
        case 'PENDING': return '处理中';
        case 'FAILED': return '失败';
        default: return status;
      }
    },
    getStatusTagType(status) {
      switch(status) {
        case 'SUCCESS': return 'success';
        case 'PENDING': return 'warning';
        case 'FAILED': return 'danger';
        default: return 'default';
      }
    },
    async fetchBalance() {
      try {
        const res = await getCoachAccountBalance(this.userId)
        this.balance = res.data || 0
      } catch (err) {
        Message.error(err.message || '获取余额失败')
      }
    },
    async fetchTransactions() {
      this.loading = true
      try {
        const res = await getAccountTransactions(this.userId, this.page, this.size, this.transactionType)
        this.transactions = res.data.content || []
        this.total = res.data.totalElements || 0
      } catch (err) {
        Message.error(err.message || '获取交易记录失败')
      } finally {
        this.loading = false
      }
    },
    handleTypeChange() {
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
    handleWithdraw() {
      if (this.balance < 100) {
        Message.warning('余额不足100元，无法提现')
        return
      }
      this.showWithdrawDialog = true
    },
    // 处理金额输入，确保是100的整数倍
    handleAmountInput() {
      if (this.withdrawForm.amount) {
        // 确保值是数字
        const value = Number(this.withdrawForm.amount)
        if (!isNaN(value)) {
          // 确保值是100的整数倍
          if (value % 100 !== 0) {
            this.withdrawForm.amount = Math.floor(value / 100) * 100
          }
          // 确保不小于100
          if (this.withdrawForm.amount < 100) {
            this.withdrawForm.amount = 100
          }
        }
      }
    },
    async submitWithdraw() {
      this.$refs.withdrawForm.validate(async (valid) => {
        if (valid) {
          this.withdrawLoading = true
          try {
            const withdrawData = {
              coachId: this.userId,
              amount: this.withdrawForm.amount,
              bankAccount: this.withdrawForm.bankAccount,
              bankName: this.withdrawForm.bankName,
              accountHolder: this.withdrawForm.accountHolder
            }
            
            await submitWithdrawApplication(withdrawData)
            
            Message.success('提现申请已提交，已自动处理完成')
            this.showWithdrawDialog = false
            this.withdrawForm = {
              amount: null,
              bankAccount: '',
              bankName: '',
              accountHolder: ''
            }
            this.fetchBalance()
            this.fetchTransactions()
          } catch (err) {
            Message.error(err.message || '提交提现申请失败')
          } finally {
            this.withdrawLoading = false
          }
        }
      })
    }
  }
}
</script>

<style scoped>
/* 样式保持不变 */
.coach-account-container {
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

.withdraw-btn {
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

.income {
  color: #42b983;
}

.expense {
  color: #f56c6c;
}

.form-hint {
  color: #999;
  font-size: 12px;
  margin-top: 5px;
}
</style>
    