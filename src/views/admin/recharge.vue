<template>
  <div class="admin-recharge-container">
    <!-- 页面头部：保持与学生界面一致的标题风格 -->
    <div class="page-header">
      <h2>学生账户线下充值</h2>
      <p>为管辖校区内学生进行线下充值，充值后余额即时到账</p>
    </div>

    <!-- 主内容区：用卡片包裹，提升规整度 -->
    <el-card class="recharge-main-card">
      <!-- 1. 选择学生（支持搜索，加载状态提示） -->
      <div class="form-item">
        <div class="form-label">选择学生</div>
        <el-select 
          v-model="selectedStudentId" 
          placeholder="请选择需充值的学生（仅显示管辖校区内学生）"
          @change="getStudentBalance"
          filterable  
          clearable   
          style="width: 100%"
          :loading="studentSelectLoading" 
          loading-text="加载学生列表中..."
        >
          <el-option 
            v-for="student in studentList" 
            :key="student.id" 
            :label="`${student.name}（ID：${student.id} | 手机号：${student.phone || '未绑定'}）`" 
            :value="student.id"
          ></el-option>
          <!-- 无学生时显示空提示 -->
          <el-option 
            v-if="studentList.length === 0 && !studentSelectLoading" 
            value="" 
            disabled
          >
            暂无管辖校区内的学生数据
          </el-option>
        </el-select>
      </div>

      <!-- 2. 学生当前余额（醒目展示，带加载状态） -->
      <div class="form-item" v-if="selectedStudentId || balanceLoading">
        <div class="form-label">当前余额</div>
        <el-card class="balance-card">
          <div class="balance-content">
            <div class="balance-desc">
              <span>学生账户余额</span>
              <span class="tips">（线下充值即时到账，可用于预约课程）</span>
            </div>
            <div class="balance-amount">
              {{ balanceLoading ? '获取中...' : `¥${studentBalance.toFixed(2)}` }}
            </div>
          </div>
        </el-card>
      </div>

           <!-- 3. 充值金额（默认金额快捷选择 + 自定义输入） -->
      <div class="form-item">
        <div class="form-label">充值金额</div>
        <!-- 默认金额快捷按钮 -->
        <div class="default-amounts">
          <el-button 
            v-for="amt in defaultAmounts" 
            :key="amt"
            @click="selectAmount(amt)"
            :class="{ 'selected': selectedAmount === amt, 'default-amount-btn': true }"
            size="medium"
          >
            {{ amt }}元
          </el-button>
          <!-- 新增0.01元快捷按钮（满足小额充值场景） -->
          <el-button 
            @click="selectAmount(0.01)"
            :class="{ 'selected': selectedAmount === 0.01, 'default-amount-btn': true }"
            size="medium"
          >
            0.01元
          </el-button>
        </div>
        <!-- 自定义金额输入：修复小数问题 -->
        <el-input 
          v-model="customAmount"  
          placeholder="自定义金额（最小0.01元，支持两位小数）" 
          type="number"
          min="1"
          step="1"
          decimal-places="2"  
          @input="handleCustomAmount"
          @blur="validateCustomAmount"
          @keydown="handleKeyDown"
          style="margin-top: 12px"
          :error="amountError"  
          error-message="请输入大于0.01且不超过两位小数的金额"
        ></el-input>
      </div>

      <!-- 4. 提交充值按钮（居中展示，强化视觉焦点） -->
      <div class="submit-btn-group">
        <el-button 
          type="primary" 
          @click="submitRecharge"
          :disabled="!selectedStudentId || !selectedAmount || loading || amountError"
          :loading="loading"
          size="medium"
          class="recharge-btn"
        >
          确认线下充值
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { adminOfflineRecharge, getManagedStudents } from '@/api/admin'
import { getBalance } from '@/api/payment'
import { mapGetters } from 'vuex'
import { Message } from 'element-ui'

