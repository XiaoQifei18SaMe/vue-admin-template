<template>
  <div class="admin-coach-change-container">
    <!-- 页面结构不变 -->
    <div class="page-header">
      <h2>更换教练申请审批</h2>
      <p>处理学员提交的更换教练申请</p>
    </div>

    <el-card>
      <el-table
        :data="changeRequests"
        border
        stripe
        style="width: 100%;"
        v-loading="loading"
      >
        <!-- 表格列定义不变 -->
        <el-table-column prop="id" label="申请ID" width="80" align="center"></el-table-column>
        <el-table-column prop="studentName" label="学员" align="center"></el-table-column>
        <el-table-column prop="currentCoachName" label="当前教练" align="center"></el-table-column>
        <el-table-column prop="targetCoachName" label="目标教练" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="申请时间" align="center">
          <template slot-scope="scope">{{ formatTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column prop="approvalStatus" label="审批状态" align="center">
          <template slot-scope="scope">
            <div>
              <p>当前教练：{{ scope.row.currentCoachApproval === null ? '待处理' : 
                (scope.row.currentCoachApproval ? '同意' : '拒绝') }}</p>
              <p>目标教练：{{ scope.row.targetCoachApproval === null ? '待处理' : 
                (scope.row.targetCoachApproval ? '同意' : '拒绝') }}</p>
              <p>管理员：{{ scope.row.adminApproval === null ? '待处理' : 
                (scope.row.adminApproval ? '同意' : '拒绝') }}</p>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200">
          <template slot-scope="scope">
            <div v-if="scope.row.adminApproval === null && scope.row.status === 'PENDING'">
              <el-button 
                size="mini" 
                type="success" 
                @click="handleApprove(scope.row)"
              >
                同意
              </el-button>
              <el-button 
                size="mini" 
                type="danger" 
                @click="handleReject(scope.row)"
              >
                拒绝
              </el-button>
            </div>
            <div v-else>
              <span class="processed-text">已处理</span>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { getRelatedRequests, handleChangeRequest } from '@/api/coachChange'
// 导入管理员接口
import { getCoachesBySchoolId, getStudentsBySchoolId } from '@/api/admin'
import { Message, Loading } from 'element-ui'
import { mapGetters } from 'vuex'

export default {
  name: 'AdminCoachChangeManage',
  computed: {
    ...mapGetters(['userId', 'userType', 'token']), // 从vuex获取token
    // 提取当前校区ID（从申请列表中获取，默认取第一个申请的schoolId）
    schoolId() {
      if (this.changeRequests.length > 0) {
        return this.changeRequests[0].schoolId
      }
      return null
    }
  },
  data() {
    return {
      changeRequests: [],
      allCoaches: [], // 存储当前校区的教练列表
      allStudents: [], // 存储当前校区的学生列表
      loading: false
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return date.toLocaleString()
    },
    getStatusText(status) {
      switch(status) {
        case 'PENDING': return '待审批';
        case 'APPROVED': return '已批准';
        case 'REJECTED': return '已拒绝';
        default: return status;
      }
    },
    getStatusTagType(status) {
      switch(status) {
        case 'PENDING': return 'warning';
        case 'APPROVED': return 'success';
        case 'REJECTED': return 'danger';
        default: return 'default';
      }
    },
    async fetchData() {
      this.loading = true
      try {
        // 1. 先获取申请列表，从中提取schoolId
        const requestsRes = await getRelatedRequests(this.userId, this.userType)
        const requests = requestsRes.data || []
        
        // 如果没有申请，直接结束
        if (requests.length === 0) {
          this.changeRequests = []
          this.loading = false
          return
        }

        // 2. 提取校区ID（所有申请应属于同一校区，取第一个即可）
        const schoolId = requests[0].schoolId
        if (!schoolId) {
          Message.warning('未获取到校区信息')
          this.loading = false
          return
        }

        // 3. 并行获取该校区的教练和学生列表（使用管理员token）
        const [coachesRes, studentsRes] = await Promise.all([
          getCoachesBySchoolId(this.token, schoolId), // 调用新接口
          getStudentsBySchoolId(this.token, schoolId) // 调用新接口
        ])

        // 4. 先赋值依赖数据
        this.allCoaches = coachesRes.data || []
        this.allStudents = studentsRes.data || []

        // 5. 处理申请列表，关联名称
        this.changeRequests = requests.map(req => {
          // 查找学员名称（使用当前校区的学生列表）
          const student = this.allStudents.find(s => Number(s.id) === Number(req.studentId))
          // 查找当前教练名称（使用当前校区的教练列表）
          const currentCoach = this.allCoaches.find(c => Number(c.id) === Number(req.currentCoachId))
          // 查找目标教练名称
          const targetCoach = this.allCoaches.find(c => Number(c.id) === Number(req.targetCoachId))
          
          return {
            ...req,
            studentName: student ? student.name : `未知学员(${req.studentId})`,
            currentCoachName: currentCoach ? currentCoach.name : `未知教练(${req.currentCoachId})`,
            targetCoachName: targetCoach ? targetCoach.name : `未知教练(${req.targetCoachId})`
          }
        })

      } catch (err) {
        Message.error(err.message || '获取数据失败')
      } finally {
        this.loading = false
      }
    },
    async handleApprove(request) {
      // 处理逻辑不变
      this.$confirm(`确定要同意学员${request.studentName}的更换教练申请吗？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(async () => {
        const loading = Loading.service({ text: '处理中...' })
        try {
          await handleChangeRequest(
            request.id,
            this.userId,
            this.userType,
            true
          )
          Message.success('已同意申请')
          this.fetchData() // 重新加载数据
        } catch (err) {
          Message.error(err.message || '处理失败')
        } finally {
          loading.close()
        }
      }).catch(() => {
        Message.info('已取消操作')
      })
    },
    async handleReject(request) {
      // 处理逻辑不变
      this.$confirm(`确定要拒绝学员${request.studentName}的更换教练申请吗？`, '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        const loading = Loading.service({ text: '处理中...' })
        try {
          await handleChangeRequest(
            request.id,
            this.userId,
            this.userType,
            false
          )
          Message.success('已拒绝申请')
          this.fetchData() // 重新加载数据
        } catch (err) {
          Message.error(err.message || '处理失败')
        } finally {
          loading.close()
        }
      }).catch(() => {
        Message.info('已取消操作')
      })
    }
  }
}
</script>

<style scoped>
/* 样式不变 */
.admin-coach-change-container {
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

.processed-text {
  color: #999;
  font-size: 14px;
}
</style>
    