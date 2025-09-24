<template>
  <div class="match-schedule-admin">
    <!-- 页面头部 -->
    <div class="page-header">
      <h2>{{ matchTitle }} - 赛程详情</h2>
      <el-button type="primary" @click="$router.go(-1)">返回月赛管理</el-button>
    </div>

    <!-- 赛程详情表格 -->
    <el-card class="schedule-card" shadow="hover">
      <div slot="header">
        <h3>所有赛程列表</h3>
        <p class="schedule-subtitle">共 {{ formattedSchedules.length }} 场比赛</p>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading">
        <el-skeleton :rows="8" animated />
      </div>

      <!-- 赛程表格 -->
      <el-table
        v-else
        :data="formattedSchedules"
        border
        stripe
        style="width: 100%"
        empty-text="暂无赛程数据"
        row-class-name="schedule-row"
      >
        <!-- 小组列 -->
        <el-table-column
          label="小组"
          align="center"
          min-width="160"
        >
          <template slot-scope="scope">
            {{ scope.row.groupName }}
          </template>
        </el-table-column>

        <!-- 轮次列 -->
        <el-table-column
          prop="roundNumber"
          label="轮次"
          align="center"
          width="80"
        />

        <!-- 对阵选手列 -->
        <el-table-column
          label="对阵选手"
          align="center"
          min-width="320"
        >
          <template slot-scope="scope">
            <div class="player-group">
              <span class="player-item other-player" title="选手1信息">
                {{ scope.row.player1Name || scope.row.player1Id || '未知选手' }}
              </span>
              <span class="vs" v-if="scope.row.player2Id">VS</span>
              <span class="bye-tag" v-else>轮空</span>
              <span 
                class="player-item other-player" 
                title="选手2信息"
                v-if="scope.row.player2Id"
              >
                {{ scope.row.player2Name || scope.row.player2Id || '未知选手' }}
              </span>
            </div>
          </template>
        </el-table-column>

        <!-- 球台列 -->
        <el-table-column
          label="球台"
          align="center"
          width="100"
        >
          <template slot-scope="scope">
            {{ scope.row.tableName || '未知球台' }}
          </template>
        </el-table-column>

        <!-- 比赛时间列 -->
        <el-table-column
          label="比赛时间"
          align="center"
          min-width="180"
        >
          <template slot-scope="scope">
            {{ scope.row.startTime ? formatDateTime(scope.row.startTime) : '待安排' }}
          </template>
        </el-table-column>

        <!-- 比赛结果列 -->
        <el-table-column
          label="比赛结果"
          align="center"
          width="120"
        >
          <template slot-scope="scope">
            <el-tag 
              :type="getResultTagType(scope.row.result)"
              size="mini"
            >
              {{ getResultText(scope.row.result) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { getAdminMatchSchedule, getMatchById } from '@/api/match'
import { Message, ElSkeleton, ElTag } from 'element-ui'

export default {
  name: 'MatchScheduleAdmin',
  components: { ElSkeleton, ElTag },
  data() {
    return {
      matchId: this.$route.params.matchId,
      matchTitle: '未知比赛',
      rawScheduleList: [],
      formattedSchedules: [],
      loading: false
    }
  },
  created() {
    Promise.all([
      this.fetchMatchTitle(),
      this.fetchAdminSchedule()
    ]).catch(err => {
      Message.error(`页面初始化失败：${err.message || '网络异常'}`)
    })
  },
  methods: {
    async fetchMatchTitle() {
      try {
        const res = await getMatchById(this.matchId)
        if (res.code === 20000) {
          this.matchTitle = res.data.title || '未知比赛'
        } else {
          Message.error(res.message || '获取比赛信息失败')
        }
      } catch (err) {
        Message.error(err.message || '获取比赛信息失败')
      }
    },

    async fetchAdminSchedule() {
      this.loading = true
      try {
        const res = await getAdminMatchSchedule(this.matchId)
        if (res.code === 20000) {
          this.rawScheduleList = res.data || []
          this.formattedSchedules = this.formatScheduleData()
        } else {
          Message.error(res.message || '获取赛程失败')
          this.formattedSchedules = []
        }
      } catch (err) {
        Message.error(err.message || '获取赛程失败')
        this.formattedSchedules = []
      } finally {
        this.loading = false
      }
    },

    formatScheduleData() {
      return this.rawScheduleList.map(schedule => ({
        ...schedule,
        groupName: `${schedule.groupTypeStr || '未知组别'} - 第${schedule.subgroupNumber || '未知'}组`,
        tableName: `球台${schedule.tableId || '未知'}`,
        player1Name: schedule.player1Name || schedule.player1Id || '未知选手',
        player2Name: schedule.player2Id ? (schedule.player2Name || schedule.player2Id || '未知选手') : ''
      }))
    },

    getResultText(result) {
      const resultMap = {
        'NOT_STARTED': '未开始',
        'PLAYER1_WIN': '选手1胜',
        'PLAYER2_WIN': '选手2胜',
        'DRAW': '平局'
      }
      return resultMap[result] || '未知状态'
    },

    getResultTagType(result) {
      const typeMap = {
        'NOT_STARTED': 'info',
        'PLAYER1_WIN': 'success',
        'PLAYER2_WIN': 'success',
        'DRAW': 'warning'
      }
      return typeMap[result] || 'default'
    },

    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) return '待安排'
      try {
        const date = new Date(dateTimeStr)
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      } catch (err) {
        return '时间格式错误'
      }
    }
  }
}
</script>

<style scoped>
/* 修复CSS语法错误：移除嵌套，使用标准选择器 */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.page-header h2 {
  font-size: 18px;
  color: #333;
  margin: 0 0 8px;
}

.page-header p {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.schedule-card {
  margin-bottom: 30px;
}

.schedule-card .schedule-subtitle {
  font-size: 12px;
  color: #666;
  margin: 8px 0 0;
}

.schedule-row:hover {
  background-color: #f5f7fa !important;
}

.player-group {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
}

.player-group .player-item {
  padding: 4px 8px;
  border-radius: 4px;
  cursor: default;
  transition: background-color 0.2s;
}

.player-group .player-item:hover {
  background-color: #f0f7ff;
}

.player-group .vs {
  color: #666;
  font-weight: 500;
  font-size: 14px;
}

.player-group .bye-tag {
  color: #faad14;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #fffbe6;
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