export default {
  name: 'AdminStudentRecharge',
  computed: {
    ...mapGetters(['token', 'adminSchoolId']) // 若有管理员所属校区ID，可用于筛选
  },
  data() {
    return {
      studentList: [], // 管辖校区学生列表
      selectedStudentId: null, // 选中的学生ID
      studentBalance: 0, // 选中学生余额
      balanceLoading: false, // 余额加载状态
      studentSelectLoading: false, // 学生下拉框加载状态

      defaultAmounts: [50, 100, 200, 500], // 默认充值金额
      selectedAmount: null, // 选中的充值金额（默认/自定义）
      customAmount: null, // 自定义金额
      amountError: false, // 金额输入错误标记

      loading: false // 提交充值加载状态
    }
  },
  created() {
    // 页面加载时获取管辖校区学生列表
    this.getManagedStudentList()
  },
  methods: {
    // 1. 获取管辖校区学生列表
    async getManagedStudentList() {
      this.studentSelectLoading = true
      try {
        const res = await getManagedStudents({
          token: this.token,
          page: 1,
          size: 200, // 扩大默认获取数量，减少分页
          schoolId: this.adminSchoolId || '' // 若有校区ID，精准筛选
        })
        // 假设后端返回分页数据，content为学生列表
        this.studentList = res.data.content || []
      } catch (err) {
        Message.error(`获取学生列表失败：${err.message || '网络异常'}`)
        this.studentList = []
      } finally {
        this.studentSelectLoading = false
      }
    },

    // 2. 选择学生后，获取其当前余额
    async getStudentBalance() {
      if (!this.selectedStudentId) return
      this.balanceLoading = true
      try {
        const res = await getBalance(this.selectedStudentId)
        this.studentBalance = Number(res.data) || 0
      } catch (err) {
        Message.error(`获取学生余额失败：${err.message || '数据异常'}`)
        this.studentBalance = 0
      } finally {
        this.balanceLoading = false
      }
    },

    // 3. 选择默认金额
    selectAmount(amt) {
      this.selectedAmount = amt
      this.customAmount = null // 清空自定义输入
      this.amountError = false // 清除错误标记
    },

    // 4. 处理自定义金额输入
    handleCustomAmount() {
      const amount = Number(this.customAmount)
      // 校验金额有效性
      if (isNaN(amount) || amount <= 0) {
        this.selectedAmount = null
        this.amountError = true
      } else {
        this.selectedAmount = amount
        this.amountError = false
      }
    },

    // 5. 自定义金额失焦校验（二次确认）
    validateCustomAmount() {
      const amount = Number(this.customAmount)
      if (this.customAmount && (isNaN(amount) || amount <= 0)) {
        this.amountError = true
        Message.warning('充值金额需大于0且为有效数字')
      }
    },

    // 6. 提交线下充值
    // 6. 提交线下充值
    async submitRecharge() {
    // 二次校验（防止极端情况）
    if (!this.selectedStudentId) {
        Message.warning('请先选择需充值的学生')
        return
    }
    if (!this.selectedAmount || this.selectedAmount <= 0 || isNaN(this.selectedAmount)) {
        Message.warning('请输入有效的充值金额')
        return
    }

    // 处理金额精度问题（避免浮点数计算误差）
    const amount = Number(this.selectedAmount)
    const newBalance = Number((this.studentBalance + amount).toFixed(2))

    // 确认弹窗（展示学生信息，避免误操作）
    this.$confirm(
        `<div>确认给以下学生进行线下充值？</div>
        <div style="margin-top:8px;">
        <span>学生ID：${this.selectedStudentId}</span>
        <span style="margin:0 8px;">|</span>
        <span>充值金额：¥${amount.toFixed(2)}</span>
        </div>
        <div style="margin-top:4px; color:#666;">充值后余额：¥${newBalance}</div>`,
        '确认线下充值',
        {
        confirmButtonText: '确认充值',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: true // 允许HTML内容
        }
    ).then(async () => {
        this.loading = true
        try {
        // 调用充值接口
        const res = await adminOfflineRecharge(
            this.selectedStudentId,
            amount
        )

        // 验证接口返回数据
        if (!res || !res.data || !res.data.id) {
            throw new Error('接口返回数据格式异常')
        }

        // 充值成功反馈（修复HTML显示和时长设置）
        Message.success({
            message: `
            充值成功！<br>
            订单ID：${res.data.id}<br>
            学生当前余额：¥${newBalance}
            `,
            duration: 5000, // 正确设置提示时长
            dangerouslyUseHTMLString: true // 允许解析HTML换行
        })

        // 刷新余额 + 重置金额选择（方便继续充值）
        await this.getStudentBalance()
        this.selectedAmount = null
        this.customAmount = null
        } catch (err) {
        Message.error(`充值失败：${err.message || '服务器异常，请稍后重试'}`)
        } finally {
        this.loading = false
        }
    }).catch(() => {
        Message.info('已取消充值操作')
    })
    }
  }
}
</script>

<style scoped>
/* 整体容器：对齐学生界面的宽度和间距 */
.admin-recharge-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面头部：保持风格统一 */
.page-header {
  margin-bottom: 24px;
}
.page-header h2 {
  font-size: 18px;
  color: #333;
  margin: 0 0 8px 0;
}
.page-header p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

/* 主卡片：统一边框和内边距 */
.recharge-main-card {
  padding: 24px;
  margin-bottom: 20px;
}

/* 表单项：统一标签和输入区的间距 */
.form-item {
  margin-bottom: 24px;
}
.form-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  display: inline-block;
}

/* 余额卡片：醒目展示，浅背景区分 */
.balance-card {
  background-color: #f5f7fa;
  border: none;
  padding: 16px;
}
.balance-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.balance-desc {
  font-size: 14px;
  color: #666;
}
.balance-desc .tips {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}
.balance-amount {
  font-size: 24px;
  font-weight: 700;
  color: #409eff; /* 主色调，突出金额 */
}

/* 默认金额按钮：hover和选中状态区分 */
.default-amounts {
  display: flex;
  gap: 12px;
  flex-wrap: wrap; /* 响应式换行 */
}
.default-amount-btn {
  border: 1px solid #dcdfe6;
  color: #666;
  background-color: #fff;
}
.default-amount-btn:hover {
  border-color: #409eff;
  color: #409eff;
}
.default-amount-btn.selected {
  background-color: #409eff;
  color: #fff;
  border-color: #409eff;
}

/* 提交按钮组：居中展示，强化视觉焦点 */
.submit-btn-group {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}
.recharge-btn {
  min-width: 180px;
  height: 44px;
  font-size: 16px;
}

/* 适配小屏幕：保证移动端体验 */
@media (max-width: 768px) {
  .recharge-main-card {
    padding: 16px;
  }
  .default-amounts {
    gap: 8px;
  }
  .balance-amount {
    font-size: 20px;
  }
}
</style>