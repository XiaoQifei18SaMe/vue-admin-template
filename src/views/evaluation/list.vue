<template>
  <el-card>
    <div slot="header">
      <el-tabs v-model="activeTab" @tab-click="handleTabChange">
        <el-tab-pane label="我的评价" name="myEvaluations"></el-tab-pane>
        <el-tab-pane label="收到的评价" name="receivedEvaluations"></el-tab-pane>
      </el-tabs>
    </div>

    <!-- 我的评价表格（统一为4列） -->
    <el-table
      v-if="activeTab === 'myEvaluations'"
      :data="myEvaluations"
      border
      style="width: 100%"
    >
      <!-- 1. 预约ID（与收到的评价一致） -->
      <el-table-column prop="appointmentId" label="预约ID" width="100"></el-table-column>
      <!-- 2. 评价人（新增，显示当前用户身份） -->
      <el-table-column label="评价人" width="120">
        <template slot-scope> <!-- 修复：移除未使用的scope变量 -->
          <!-- 我的评价的评价人就是当前用户，直接显示身份 -->
          {{ userType === 'STUDENT' ? '学员' : '教练' }}
        </template>
      </el-table-column>
      <!-- 3. 评价时间（统一列名，原“课程时间”改为“评价时间”，更准确） -->
      <el-table-column label="评价时间" width="180">
        <template slot-scope="scope">
          {{ formatDateTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <!-- 4. 评价内容（与收到的评价一致） -->
      <el-table-column prop="content" label="评价内容"></el-table-column>
    </el-table>

    <!-- 收到的评价表格（保持4列，与我的评价结构完全对齐） -->
    <el-table
      v-if="activeTab === 'receivedEvaluations'"
      :data="receivedEvaluations"
      border
      style="width: 100%"
    >
      <!-- 1. 预约ID（与我的评价一致） -->
      <el-table-column prop="appointmentId" label="预约ID" width="100"></el-table-column>
      <!-- 2. 评价人（保持原逻辑，显示对方身份） -->
      <el-table-column label="评价人" width="120">
        <template slot-scope="scope">
          {{ scope.row.evaluatorType === 'STUDENT' ? '学员' : '教练' }}
        </template>
      </el-table-column>
      <!-- 3. 评价时间（统一列名，与我的评价一致） -->
      <el-table-column label="评价时间" width="180">
        <template slot-scope="scope">
          {{ formatDateTime(scope.row.createTime) }}
        </template>
      </el-table-column>
      <!-- 4. 评价内容（与我的评价一致） -->
      <el-table-column prop="content" label="评价内容"></el-table-column>
    </el-table>

    <!-- 空状态提示（保持一致） -->
    <div v-if="myEvaluations.length === 0 && activeTab === 'myEvaluations'" class="empty-state">
      暂无评价记录
    </div>
    <div v-if="receivedEvaluations.length === 0 && activeTab === 'receivedEvaluations'" class="empty-state">
      暂无收到的评价
    </div>
  </el-card>
</template>

<script>
import { getEvaluationsByUser, getEvaluationsByAppointment } from '@/api/evaluation'
import { mapGetters } from 'vuex'

export default {
  name: 'EvaluationList',
  computed: {
    ...mapGetters(['userId', 'role']),
    userType() {
      return this.role === 'student' ? 'STUDENT' : 'COACH'
    },
    oppositeType() {
      return this.userType === 'STUDENT' ? 'COACH' : 'STUDENT'
    }
  },
  data() {
    return {
      activeTab: 'myEvaluations',
      myEvaluations: [],
      receivedEvaluations: [],
      loading: false,
      myAppointmentIds: [] // 存储我的评价对应的预约ID
    }
  },
  created() {
    this.fetchMyEvaluations()
  },
  methods: {
    async handleTabChange(tab) {
      // 切换到“收到的评价”时加载数据（优化性能）
      if (tab.name === 'receivedEvaluations' && this.receivedEvaluations.length === 0) {
        await this.fetchReceivedEvaluations()
      }
    },

    async fetchMyEvaluations() {
      this.loading = true
      try {
        const res = await getEvaluationsByUser(this.userId, this.userType)
        this.myEvaluations = res.data || []
        // 提取我的评价对应的预约ID（用于后续查询收到的评价）
        this.myAppointmentIds = [...new Set(this.myEvaluations.map(item => item.appointmentId))]
        // 若当前激活“收到的评价”，自动加载
        if (this.activeTab === 'receivedEvaluations') {
          this.fetchReceivedEvaluations()
        }
      } catch (error) {
        this.$message.error(error.message || '获取我的评价失败')
      } finally {
        this.loading = false
      }
    },

    async fetchReceivedEvaluations() {
      // 无我的评价则无收到的评价
      if (this.myAppointmentIds.length === 0) {
        this.receivedEvaluations = []
        return
      }

      this.loading = true
      try {
        this.receivedEvaluations = []
        // 遍历我的预约ID，查询对应评价并筛选对方的评价
        for (const appointmentId of this.myAppointmentIds) {
          const res = await getEvaluationsByAppointment(appointmentId)
          const targetEvaluations = (res.data || []).filter(
            item => item.evaluatorType === this.oppositeType
          )
          this.receivedEvaluations.push(...targetEvaluations)
        }
        // 按评价时间倒序（最新在前）
        this.receivedEvaluations.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
      } catch (error) {
        this.$message.error(error.message || '获取收到的评价失败')
      } finally {
        this.loading = false
      }
    },

    // 统一的时间格式化方法
    formatDateTime(dateTime) {
      if (!dateTime) return ''
      const date = new Date(dateTime)
      return date.toLocaleString() // 格式：2024/5/20 14:30:00（根据浏览器 locale 自适应）
    }
  }
}
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 50px 0;
  color: #999;
}
</style>
