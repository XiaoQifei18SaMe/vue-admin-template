<template>
  <el-card>
    <div slot="header">
      <el-tabs v-model="activeTab" @tab-click="handleTabChange">
        <el-tab-pane label="我的评价" name="myEvaluations"></el-tab-pane>
        <el-tab-pane label="收到的评价" name="receivedEvaluations"></el-tab-pane>
      </el-tabs>
    </div>

    <!-- 我的评价表格 -->
    <el-table
      v-if="activeTab === 'myEvaluations'"
      :data="myEvaluations"
      border
      style="width: 100%"
      v-loading="loading"
      element-loading-text="加载我的评价中..."
    >
      <!-- <el-table-column prop="id" label="评价ID" width="80" align="center"></el-table-column>
      <el-table-column prop="appointmentId" label="预约ID" width="100" align="center"></el-table-column> -->
      <el-table-column label="评价人" width="120" align="center">
        <template slot-scope>
          {{ realname }}
        </template>
      </el-table-column>
      <el-table-column label="评价时间" width="200" align="center">
        <template slot-scope="scope">
          {{ formatDateTime(scope.row.updateTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="content" label="评价内容" min-width="300"></el-table-column>
      <el-table-column label="操作" width="120" align="center">
        <template slot-scope="scope">
          <el-button 
            size="mini" 
            type="text" 
            @click="handleEditComment(scope.row)"
          >
            编辑
          </el-button>
          <el-button 
            size="mini" 
            type="text" 
            style="color: #f5222d"
            @click="handleDeleteComment(scope.row)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 收到的评价表格 -->
    <el-table
      v-if="activeTab === 'receivedEvaluations'"
      :data="receivedEvaluations"
      border
      style="width: 100%"
      v-loading="loading"
      element-loading-text="加载收到的评价中..."
    >
      <!-- <el-table-column prop="id" label="评价ID" width="80" align="center"></el-table-column>
      <el-table-column prop="appointmentId" label="预约ID" width="100" align="center"></el-table-column> -->
      <el-table-column label="评价人" width="120" align="center">
         <template slot-scope="scope">
          {{ relatedUsers[scope.row.evaluatorId] || '未知用户' }}
        </template>
      </el-table-column>
      <el-table-column label="评价时间" width="200" align="center">
        <template slot-scope="scope">
          {{ formatDateTime(scope.row.updateTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="content" label="评价内容" min-width="300"></el-table-column>
    </el-table>

    <!-- 空状态提示 -->
    <div 
      v-if="!loading && myEvaluations.length === 0 && activeTab === 'myEvaluations'" 
      class="empty-state"
    >
      暂无评价记录
    </div>
    <div 
      v-if="!loading && receivedEvaluations.length === 0 && activeTab === 'receivedEvaluations'" 
      class="empty-state"
    >
      暂无收到的评价
    </div>

    <!-- 新增：评价编辑弹窗（与课程预约评论弹窗逻辑一致） -->
    <el-dialog
      :visible.sync="showCommentDialog"
      :title="currentEvaluation ? '编辑评价' : '发表评价'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form 
        :model="commentForm" 
        ref="commentForm" 
        label-width="80px"
        :rules="[
          { required: true, message: '请输入评价内容', trigger: 'blur' },
          { max: 500, message: '评价内容不超过500字', trigger: 'blur' }
        ]"
      >
        <el-form-item label="评价内容" prop="content">
          <el-input
            v-model="commentForm.content"
            type="textarea"
            rows="5"
            placeholder="请输入评价内容..."
          ></el-input>
          <div class="word-count">{{ commentForm.content.length }}/500</div>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="showCommentDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="submitComment"
          :loading="submitCommentLoading"
        >
          {{ currentEvaluation ? '更新评价' : '提交评价' }}
        </el-button>
      </div>
    </el-dialog>
  </el-card>
</template>

<script>
// 新增：导入编辑/删除所需的API
import { 
  getEvaluationsByUser, 
  getEvaluationsByAppointment,
  updateEvaluation,  // 编辑评价API
  deleteEvaluation   // 删除评价API
} from '@/api/evaluation'
import { getStudentAppointments, getCoachAppointments } from '@/api/appointment'
import { mapGetters } from 'vuex'
import { Message, MessageBox } from 'element-ui'
import { getRelatedCoaches } from '@/api/student'
import { getRelatedStudents } from '@/api/coach'

export default {
  name: 'EvaluationList',
  computed: {
    ...mapGetters(['userId', 'role', 'realname']),
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
      userAppointmentIds: [],
      // 新增：存储相关用户信息（key: userId, value: name）
      relatedUsers: {},
      // 新增：加载相关用户的状态
      loadingRelatedUsers: false,

      // 新增：评价弹窗相关状态（与课程预约评论一致）
      showCommentDialog: false,    // 弹窗显示状态
      currentEvaluation: null,     // 当前编辑的评价（null为新增）
      commentForm: { content: '' },// 评价表单
      submitCommentLoading: false  // 提交加载状态
    }
  },
  created() {
    this.fetchMyEvaluations()
    this.fetchUserAppointments()
  },
  methods: {
    async handleTabChange(tab) {
      if (tab.name === 'receivedEvaluations') {
        // 切换到收到的评价时，先加载相关用户信息，再加载评价
        await this.fetchRelatedUsers()
        await this.fetchReceivedEvaluations()
      }
    },

     // 新增：获取相关用户信息（对方的姓名）
    async fetchRelatedUsers() {
      this.loadingRelatedUsers = true
      try {
        let res;
        // 学生：获取相关教练信息；教练：获取相关学员信息
        if (this.userType === 'STUDENT') {
          res = await getRelatedCoaches(this.userId) // 学生的相关教练
        } else {
          res = await getRelatedStudents(this.userId) // 教练的相关学员
        }
        // 转换为 {userId: name} 的映射对象，方便查询
        const users = res.data || []
        this.relatedUsers = users.reduce((map, user) => {
          map[user.id] = user.name // 假设API返回的用户对象包含id和name字段
          return map
        }, {})
        console.log('相关用户信息：', this.relatedUsers)
      } catch (error) {
        this.relatedUsers = {}
        Message.error(error.message || '获取相关用户信息失败')
      } finally {
        this.loadingRelatedUsers = false
      }
    },


    async fetchMyEvaluations() {
      this.loading = true
      try {
        const res = await getEvaluationsByUser(this.userId, this.userType)
        console.log('我的评价API返回数据：', res.data)
        this.myEvaluations = res.data || []
      } catch (error) {
        this.myEvaluations = []
        Message.error(error.message || '获取我的评价失败')
      } finally {
        this.loading = false
      }
    },

    async fetchUserAppointments() {
      try {
        let res = null;
        if(this.userType === 'STUDENT'){
          res = await getStudentAppointments(this.userId)
        }
        else{
          res = await getCoachAppointments(this.userId)
        }
        const appointments = res.data || []
        this.userAppointmentIds = [...new Set(appointments.map(appt => appt.id))]
        console.log('用户所有预约ID：', this.userAppointmentIds)
      } catch (error) {
        this.userAppointmentIds = []
        Message.error(error.message || '获取预约列表失败')
      }
    },

    async fetchReceivedEvaluations() {
      if (this.userAppointmentIds.length === 0) {
        this.receivedEvaluations = []
        return
      }

      this.loading = true
      try {
        this.receivedEvaluations = []
        for (const appointmentId of this.userAppointmentIds) {
          const res = await getEvaluationsByAppointment(appointmentId)
          const targetEvaluations = (res.data || []).filter(
            item => item.evaluatorType === this.oppositeType
          )
          this.receivedEvaluations.push(...targetEvaluations)
        }
        this.receivedEvaluations.sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        console.log('收到的评价数据：', this.receivedEvaluations)
      } catch (error) {
        this.receivedEvaluations = []
        Message.error(error.message || '获取收到的评价失败')
      } finally {
        this.loading = false
      }
    },

    formatDateTime(dateTime) {
      if (!dateTime) return ''
      const date = new Date(dateTime)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      const second = String(date.getSeconds()).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}:${second}`
    },

    // 修复：编辑评价（打开本地弹窗，回显数据）
    handleEditComment(row) {
      this.currentEvaluation = row  // 存储当前要编辑的评价
      this.commentForm = {          // 回显评价内容到表单
        content: row.content || ''
      }
      this.showCommentDialog = true // 打开弹窗
    },

    // 修复：提交编辑（调用后端API更新评价）
    async submitComment() {
      const commentFormRef = this.$refs.commentForm
      if (!commentFormRef) return

      // 表单验证
      commentFormRef.validate(async (isValid) => {
        if (!isValid) return
        this.submitCommentLoading = true

        try {
          // 调用编辑评价API（参数与后端保持一致）
          await updateEvaluation({
            evaluationId: this.currentEvaluation.id,  // 评价ID（必填）
            content: this.commentForm.content,         // 新的评价内容（必填）
            evaluatorId: this.userId                   // 评价人ID（后端校验归属权）
          })

          Message.success('评价更新成功')
          this.showCommentDialog = false  // 关闭弹窗
          this.fetchMyEvaluations()       // 刷新评价列表
        } catch (error) {
          Message.error(error.message || '评价更新失败')
        } finally {
          this.submitCommentLoading = false
        }
      })
    },

    // 修复：删除评价（调用后端API，确认后执行）
    async handleDeleteComment(row) {
      try {
        // 弹出确认框
        await MessageBox.confirm(
          '确定删除这条评价吗？删除后不可恢复',
          '提示',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        )

        // 调用删除评价API（参数与后端保持一致）
        await deleteEvaluation({
          evaluationId: row.id,         // 要删除的评价ID
          evaluatorId: this.userId      // 评价人ID（后端校验归属权，防止越权删除）
        })

        Message.success('评价删除成功')
        this.fetchMyEvaluations()       // 刷新评价列表
      } catch (error) {
        // 排除“用户取消确认”的错误（element-ui取消时会抛出'cancel'）
        if (error !== 'cancel') {
          Message.error(error.message || '评价删除失败')
        }
      }
    }
  }
}
</script>

<style scoped>
.empty-state {
  text-align: center;
  padding: 50px 0;
  color: #999;
  font-size: 14px;
}
.el-table__cell {
  vertical-align: middle !important;
}
/* 新增：评价弹窗字数统计样式 */
.word-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
</style>