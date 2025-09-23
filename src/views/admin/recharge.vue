<template>
  <div class="admin-recharge-container">
    <!-- 页面头部：保持与学生界面一致的标题风格 -->
    <div class="page-header">
      <h2>学生账户线下充值</h2>
      <p>为管辖校区内学生进行线下充值，充值后余额即时到账</p>
    </div>

    <!-- 主内容区：用卡片包裹，提升规整度 -->
    <el-card class="recharge-main-card">
      <!-- 筛选区域：校区选择 + 姓名搜索 -->
      <div class="filter-row">
        <div class="form-item filter-item">
          <div class="form-label">选择校区</div>
          <el-select 
            v-model="selectedSchoolId" 
            placeholder="请选择校区（可选）"
            clearable   
            style="width: 100%"
            @change="handleSchoolChange"
          >
            <el-option 
              v-for="school in schoolList" 
              :key="school.id" 
              :label="school.schoolname" 
              :value="school.id"
            ></el-option>
          </el-select>
        </div>
        
        <div class="form-item filter-item">
          <div class="form-label">学生姓名搜索</div>
          <el-input 
            v-model="studentName" 
            placeholder="请输入学生姓名搜索" 
            @keyup.enter.native="searchStudents"
          >
            <el-button 
              slot="append" 
              icon="el-icon-search" 
              @click="searchStudents"
            ></el-button>
          </el-input>
        </div>
      </div>

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
            :label="`${student.name}（ID：${student.id} | 手机号：${student.phone || '未绑定'} | 校区：${getSchoolNameById(student.schoolId)}`" 
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
        
        <!-- 分页控件 -->
        <div class="pagination-container" v-if="totalStudents > 0">
          <el-pagination
            background
            :current-page="currentPage"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="totalStudents"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          ></el-pagination>
        </div>
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
          <!-- 0.01元快捷按钮（满足小额充值场景） -->
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
          min="0.01"
          step="0.01"
          @input="handleCustomAmount"
          @blur="validateCustomAmount"
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
import { getSchoolOptions } from '@/api/campus'
import { mapGetters } from 'vuex'
import { Message } from 'element-ui'

