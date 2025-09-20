<template>
  <div class="coach-change-manage-container">
    <div class="page-header">
      <h2>更换教练申请管理</h2>
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
        <el-table-column prop="id" label="申请ID" width="80" align="center"></el-table-column>
        <el-table-column prop="studentName" label="学员" align="center"></el-table-column>
        <el-table-column 
          prop="currentCoachName" 
          label="当前教练" 
          align="center"
          v-if="isTargetCoachView"
        ></el-table-column>
        <el-table-column 
          prop="targetCoachName" 
          label="目标教练" 
          align="center"
          v-if="!isTargetCoachView"
        ></el-table-column>
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
            <div v-if="scope.row.currentCoachId === userId">
              <span v-if="scope.row.currentCoachApproval === null">待处理</span>
              <span v-if="scope.row.currentCoachApproval" class="approved">已同意</span>
              <span v-if="scope.row.currentCoachApproval === false" class="rejected">已拒绝</span>
            </div>
            <div v-else>
              <span v-if="scope.row.targetCoachApproval === null">待处理</span>
              <span v-if="scope.row.targetCoachApproval" class="approved">已同意</span>
              <span v-if="scope.row.targetCoachApproval === false" class="rejected">已拒绝</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="200">
          <template slot-scope="scope">
            <div v-if="!scope.row.processed">
              <el-button 
                size="mini" 
                type="success" 
                @click="handleApprove(scope.row)"
                :disabled="scope.row.status !== 'PENDING'"
              >
                同意
              </el-button>
              <el-button 
                size="mini" 
                type="danger" 
                @click="handleReject(scope.row)"
                :disabled="scope.row.status !== 'PENDING'"
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
import { getRelatedStudents } from '@/api/coach'
import { getCoachList } from '@/api/student'
import { Message, Loading } from 'element-ui'
import { mapGetters } from 'vuex'

export default {
  name: 'CoachChangeManage',
  computed: {
    ...mapGetters(['userId', 'userType', 'schoolId']),
    // 判断当前教练是作为当前教练还是目标教练查看
    isTargetCoachView() {
      return this.changeRequests.some(req => req.targetCoachId === this.userId)
    }
  },
  data() {
    return {
      changeRequests: [],
      relatedStudents: [],
      allCoaches: [],
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
            // 1. 并行加载所有数据（顺序不影响，因为Promise.all会等所有请求完成）
            const [requestsRes, studentsRes, coachesRes] = await Promise.all([
            getRelatedRequests(this.userId, this.userType),
            getRelatedStudents(this.userId),
            getCoachList({ schoolId: this.schoolId })
            ])

            // 2. 第一步：先给依赖数据赋值（必须先做！）
            this.relatedStudents = studentsRes.data || []; // 学员列表先填充
            this.allCoaches = coachesRes.data || [];       // 教练列表先填充

            // 3. 第二步：再处理changeRequests（此时依赖数组已存在数据）
            this.changeRequests = (requestsRes.data || []).map(req => {
            // 查找学员名称（此时this.relatedStudents已赋值，能找到id=7的学员）
            const student = this.relatedStudents.find(s => s.id === req.studentId);
            // 查找当前教练名称（能找到id=16的教练）
            const currentCoach = this.allCoaches.find(c => c.id === req.currentCoachId);
            // 查找目标教练名称（能找到id=23的教练）
            const targetCoach = this.allCoaches.find(c => c.id === req.targetCoachId);
            
            // 判断是否已处理的逻辑不变
            let processed = false;
            if (req.currentCoachId === this.userId) {
                processed = req.currentCoachApproval !== null;
            } else if (req.targetCoachId === this.userId) {
                processed = req.targetCoachApproval !== null;
            }
            
            return {
                ...req,
                studentName: student ? student.name : `未知学员(${req.studentId})`,
                currentCoachName: currentCoach ? currentCoach.name : `未知教练(${req.currentCoachId})`,
                targetCoachName: targetCoach ? targetCoach.name : `未知教练(${req.targetCoachId})`,
                processed
            };
            });

        } catch (err) {
            Message.error(err.message || '获取数据失败');
        } finally {
            this.loading = false;
        }
    },
    async handleApprove(request) {
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
          this.fetchData()
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
          this.fetchData()
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
.coach-change-manage-container {
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

.approved {
  color: #42b983;
}

.rejected {
  color: #f56c6c;
}

.processed-text {
  color: #999;
  font-size: 14px;
}
</style>