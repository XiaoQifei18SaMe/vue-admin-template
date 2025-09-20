<template>
  <div class="coach-change-container">
    <div class="page-header">
      <h2>更换教练申请</h2>
      <p>您可以申请更换当前教练，提交后需经过相关审批</p>
    </div>

    <el-card class="current-coach-card">
      <div slot="header">
        <h3>当前教练</h3>
      </div>
      <div v-if="currentCoaches.length > 0" class="coach-list">
        <el-radio-group v-model="selectedCurrentCoachId">
          <el-radio 
            v-for="coach in currentCoaches" 
            :key="coach.id" 
            :label="coach.id"
            class="coach-item"
          >
            <div class="coach-info">
              <img 
                :src="`http://localhost:8080/coach-photos/${coach.photoPath}` || '/default-coach.png'"
                :alt="coach.name" 
                class="coach-photo"
                @error="handleImgError"
              >
              <div class="coach-details">
                <h4>{{ coach.name }}</h4>
                <p>性别：{{ coach.male ? '男' : '女' }}</p>
                <p>年龄：{{ coach.age }}</p>
                <p>等级：{{ getLevelText(coach.level) }}</p>
                <p>联系电话：{{ coach.phone }}</p>
              </div>
            </div>
          </el-radio>
        </el-radio-group>
      </div>
      <div v-else class="empty-state">
        暂无当前教练信息
      </div>
    </el-card>

    <el-card class="target-coach-card">
      <div slot="header">
        <h3>选择目标教练（同一校区）</h3>
      </div>
      <div v-if="schoolCoaches.length > 0" class="coach-list">
        <el-radio-group v-model="selectedTargetCoachId">
          <el-radio 
            v-for="coach in schoolCoaches" 
            :key="coach.id" 
            :label="coach.id"
            :disabled="coach.id === selectedCurrentCoachId"
            class="coach-item"
          >
            <div class="coach-info">
              <img 
                :src="`http://localhost:8080/coach-photos/${coach.photoPath}` || '/default-coach.png'"
                :alt="coach.name" 
                class="coach-photo"
                @error="handleImgError"
              >
              <div class="coach-details">
                <h4>{{ coach.name }}</h4>
                <p>性别：{{ coach.male ? '男' : '女' }}</p>
                <p>年龄：{{ coach.age }}</p>
                <p>等级：{{ getLevelText(coach.level) }}</p>
                <p>联系电话：{{ coach.phone }}</p>
              </div>
            </div>
          </el-radio>
        </el-radio-group>
      </div>
      <div v-else class="empty-state">
        暂无可选教练信息
      </div>
    </el-card>

    <div class="action-buttons">
      <el-button 
        type="primary" 
        @click="submitRequest"
        :disabled="!selectedCurrentCoachId || !selectedTargetCoachId || loading"
        :loading="loading"
      >
        提交更换申请
      </el-button>
      <el-button @click="$router.back()">取消</el-button>
    </div>

    <!-- 申请历史记录 -->
    <el-card class="request-history-card">
      <div slot="header">
        <h3>申请历史记录</h3>
      </div>
      <el-table
        :data="requestHistory"
        border
        stripe
        style="width: 100%;"
      >
        <el-table-column prop="id" label="申请ID" width="80" align="center"></el-table-column>
        <el-table-column prop="currentCoachName" label="原教练" align="center"></el-table-column>
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
        <el-table-column prop="updateTime" label="更新时间" align="center">
          <template slot-scope="scope">{{ formatTime(scope.row.updateTime) }}</template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { 
  getCurrentCoaches, 
  getSchoolCoaches, 
  submitChangeRequest,
  getRelatedRequests
} from '@/api/coachChange'
import { Message, Loading } from 'element-ui'
import { mapGetters } from 'vuex'