export default {
  name: 'AdminStudentRecharge',
  computed: {
    ...mapGetters(['token', 'adminSchoolId', 'userId']) // 获取管理员ID
  },
  data() {
    return {
      // 校区相关
      schoolList: [], 
      selectedSchoolId: null, 
      
      // 学生相关
      studentList: [], // 管辖校区学生列表
      selectedStudentId: null, // 选中的学生ID
      studentName: '', // 学生姓名搜索
      studentBalance: 0, // 选中学生余额
      balanceLoading: false, // 余额加载状态
      studentSelectLoading: false, // 学生下拉框加载状态
      
      // 分页相关
      currentPage: 1,
      pageSize: 20,
      totalStudents: 0,
      
      // 充值金额相关
      defaultAmounts: [50, 100, 200, 500], // 默认充值金额
      selectedAmount: null, // 选中的充值金额（默认/自定义）
      customAmount: null, // 自定义金额
      amountError: false, // 金额输入错误标记

      loading: false // 提交充值加载状态
    }
  },
  created() {
    // 先加载校区列表，再加载学生
    this.getSchoolsList().then(() => {
      this.getManagedStudentList()
    })
  },
  methods: {
    // 1. 获取校区列表（筛选出当前管理员管辖的校区）
    async getSchoolsList() {
      try {
        const res = await getSchoolOptions()
        // 筛选出当前管理员管辖的校区
        this.schoolList = res.data.filter(school => school.adminId === this.userId) || []
      } catch (err) {
        Message.error(`获取校区列表失败：${err.message || '网络异常'}`)
        this.schoolList = []
      }
    },

    // 2. 获取管辖校区学生列表（支持筛选和分页）
    async getManagedStudentList() {
      this.studentSelectLoading = true
      try {
        const params = {
          token: this.token,
          pageNum: this.currentPage,
          pageSize: this.pageSize,
          schoolId: this.selectedSchoolId || '',
          name: this.studentName || ''
        }
        
        const res = await getManagedStudents(params)
        this.studentList = res.data.content || []
        this.totalStudents = res.data.totalElements || 0
      } catch (err) {
        Message.error(`获取学生列表失败：${err.message || '网络异常'}`)
        this.studentList = []
        this.totalStudents = 0
      } finally {
        this.studentSelectLoading = false
      }
    },

    // 3. 通过schoolId获取学校名称
    getSchoolNameById(schoolId) {
      if (!schoolId) return '未知'
      const matchedSchool = this.schoolList.find(school => school.id === schoolId)
      return matchedSchool ? matchedSchool.schoolname : '未知'
    },

    // 4. 搜索学生
    searchStudents() {
      this.currentPage = 1 
      this.getManagedStudentList()
    },

    // 5. 校区改变时重新加载学生
    handleSchoolChange() {
      this.currentPage = 1
      this.getManagedStudentList()
    },

    // 6. 分页大小改变
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.getManagedStudentList()
    },

    // 7. 当前页改变
    handleCurrentChange(val) {
      this.currentPage = val
      this.getManagedStudentList()
    },

    // 8. 选择学生后，获取其当前余额
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

    // 9. 选择默认金额
    selectAmount(amt) {
      this.selectedAmount = amt
      this.customAmount = null // 清空自定义输入
      this.amountError = false // 清除错误标记
    },

    // 10. 处理自定义金额输入
    handleCustomAmount() {
      const amount = Number(this.customAmount)
      // 校验金额有效性
      if (isNaN(amount) || amount <= 0 || amount > 999999.99) {
        this.selectedAmount = null
        this.amountError = true
      } else {
        this.customAmount = amount.toFixed(2)
        this.selectedAmount = Number(this.customAmount)
        this.amountError = false
      }
    },

    // 11. 自定义金额失焦校验（二次确认）
    validateCustomAmount() {
      const amount = Number(this.customAmount)
      if (this.customAmount && (isNaN(amount) || amount <= 0 || amount > 999999.99)) {
        this.amountError = true
        Message.warning('充值金额需大于0且不超过999999.99元')
      }
    },

    // 12. 提交线下充值
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

      // 找到选中的学生，获取学校信息
      const selectedStudent = this.studentList.find(s => s.id === this.selectedStudentId)
      const studentName = selectedStudent ? selectedStudent.name : '未知'
      const schoolName = selectedStudent ? this.getSchoolNameById(selectedStudent.schoolId) : '未知'

      // 确认弹窗（展示学生信息，避免误操作）
      this.$confirm(
        `<div>确认给以下学生进行线下充值？</div>
        <div style="margin-top:8px;">
        <span>学生：${studentName}</span>
        <span style="margin:0 8px;">|</span>
        <span>ID：${this.selectedStudentId}</span>
        <span style="margin:0 8px;">|</span>
        <span>校区：${schoolName}</span>
        </div>
        <div style="margin-top:4px;">
        <span>充值金额：¥${amount.toFixed(2)}</span>
        <span style="margin:0 8px;">|</span>
        <span style="color:#666;">充值后余额：¥${newBalance}</span>
        </div>`,
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

          // 充值成功反馈
          Message.success({
            message: `
            充值成功！<br>
            订单ID：${res.data.id}<br>
            学生当前余额：¥${newBalance}
            `,
            duration: 5000,
            dangerouslyUseHTMLString: true
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

/* 筛选行 */
.filter-row {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.filter-item {
  flex: 1;
  min-width: 200px;
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

/* 分页容器 */
.pagination-container {
  margin-top: 12px;
  text-align: right;
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
  .filter-row {
    flex-direction: column;
    gap: 24px;
  }
  .pagination-container {
    text-align: center;
  }
}
</style>
