<template>
  <div class="monthly-match-management">
    <div class="page-header">
      <h2>月赛管理</h2>
      <el-button 
        type="primary" 
        @click="handleAddMatch"
      >
        <i class="el-icon-plus"></i> 新增比赛
      </el-button>
    </div>

    <!-- 筛选区域 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="年份">
          <el-select v-model="filterForm.year" placeholder="选择年份">
            <el-option 
              v-for="year in availableYears" 
              :key="year" 
              :label="year.toString()" 
              :value="year"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="月份">
          <el-select v-model="filterForm.month" placeholder="选择月份">
            <el-option 
              v-for="month in 12" 
              :key="month" 
              :label="month.toString()" 
              :value="month"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchMatches">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 比赛列表（移除分页组件，直接显示全量数据） -->
    <el-card class="match-list-card">
      <el-table
        :data="matchList" 
        border
        style="width: 100%"
        v-loading="loading"
      >
        <el-table-column prop="id" label="ID" width="80"></el-table-column>
        <el-table-column prop="title" label="比赛标题"></el-table-column>
        <el-table-column label="开始时间">
          <template slot-scope="scope">
            {{ formatDateTimeForDisplay(scope.row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="报名截止时间">
          <template slot-scope="scope">
            {{ formatDateTimeForDisplay(scope.row.registrationDeadline) }}
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template slot-scope="scope">
            <el-tag 
              :type="getStatusType(scope.row.status)"
            >
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="280">
          <template slot-scope="scope">
            <el-button 
              size="mini" 
              type="primary" 
              @click="handleEditMatch(scope.row)"
              :disabled="scope.row.status === 'COMPLETED'"
            >
              编辑
            </el-button>
            <el-button 
              size="mini" 
              type="success" 
              @click="handleArrangeSchedule(scope.row.id)"
              :disabled="!canArrangeSchedule(scope.row.status)"
            >
              安排赛程
            </el-button>
            <el-button 
              size="mini" 
              type="warning" 
              @click="handleViewSchedule(scope.row.id)"
              :disabled="!scope.row.hasSchedule"
            >
              查看赛程
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 移除分页组件 -->
    </el-card>

    <!-- 新增/编辑比赛弹窗（无修改） -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form 
        ref="matchForm" 
        :model="formData" 
        :rules="formRules" 
        label-width="150px"
      >
        <el-form-item label="比赛标题" prop="title">
          <el-input v-model="formData.title" placeholder="请输入比赛标题"></el-input>
        </el-form-item>
        <el-form-item label="比赛开始时间" prop="startTime">
          <el-date-picker
            v-model="formData.startTime"
            type="datetime"
            placeholder="选择比赛开始时间"
            format="yyyy-MM-dd HH:mm"
            value-format="yyyy-MM-ddTHH:mm:ss" 
            :disabled-date="disabledPastDate"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="报名截止时间" prop="registrationDeadline">
          <el-date-picker
            v-model="formData.registrationDeadline"
            type="datetime"
            placeholder="选择报名截止时间"
            format="yyyy-MM-dd HH:mm"
            value-format="yyyy-MM-ddTHH:mm:ss" 
            :disabled-date="disabledPastDate"
            :disabled="!formData.startTime"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="比赛状态" prop="status" v-if="formData.id">
          <el-select v-model="formData.status" placeholder="选择状态">
            <el-option label="未开始" value="NOT_STARTED"></el-option>
            <el-option label="报名中" value="REGISTERING"></el-option>
            <el-option label="报名截止" value="REGISTRATION_CLOSED"></el-option>
            <el-option label="进行中" value="ONGOING"></el-option>
            <el-option label="已完成" value="COMPLETED"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { 
  createMonthlyMatch, 
  updateMonthlyMatch, 
  getAllMonthlyMatches,
  arrangeMatchSchedule
} from '@/api/match'
import { Message, Loading } from 'element-ui'

export default {
  name: 'MonthlyMatchManage',
  data() {
    const currentYear = new Date().getFullYear()
    return {
      // 筛选表单（无修改）
      filterForm: {
        year: null,
        month: null
      },
      // 可用年份（无修改）
      availableYears: Array.from({length: 11}, (_, i) => currentYear -5 + i),
      // 移除分页相关的 originalMatchList/displayMatchList，直接用全量列表
      matchList: [],
      // 加载状态（无修改）
      loading: false,
      // 移除分页参数 pagination
      // 弹窗状态（无修改）
      dialogVisible: false,
      dialogTitle: '',
      // 表单数据（无修改）
      formData: {
        id: null,
        title: '',
        startTime: '',
        registrationDeadline: '',
        status: ''
      },
      // 表单验证规则（无修改）
      formRules: {
        title: [
          { required: true, message: '请输入比赛标题', trigger: 'blur' },
          { max: 100, message: '标题长度不能超过100个字符', trigger: 'blur' }
        ],
        startTime: [
          { required: true, message: '请选择比赛开始时间', trigger: 'change' }
        ],
        registrationDeadline: [
          { required: true, message: '请选择报名截止时间', trigger: 'change' },
          { validator: this.validateDeadline, trigger: 'change' }
        ]
      }
    }
  },
  created() {
    this.fetchMatches()
  },
  methods: {
    // 1. 获取比赛列表（移除分页相关逻辑，直接保存全量数据）
    async fetchMatches() {
      this.loading = true
      try {
        const res = await getAllMonthlyMatches(this.filterForm)
        if (res.code === 20000) {
          // 直接赋值全量数据，无需分页切片
          this.matchList = res.data || []
        } else {
          Message.error(res.message || '获取比赛列表失败')
        }
      } catch (err) {
        Message.error(err.message || '获取比赛列表失败')
      } finally {
        this.loading = false
      }
    },

    // 移除分页相关方法：handlePageChange、handleSizeChange、handleCurrentChange

    // 2. 重置筛选条件（无修改，仅重新请求全量数据）
    resetFilter() {
      this.filterForm = {
        year: null,
        month: null
      }
      this.fetchMatches()
    },

    // 3. 新增比赛（无修改）
    handleAddMatch() {
      this.dialogTitle = '新增比赛'
      this.formData = {
        id: null,
        title: '',
        startTime: '',
        registrationDeadline: '',
        status: ''
      }
      this.dialogVisible = true
    },

    // 4. 编辑比赛（无修改，时间格式处理保留）
    handleEditMatch(row) {
      this.dialogTitle = '编辑比赛'
      this.formData = {
        id: row.id,
        title: row.title,
        startTime: this.formatToStandardIso(row.startTime),
        registrationDeadline: this.formatToStandardIso(row.registrationDeadline),
        status: row.status
      }
      this.dialogVisible = true
    },

    // 5. 提交表单（无修改）
    async submitForm() {
      this.$refs.matchForm.validate(async (valid) => {
        if (valid) {
          const loading = Loading.service({ text: '提交中...' })
          try {
            let res
            if (this.formData.id) {
              res = await updateMonthlyMatch(this.formData)
            } else {
              res = await createMonthlyMatch(this.formData)
            }
            
            if (res.code === 20000) {
              Message.success(this.formData.id ? '更新成功' : '创建成功')
              this.dialogVisible = false
              this.fetchMatches()
            } else {
              Message.error(res.message || (this.formData.id ? '更新失败' : '创建失败'))
            }
          } catch (err) {
            Message.error(err.message || (this.formData.id ? '更新失败' : '创建失败'))
          } finally {
            loading.close()
          }
        }
      })
    },

    // 6. 安排赛程（无修改）
    async handleArrangeSchedule(matchId) {
      this.$confirm('确定要安排该比赛的赛程吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const res = await arrangeMatchSchedule(matchId)
          if (res.code === 20000) {
            Message.success('赛程安排成功')
            this.fetchMatches()
          } else {
            Message.error(res.message || '赛程安排失败')
          }
        } catch (err) {
          Message.error(err.message || '赛程安排失败')
        }
      }).catch(() => {
        Message.info('已取消操作')
      })
    },

    // 7. 查看赛程（无修改）
    handleViewSchedule(matchId) {
      this.$router.push(`/match-schedule/${matchId}`)
    },

    // 8. 列表时间显示优化（无修改）
    formatDateTimeForDisplay(dateTimeStr) {
      if (!dateTimeStr) return ''
      const standardStr = this.formatToStandardIso(dateTimeStr)
      const date = new Date(standardStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}/${month}/${day} ${hours}:${minutes}`
    },

    // 9. 统一时间格式（无修改）
    formatToStandardIso(dateTimeStr) {
      if (!dateTimeStr) return ''
      return dateTimeStr.includes('.') 
        ? dateTimeStr.split('.')[0] 
        : dateTimeStr.slice(0, 19)
    },

    // 10. 状态文本映射（无修改）
    getStatusText(status) {
      const statusMap = {
        'NOT_STARTED': '未开始',
        'REGISTERING': '报名中',
        'REGISTRATION_CLOSED': '报名截止',
        'ONGOING': '进行中',
        'COMPLETED': '已完成'
      }
      return statusMap[status] || status
    },

    // 11. 状态标签类型（无修改）
    getStatusType(status) {
      const typeMap = {
        'NOT_STARTED': 'info',
        'REGISTERING': 'success',
        'REGISTRATION_CLOSED': 'warning',
        'ONGOING': 'primary',
        'COMPLETED': 'success'
      }
      return typeMap[status] || 'default'
    },

    // 12. 判断是否可以安排赛程（无修改）
    canArrangeSchedule(status) {
      return ['REGISTERING', 'REGISTRATION_CLOSED'].includes(status)
    },

    // 13. 禁用过去的日期（无修改）
    disabledPastDate(time) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return time.getTime() < today.getTime()
    },

    // 14. 验证截止时间（无修改）
    validateDeadline(rule, value, callback) {
      if (!value) {
        return callback(new Error('请选择报名截止时间'))
      }
      const deadline = new Date(this.formatToStandardIso(value))
      const startTime = new Date(this.formatToStandardIso(this.formData.startTime))
      if (deadline >= startTime) {
        return callback(new Error('报名截止时间必须早于比赛开始时间'))
      }
      callback()
    }
  }
}
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.filter-card {
  margin-bottom: 20px;
}

.filter-form {
  display: flex;
  align-items: center;
}

.match-list-card {
  margin-bottom: 20px;
}
</style>