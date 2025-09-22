<template>
  <div class="admin-recharge-container">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>学生账户线下充值</h2>
      <p>为所有校区学生进行线下充值，充值后余额即时到账</p>
    </div>

    <!-- 主内容区 -->
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

      <!-- 选择学生：将student.schoolName改为通过schoolId匹配 -->
      <div class="form-item">
        <div class="form-label">选择学生</div>
        <el-select 
          v-model="selectedStudentId" 
          placeholder="请选择需充值的学生（所有校区）"
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
          <el-option 
            v-if="studentList.length === 0 && !studentSelectLoading" 
            value="" 
            disabled
          >
            暂无学生数据
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

      <!-- 学生当前余额 -->
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

      <!-- 充值金额 -->
      <div class="form-item">
        <div class="form-label">充值金额</div>
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
          <el-button 
            @click="selectAmount(0.01)"
            :class="{ 'selected': selectedAmount === 0.01, 'default-amount-btn': true }"
            size="medium"
          >
            0.01元
          </el-button>
        </div>
        <el-input 
          v-model="customAmount"  
          placeholder="自定义金额（最小0.01元，支持两位小数）" 
          type="number"
          step="1"
          min="1"
          @input="handleCustomAmount"
          @blur="validateCustomAmount"
          style="margin-top: 12px"
          :error="amountError"  
          error-message="请输入大于0.01且不超过两位小数的金额"
        ></el-input>
      </div>

      <!-- 提交充值按钮 -->
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
import { superAdminOfflineRecharge, getAllStudents, getSchools } from '@/api/super_admin'
import { getBalance } from '@/api/payment'
import { mapGetters } from 'vuex'
import { Message } from 'element-ui'

export default {
  name: 'SuperAdminStudentRecharge',
  computed: {
    ...mapGetters(['token'])
  },
  data() {
    return {
      // 校区相关：存储所有校区信息，用于ID转名称
      schoolList: [], 
      selectedSchoolId: null, 
      
      // 学生相关：学生列表仅含schoolId，无schoolName
      studentList: [], 
      selectedStudentId: null, 
      studentName: '', 
      studentBalance: 0, 
      balanceLoading: false, 
      studentSelectLoading: false, 
      
      // 分页相关
      currentPage: 1,
      pageSize: 20,
      totalStudents: 0,
      
      // 充值金额相关
      defaultAmounts: [50, 100, 200, 500], 
      selectedAmount: null, 
      customAmount: null, 
      amountError: false, 

      loading: false 
    }
  },
  created() {
    // 先加载校区列表（确保后续学生能匹配到校区名称），再加载学生
    this.getSchoolsList().then(() => {
      this.getStudentsList()
    })
  },
  methods: {
    // 1. 获取所有校区列表（优先加载，为ID转名称做准备）
    async getSchoolsList() {
      try {
        const res = await getSchools()
        this.schoolList = res.data || []
      } catch (err) {
        Message.error(`获取校区列表失败：${err.message || '网络异常'}`)
        this.schoolList = []
      }
    },

    // 2. 获取学生列表（支持筛选和分页）
    async getStudentsList() {
      this.studentSelectLoading = true
      try {
        const params = {
          token: this.token,
          page: this.currentPage,
          size: this.pageSize,
          schoolId: this.selectedSchoolId || '',
          name: this.studentName || ''
        }
        
        const res = await getAllStudents(params)
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

    // 3. 核心方法：通过schoolId从schoolList中匹配校区名称
    // 处理场景：schoolId为空、校区未找到、schoolList未加载完成
    getSchoolNameById(schoolId) {
      // 若schoolId为空，直接返回"未知"
      if (!schoolId) return '未知'
      // 从校区列表中匹配ID，找到则返回校区名（用schoolname字段，与下拉框一致）
      const matchedSchool = this.schoolList.find(school => school.id === schoolId)
      // 匹配成功返回名称，失败返回"未知"
      return matchedSchool ? matchedSchool.schoolname : '未知'
    },

    // 4. 搜索学生
    searchStudents() {
      this.currentPage = 1 
      this.getStudentsList()
    },

    // 5. 校区改变时重新加载学生
    handleSchoolChange() {
      this.currentPage = 1
      this.getStudentsList()
    },

    // 6. 分页大小改变
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.getStudentsList()
    },

    // 7. 当前页改变
    handleCurrentChange(val) {
      this.currentPage = val
      this.getStudentsList()
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
      this.customAmount = null 
      this.amountError = false 
    },

    // 10. 处理自定义金额输入
    handleCustomAmount() {
      const amount = Number(this.customAmount)
      if (isNaN(amount) || amount <= 0 || amount > 999999.99) {
        this.selectedAmount = null
        this.amountError = true
      } else {
        this.customAmount = amount.toFixed(2)
        this.selectedAmount = Number(this.customAmount)
        this.amountError = false
      }
    },

    // 11. 自定义金额失焦校验
    validateCustomAmount() {
      const amount = Number(this.customAmount)
      if (this.customAmount && (isNaN(amount) || amount <= 0 || amount > 999999.99)) {
        this.amountError = true
        Message.warning('充值金额需大于0且不超过999999.99元')
      }
    },

    // 12. 提交线下充值：确认弹窗中校区名称也通过ID匹配
    async submitRecharge() {
      if (!this.selectedStudentId) {
        Message.warning('请先选择需充值的学生')
        return
      }
      if (!this.selectedAmount || this.selectedAmount <= 0 || isNaN(this.selectedAmount)) {
        Message.warning('请输入有效的充值金额')
        return
      }

      const amount = Number(this.selectedAmount)
      const newBalance = Number((this.studentBalance + amount).toFixed(2))

      // 找到选中的学生，通过student.schoolId匹配校区名称
      const selectedStudent = this.studentList.find(s => s.id === this.selectedStudentId)
      const studentName = selectedStudent ? selectedStudent.name : '未知'
      // 核心修改：调用getSchoolNameById获取校区名称
      const schoolName = selectedStudent ? this.getSchoolNameById(selectedStudent.schoolId) : '未知'

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
          dangerouslyUseHTMLString: true
        }
      ).then(async () => {
        this.loading = true
        try {
          const res = await superAdminOfflineRecharge(
            this.selectedStudentId,
            amount
          )

          if (!res || !res.data || !res.data.id) {
            throw new Error('接口返回数据格式异常')
          }

          Message.success({
            message: `
            充值成功！<br>
            订单ID：${res.data.id}<br>
            学生当前余额：¥${newBalance}
            `,
            duration: 5000,
            dangerouslyUseHTMLString: true
          })

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
/* 整体容器 */
.admin-recharge-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面头部 */
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

/* 主卡片 */
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

/* 表单项 */
.form-item {
  margin-bottom: 24px;
}
.form-label {
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  display: inline-block;
}

/* 余额卡片 */
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
  color: #409eff;
}

/* 默认金额按钮 */
.default-amounts {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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

/* 提交按钮组 */
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

/* 适配小屏幕 */
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