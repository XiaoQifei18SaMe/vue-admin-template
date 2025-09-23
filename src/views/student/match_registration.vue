<template>
  <div class="match-registration-container">
    <div class="page-header">
      <h2>月赛报名</h2>
      <p>选择想要参加的月赛并报名</p>
    </div>

    <!-- 可报名的月赛列表 -->
    <el-card v-if="availableMatches.length > 0" class="matches-card">
      <div slot="header">
        <h3>可报名月赛</h3>
      </div>
      
      <el-table
        :data="availableMatches"
        border
        stripe
        style="width: 100%;"
        v-loading="loading"
      >
        <el-table-column
          prop="title"
          label="比赛名称"
          align="center"
          min-width="200"
        ></el-table-column>
        <el-table-column
          label="比赛时间"
          align="center"
          min-width="180"
        >
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column
          label="报名截止时间"
          align="center"
          min-width="180"
        >
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.registrationDeadline) }}
          </template>
        </el-table-column>
        <el-table-column
          label="报名情况"
          align="center"
          min-width="200"
        >
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              @click="showGroupCounts(scope.row.id)"
            >
              查看各组报名人数
            </el-button>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          align="center"
          width="180"
        >
          <template slot-scope="scope">
            <el-button
              type="primary"
              size="mini"
              @click="openRegistrationDialog(scope.row)"
              :disabled="isRegistered(scope.row.id)"
            >
              {{ isRegistered(scope.row.id) ? '已报名' : '立即报名' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <div v-else-if="!loading" class="no-matches">
      暂无可报名的月赛
    </div>

    <!-- 报名弹窗 -->
    <el-dialog
      :visible.sync="registrationDialogVisible"
      title="月赛报名"
      width="500px"
      :close-on-click-modal="false"
    >
      <div v-if="currentMatch">
        <p><strong>比赛名称：</strong>{{ currentMatch.title }}</p>
        <p><strong>比赛时间：</strong>{{ formatDateTime(currentMatch.startTime) }}</p>
        <p><strong>报名截止：</strong>{{ formatDateTime(currentMatch.registrationDeadline) }}</p>
        <p><strong>报名费：</strong>30元（将从账户余额中扣除）</p>
        
        <el-form
          :model="registrationForm"
          ref="registrationForm"
          label-width="100px"
          style="margin-top: 20px;"
        >
          <el-form-item
            label="选择组别"
            prop="groupType"
            :rules="{ required: true, message: '请选择组别', trigger: 'change' }"
          >
            <el-radio-group v-model="registrationForm.groupType">
              <el-radio label="GROUP_A">甲组</el-radio>
              <el-radio label="GROUP_B">乙组</el-radio>
              <el-radio label="GROUP_C">丙组</el-radio>
            </el-radio-group>
          </el-form-item>
        </el-form>
      </div>
      
      <div slot="footer">
        <el-button @click="registrationDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="submitRegistration"
          :loading="submitting"
        >
          确认报名并支付
        </el-button>
      </div>
    </el-dialog>

    <!-- 组别报名人数弹窗 -->
    <el-dialog
      :visible.sync="groupCountsDialogVisible"
      title="各组报名人数"
      width="400px"
    >
      <el-table
        :data="groupCountsList"
        border
        style="width: 100%;"
      >
        <el-table-column
          prop="groupName"
          label="组别"
          align="center"
          width="150"
        ></el-table-column>
        <el-table-column
          prop="count"
          label="报名人数"
          align="center"
          width="150"
        ></el-table-column>
      </el-table>
      
      <div slot="footer">
        <el-button @click="groupCountsDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import matchApi from '@/api/match'
import { Message, Loading } from 'element-ui'
import { mapGetters } from 'vuex'

export default {
  name: 'MatchRegistration',
  computed: {
    ...mapGetters(['userId']) // 从Vuex获取当前学员ID
  },
  data() {
    return {
      availableMatches: [],
      studentRegistrations: [],
      loading: false,
      submitting: false,
      
      registrationDialogVisible: false,
      currentMatch: null,
      registrationForm: {
        groupType: 'GROUP_A'
      },
      
      groupCountsDialogVisible: false,
      currentMatchId: null,
      groupCountsList: []
    }
  },
  created() {
    this.fetchAvailableMatches()
    this.fetchStudentRegistrations()
  },
  methods: {
    /**
     * 获取可报名的月赛
     */
    async fetchAvailableMatches() {
      this.loading = true
      try {
        const res = await matchApi.getAvailableMatches()
        this.availableMatches = res.data || []
      } catch (err) {
        Message.error(err.message || '获取可报名月赛失败')
      } finally {
        this.loading = false
      }
    },
    
    /**
     * 获取学员的报名记录
     */
    async fetchStudentRegistrations() {
      try {
        const res = await matchApi.getStudentRegistrations(this.userId)
        this.studentRegistrations = res.data || []
      } catch (err) {
        Message.error(err.message || '获取报名记录失败')
      }
    },
    
    /**
     * 检查是否已报名某场比赛
     */
    isRegistered(matchId) {
      return this.studentRegistrations.some(reg => reg.monthlyMatchId === matchId)
    },
    
    /**
     * 打开报名弹窗
     */
    openRegistrationDialog(match) {
      this.currentMatch = match
      this.registrationForm.groupType = 'GROUP_A'
      this.registrationDialogVisible = true
    },
    
    /**
     * 提交报名 - 修复了加载状态无法关闭的问题
     */
    async submitRegistration() {
      // 防止重复提交
      if (this.submitting) return;
      
      this.$refs.registrationForm.validate(async (valid) => {
        if (valid && this.currentMatch) {
          this.submitting = true
          let loading = null
          try {
            // 创建加载实例
            loading = Loading.service({ text: '提交报名中...' })
            
            // 调用API提交报名
            const response = await matchApi.registerForMatch({
              matchId: this.currentMatch.id,
              studentId: this.userId,
              groupType: this.registrationForm.groupType
            })
            
            // 验证API响应是否成功
            if (response && response.success) {
              Message.success('报名成功！')
              this.registrationDialogVisible = false
              
              // 刷新数据
              await Promise.all([
                this.fetchStudentRegistrations(),
                this.fetchAvailableMatches()
              ])
            } else {
              Message.error(response?.message || '报名失败，请重试')
            }
          } catch (err) {
            Message.error(err.message || '报名失败，请重试')
          } finally {
            // 确保加载状态关闭
            this.submitting = false
            if (loading) {
              loading.close()
            }
          }
        }
      })
    },
    
    /**
     * 查看组别报名人数
     */
    async showGroupCounts(matchId) {
      this.currentMatchId = matchId
      try {
        const res = await matchApi.getGroupRegistrationCounts(matchId)
        const counts = res.data || {}
        
        // 转换为列表形式
        this.groupCountsList = [
          { groupName: '甲组', count: counts.GROUP_A || 0 },
          { groupName: '乙组', count: counts.GROUP_B || 0 },
          { groupName: '丙组', count: counts.GROUP_C || 0 }
        ]
        
        this.groupCountsDialogVisible = true
      } catch (err) {
        Message.error(err.message || '获取报名人数失败')
      }
    },
    
    /**
     * 格式化日期时间
     */
    formatDateTime(dateTimeStr) {
      if (!dateTimeStr) return ''
      const date = new Date(dateTimeStr)
      return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  }
}
</script>

<style lang="scss" scoped>
.match-registration-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  h2 {
    margin-bottom: 10px;
    color: #333;
  }
  p {
    color: #666;
    font-size: 14px;
  }
}

.matches-card {
  margin-bottom: 20px;
}

.no-matches {
  text-align: center;
  padding: 50px 0;
  color: #999;
  font-size: 16px;
}

.el-dialog__body {
  p {
    margin: 10px 0;
  }
}
</style>