export default {
  name: 'CoachChange',
  computed: {
    ...mapGetters(['userId', 'userType'])
  },
  data() {
    return {
      currentCoaches: [],
      schoolCoaches: [],
      requestHistory: [],
      selectedCurrentCoachId: null,
      selectedTargetCoachId: null,
      loading: false
    }
  },
  // 关键修改：用 async/await 控制异步顺序
  // 调整执行顺序：先获取当前教练，再获取校区教练（依赖当前教练列表进行过滤）
  async created() {
    // 1. 先获取当前教练列表（必须先完成）
    await this.fetchCurrentCoaches()
    // 2. 基于当前教练列表，获取并过滤校区教练
    await this.fetchSchoolCoaches()
    // 3. 最后获取申请历史（依赖前两个接口的数据）
    await this.fetchRequestHistory()
  },
  methods: {
    handleImgError(e) {
      e.target.src = '/default-coach.png'
    },
    getLevelText(level) {
      switch(level) {
        case 10: return '初级教练员';
        case 100: return '中级教练员';
        case 1000: return '高级教练员';
        default: return '未评级';
      }
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
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return date.toLocaleString()
    },
    async fetchCurrentCoaches() {
      try {
        const res = await getCurrentCoaches(this.userId)
        this.currentCoaches = res.data || []
        if (this.currentCoaches.length > 0) {
          this.selectedCurrentCoachId = this.currentCoaches[0].id
        }
      } catch (err) {
        Message.error(err.message || '获取当前教练失败')
      }
    },
   async fetchSchoolCoaches() {
      try {
        const res = await getSchoolCoaches(this.userId)
        // 过滤掉当前教练列表中已存在的教练
        this.schoolCoaches = (res.data || []).filter(coach => 
          // 检查当前教练列表中是否存在该教练ID，不存在则保留
          !this.currentCoaches.some(currentCoach => currentCoach.id === coach.id)
        )
      } catch (err) {
        Message.error(err.message || '获取校区教练失败')
      }
    },
    async fetchRequestHistory() {
      try {
        const res = await getRelatedRequests(this.userId, this.userType)
        const requests = res.data || []
        
        // 补充教练名称
        this.requestHistory = requests.map(req => {
          const currentCoach = this.schoolCoaches.find(c => c.id === req.currentCoachId)
          const targetCoach = this.schoolCoaches.find(c => c.id === req.targetCoachId)
          return {
            ...req,
            currentCoachName: currentCoach ? currentCoach.name : `未知教练(${req.currentCoachId})`,
            targetCoachName: targetCoach ? targetCoach.name : `未知教练(${req.targetCoachId})`
          }
        })
      } catch (err) {
        Message.error(err.message || '获取申请历史失败')
      }
    },
    async submitRequest() {
      if (this.selectedCurrentCoachId === this.selectedTargetCoachId) {
        Message.warning('当前教练和目标教练不能相同')
        return
      }
      
      this.$confirm('确定要提交更换教练申请吗？', '确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        this.loading = true
        try {
          await submitChangeRequest(
            this.userId,
            this.selectedCurrentCoachId,
            this.selectedTargetCoachId
          )
          Message.success('更换教练申请已提交，请等待审批')
          this.fetchRequestHistory()
          // 重置选择
          this.selectedTargetCoachId = null
        } catch (err) {
          Message.error(err.message || '提交申请失败')
        } finally {
          this.loading = false
        }
      }).catch(() => {
        Message.info('已取消提交')
      })
    }
  }
}
</script>

<style scoped>
.coach-change-container {
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

.current-coach-card, .target-coach-card {
  margin-bottom: 20px;
}

.coach-list {
  padding: 10px 0;
}

.coach-item {
  display: block;
  margin-bottom: 15px;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  cursor: pointer;
}

.coach-item:hover {
  background-color: #f5f7fa;
}

.coach-info {
  display: flex;
  align-items: center;
}

.coach-photo {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 20px;
}

.coach-details h4 {
  margin: 0 0 10px 0;
  font-size: 16px;
}

.coach-details p {
  margin: 5px 0;
  font-size: 14px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 50px 0;
  color: #999;
}

.action-buttons {
  margin: 20px 0;
  text-align: right;
}

.request-history-card {
  margin-top: 30px;
}
</style>