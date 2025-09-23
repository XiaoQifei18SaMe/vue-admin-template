<template>
  <div class="match-schedule-container">
    <div class="page-header">
      <h2>我的比赛安排</h2>
      <p>查看已报名月赛的详细赛程，报名截止后生成</p>
    </div>

    <!-- 已报名月赛列表 -->
    <el-card class="registered-matches-card" shadow="hover">
      <div slot="header">
        <h3>已报名月赛</h3>
      </div>
      
      <el-table
        :data="studentRegistrations"
        border
        stripe
        style="width: 100%"
        v-loading="loadingRegistrations"
        @row-click="handleRegistrationClick"
        row-class-name="clickable-row"
        empty-text="暂无已报名的月赛"
      >
        <el-table-column
          prop="monthlyMatchTitle"
          label="比赛名称"
          align="center"
          min-width="220"
        ></el-table-column>
        <el-table-column
          label="组别"
          align="center"
          width="100"
        >
          <template slot-scope="scope">
            {{ getGroupName(scope.row.groupType) }}
          </template>
        </el-table-column>
        <el-table-column
          label="比赛时间"
          align="center"
          min-width="180"
        >
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.matchStartTime) }}
          </template>
        </el-table-column>
        <el-table-column
          label="报名状态"
          align="center"
          width="120"
        >
          <template slot-scope="scope">
            <el-tag type="success" size="mini">已支付</el-tag>
          </template>
        </el-table-column>
        <el-table-column
          label="赛程状态"
          align="center"
          width="120"
        >
          <template slot-scope="scope">
            <el-tag 
              :type="getScheduleStatusType(scope.row)"
              size="mini"
            >
              {{ getScheduleStatusText(scope.row) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 赛程详情（选中月赛后显示） -->
    <el-card 
      v-if="selectedRegistration" 
      class="schedule-details-card"
      shadow="hover"
      style="margin-top: 20px"
    >
      <div slot="header">
        <h3>
          {{ selectedRegistration.monthlyMatchTitle }} - {{ getGroupName(selectedRegistration.groupType) }} 赛程
        </h3>
        <p class="schedule-subtitle" v-if="selectedRegistration.matchDeadline">
          报名截止时间：{{ formatDateTime(selectedRegistration.matchDeadline) }}
        </p>
      </div>
      
      <div v-if="loadingSchedules">
        <el-skeleton :rows="5" animated />
      </div>
      
      <el-table
        v-else
        :data="formattedSchedules"
        border
        stripe
        style="width: 100%"
        empty-text="暂无赛程数据"
      >
        <el-table-column
          prop="roundNumber"
          label="轮次"
          align="center"
          width="80"
        ></el-table-column>
        <el-table-column
          label="对阵选手"
          align="center"
          min-width="280"
        >
          <template slot-scope="scope">
            <div class="player-group">
              <span 
                :class="scope.row.player1Id === userId ? 'own-player' : 'other-player'"
                title="点击查看选手信息"
                @click="showPlayerInfo(scope.row.player1Id)"
              >
                {{ scope.row.player1Name }}
              </span>
              <span class="vs" v-if="scope.row.player2Id">VS</span>
              <span 
                v-else
                class="bye-tag"
              >
                轮空
              </span>
              <span 
                v-if="scope.row.player2Id"
                :class="scope.row.player2Id === userId ? 'own-player' : 'other-player'"
                title="点击查看选手信息"
                @click="showPlayerInfo(scope.row.player2Id)"
              >
                {{ scope.row.player2Name }}
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column
          label="球台"
          align="center"
          width="100"
        >
          <template slot-scope="scope">
            {{ scope.row.tableName || '未知球台' }}
          </template>
        </el-table-column>
        <el-table-column
          label="比赛时间"
          align="center"
          min-width="180"
        >
          <template slot-scope="scope">
            {{ scope.row.startTime ? formatDateTime(scope.row.startTime) : '待安排' }}
          </template>
        </el-table-column>
        <el-table-column
          label="比赛结果"
          align="center"
          width="120"
        >
          <template slot-scope="scope">
            <el-tag 
              :type="getResultType(scope.row.result)"
              size="mini"
            >
              {{ getResultText(scope.row.result) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 无赛程提示 -->
    <div 
      v-if="selectedRegistration && !loadingSchedules && formattedSchedules.length === 0" 
      class="no-schedules"
    >
      <el-empty description="报名尚未截止，赛程将在截止后自动生成"></el-empty>
    </div>
  </div>
</template>

<script>
import matchApi from '@/api/match'
import tableApi from '@/api/table'
import { getStudentById } from '@/api/student'
import { Message, ElEmpty, ElTag, ElSkeleton } from 'element-ui'
import { mapGetters } from 'vuex'

export default {
  name: 'MatchSchedule',
  components: { ElEmpty, ElTag, ElSkeleton },
  computed: {
    ...mapGetters(['userId', 'studentInfo']) // Vuex中存储的当前学生ID和基础信息
  },
  data() {
    return {
      studentRegistrations: [], // 学生已报名的月赛列表（含月赛关联信息）
      selectedRegistration: null, // 当前选中的月赛报名记录
      rawSchedules: [], // 原始赛程数据（未格式化）
      formattedSchedules: [], // 格式化后赛程（含选手姓名、球台名称）
      
      // 缓存数据（减少重复请求）
      playerNameCache: new Map(), // key: 学生ID, value: 学生姓名
      tableCache: new Map(), // key: 球台ID, value: 球台名称
      
      // 加载状态
      loadingRegistrations: false,
      loadingSchedules: false
    }
  },
  created() {
    // 页面加载时初始化：获取报名记录 + 所有球台（缓存）
    Promise.all([
      this.fetchStudentRegistrations(),
      this.fetchAllTables()
    ]).catch(err => {
      Message.error(`初始化失败：${err.message || '网络异常'}`)
    })
  },
  methods: {
    /**
     * 1. 获取学生已报名的月赛记录
     */
    async fetchStudentRegistrations() {
      this.loadingRegistrations = true
      try {
        // 步骤1：获取学生报名记录（含monthlyMatchId）
        const regRes = await matchApi.getStudentRegistrations(this.userId)
        const registrations = regRes.data || []
        if (registrations.length === 0) {
          this.studentRegistrations = []
          return
        }

        // 步骤2：为每个报名记录补充月赛详情（调用后端单个月赛接口）
        const filledRegistrations = await Promise.all(
          registrations.map(async (reg) => {
            const matchRes = await matchApi.getMatchById(reg.monthlyMatchId)
            const match = matchRes.data || {}
            return {
              ...reg,
              monthlyMatchTitle: match.title || '未知比赛',
              matchStartTime: match.startTime || null,
              matchDeadline: match.registrationDeadline || null,
              matchStatus: match.status || 'UNKNOWN'
            }
          })
        )

        this.studentRegistrations = filledRegistrations
      } catch (err) {
        Message.error(`获取报名记录失败：${err.message || '接口异常'}`)
        this.studentRegistrations = []
      } finally {
        this.loadingRegistrations = false
      }
    },

    /**
     * 2. 获取所有球台（缓存到tableCache，用于ID转名称）
     */
    async fetchAllTables() {
      try {
        const res = await tableApi.getAllTables()
        const tables = res.data || []
        tables.forEach(table => {
          this.tableCache.set(table.id, table.tableName)
        })
      } catch (err) {
        Message.warning(`获取球台列表失败：${err.message || '将显示球台ID'}`)
      }
    },

    /**
     * 3. 点击报名记录，加载对应的赛程
     */
    async handleRegistrationClick(registration) {
      this.selectedRegistration = registration
      this.rawSchedules = []
      this.formattedSchedules = []

      // 校验：报名未截止，提示无法查看
      const now = new Date()
      const deadline = new Date(registration.matchDeadline)
      if (now < deadline) {
        Message.info(`该月赛报名尚未截止（截止时间：${this.formatDateTime(registration.matchDeadline)}），截止后将生成赛程`)
        return
      }

      // 加载赛程
      this.loadingSchedules = true
      try {
        const res = await matchApi.getStudentMatchSchedule({
          matchId: registration.monthlyMatchId,
          studentId: this.userId
        })
        this.rawSchedules = res.data || []
        // 格式化赛程（补充选手姓名、球台名称）
        await this.formatSchedules()
      } catch (err) {
        Message.error(`获取赛程失败：${err.message || '接口异常'}`)
        this.formattedSchedules = []
      } finally {
        this.loadingSchedules = false
      }
    },

    /**
     * 4. 格式化赛程数据（补充选手姓名、球台名称）
     */
    async formatSchedules() {
      // 步骤1：收集所有需要查询的选手ID（去重）
      const needFetchPlayerIds = new Set()
      this.rawSchedules.forEach(schedule => {
        if (schedule.player1Id && !this.playerNameCache.has(schedule.player1Id)) {
          needFetchPlayerIds.add(schedule.player1Id)
        }
        if (schedule.player2Id && !this.playerNameCache.has(schedule.player2Id)) {
          needFetchPlayerIds.add(schedule.player2Id)
        }
      })

      // 步骤2：批量查询未缓存的选手姓名（减少请求次数）
      if (needFetchPlayerIds.size > 0) {
        await Promise.all(
          Array.from(needFetchPlayerIds).map(async (playerId) => {
            try {
              const res = await getStudentById(playerId) // 假设接口：根据ID查学生
              const name = res.data?.name || `未知选手(${playerId})`
              this.playerNameCache.set(playerId, name)
            } catch (err) {
              this.playerNameCache.set(playerId, `未知选手(${playerId})`)
            }
          })
        )
      }

      // 步骤3：组装格式化后的赛程
      this.formattedSchedules = this.rawSchedules.map(schedule => ({
        ...schedule,
        player1Name: this.playerNameCache.get(schedule.player1Id) || `未知选手(${schedule.player1Id})`,
        player2Name: schedule.player2Id ? (this.playerNameCache.get(schedule.player2Id) || `未知选手(${schedule.player2Id})`) : '',
        tableName: this.tableCache.get(schedule.tableId) || `球台${schedule.tableId}`
      }))
    },

    /**
     * 5. 显示选手信息（弹窗或其他方式，这里简化为提示）
     */
   async showPlayerInfo(studentId) {
  try {
    const res = await getStudentById(studentId)
    const student = res.data || {}
    // 关键：使用「完整配置对象」，显式指定 message 和 dangerouslyUseHTMLString
    Message.info({
      message: `
        选手信息：<br>
        姓名：${student.name || '未知'}<br>
        学号：${student.id || '未设置'}<br>  
        校区：${student.schoolId ? `学校ID: ${student.schoolId}` : '未知'}<br>  
        联系方式：${student.phone || '未设置'}
      `,
      dangerouslyUseHTMLString: true,  // 生效：允许解析HTML标签
      duration: 3000  // 可选：延长提示显示时间，方便查看
    })
  } catch (err) {
    Message.error(`获取选手信息失败：${err.message}`)
  }
},

    /**
     * 辅助方法：组别枚举转中文（GROUP_A → 甲组）
     */
    getGroupName(groupType) {
      const groupMap = {
        'GROUP_A': '甲组',
        'GROUP_B': '乙组',
        'GROUP_C': '丙组'
      }
      return groupMap[groupType] || groupType
    },

    /**
     * 辅助方法：赛程状态文本（未截止/已生成）
     */
    getScheduleStatusText(registration) {
      const now = new Date()
      const deadline = new Date(registration.matchDeadline)
      if (now < deadline) {
        return '未截止'
      }
      return '已生成'
    },

    /**
     * 辅助方法：赛程状态标签类型（未截止→info，已生成→success）
     */
    getScheduleStatusType(registration) {
      const now = new Date()
      const deadline = new Date(registration.matchDeadline)
      return now < deadline ? 'info' : 'success'
    },

    /**
     * 辅助方法：比赛结果转中文（NOT_STARTED → 未开始）
     */
    getResultText(result) {
      const resultMap = {
        'NOT_STARTED': '未开始',
        'PLAYER1_WIN': '选手1胜',
        'PLAYER2_WIN': '选手2胜',
        'DRAW': '平局'
      }
      return resultMap[result] || '未知结果'
    },

    /**
     * 辅助方法：比赛结果标签类型（未开始→info，胜利→success，失败→danger）
     */
    getResultType(result) {
      if (!this.selectedRegistration || !result) return 'info'
      const currentUserId = this.userId
      switch (result) {
        case 'PLAYER1_WIN':
          return currentUserId === this.selectedRegistration.player1Id ? 'success' : 'danger'
        case 'PLAYER2_WIN':
          return currentUserId === this.selectedRegistration.player2Id ? 'success' : 'danger'
        case 'DRAW':
          return 'warning'
        default:
          return 'info'
      }
    },

    /**
     * 辅助方法：日期时间格式化（yyyy-MM-dd HH:mm）
     */
    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) return '未设置'
      try {
        const date = new Date(dateTimeStr)
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      } catch (err) {
        return '格式错误'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.match-schedule-container {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  h2 {
    font-size: 18px;
    color: #333;
    margin: 0 0 8px;
  }
  p {
    font-size: 14px;
    color: #666;
    margin: 0;
  }
}

.registered-matches-card {
  margin-bottom: 20px;
}

.schedule-details-card {
  .schedule-subtitle {
    font-size: 12px;
    color: #666;
    margin: 8px 0 0;
  }
}

.clickable-row {
  cursor: pointer;
  &:hover {
    background-color: #f5f7fa !important;
  }
}

.player-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  .own-player {
    color: #1890ff;
    font-weight: 500;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
  .other-player {
    color: #333;
    cursor: pointer;
    &:hover {
      text-decoration: underline;
    }
  }
  .vs {
    color: #666;
    font-weight: 500;
  }
  .bye-tag {
    color: #faad14;
    font-weight: 500;
  }
}

.no-schedules {
  text-align: center;
  padding: 60px 0;
  margin-top: 20px;
}

/* 适配小屏幕 */
@media (max-width: 768px) {
  .match-schedule-container {
    padding: 12px;
  }
  .player-group {
    flex-direction: column;
    gap: 8px;
  }
}
</style>