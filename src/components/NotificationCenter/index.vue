<template>
  <div class="notification-center">
    <el-badge 
      :value="unreadCount" 
      class="notification-badge"
      :max="99"
    >
      <el-button 
        icon="el-icon-bell" 
        circle 
        @click="showNotifications = !showNotifications"
      ></el-button>
    </el-badge>

    <el-drawer
      title="通知中心"
      :visible.sync="showNotifications"
      :with-header="false"
      size="500px"
      placement="top"
    >
      <div v-if="loading" class="loading-state">
        <el-loading-spinner></el-loading-spinner>
        <p>加载通知中...</p>
      </div>
      
      <!-- 替换 Element Plus 图标为 Element UI 2.x 自带图标 -->
      <div v-else-if="notifications.length === 0" class="empty-state">
        <el-icon class="el-icon-bell-off"></el-icon>
        <p>暂无通知</p>
      </div>
      
      <el-scrollbar v-else class="notification-list">
        <div 
          v-for="notification in notifications" 
          :key="notification.id"
          :class="['notification-item', { 'unread': !notification.read }]"
        >
          <div class="notification-content">
            {{ notification.content }}
          </div>
          <div class="notification-time">
            {{ formatTime(notification.createTime) }}
          </div>
          <div class="notification-actions">
            <!-- 根据通知类型显示不同操作 -->
            <template v-if="notification.type === 'COURSE_EVALUATION'">
              <el-button 
                size="mini" 
                type="text" 
                @click="handleEvaluation(notification)"
              >
                去评价
              </el-button>
              <el-button 
                size="mini" 
                type="text" 
                @click="gotoAppointment(notification.appointmentId)"
              >
                查看预约
              </el-button>
            </template>
            
            <template v-if="notification.type === 'COACH_CHANGE_REQUEST' && !notification.read">
              <el-button 
                size="mini" 
                type="text" 
                @click="gotoChangeRequest(notification.changeRequestId)"
              >
                处理申请
              </el-button>
            </template>
            
            <el-button 
              size="mini" 
              type="text" 
              @click="markAsRead(notification.id)"
              v-if="!notification.read"
            >
              标记已读
            </el-button>
          </div>
        </div>
      </el-scrollbar>
    </el-drawer>
    
    <evaluation-form
      :visible="showEvaluationForm"
      :appointment-id="currentAppointmentId"
      :evaluator-id="userId"
      :evaluator-type="userType"
      :notification-id="currentNotificationId"
      @evaluationSubmitted="onEvaluationSubmitted"
    ></evaluation-form>
  </div>
</template>

<script>
// 删除 Element Plus 图标库引用
import { getUnreadNotifications, markNotificationAsRead } from '@/api/notification'
import EvaluationForm from '@/views/evaluation/form'

export default {
  components: {
    EvaluationForm,
    // 删除 Element Plus 图标组件注册
  },
  data() {
    return {
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      loading: false,
      showEvaluationForm: false,
      currentAppointmentId: 0,
      currentNotificationId: 0,
      notificationTimer: null
    }
  },
  computed: {
    userId() {
      return this.$store.getters.userId
    },
    role() {
      return this.$store.getters.role
    },
    userType() {
      return this.role === 'student' ? 'STUDENT' : 
             this.role === 'coach' ? 'COACH' : 'ADMIN'
    }
  },
  created() {
    this.fetchNotifications()
    // 每分钟检查一次新通知
    this.notificationTimer = setInterval(() => {
      this.fetchNotifications()
    }, 60000)
  },
  beforeDestroy() {
    clearInterval(this.notificationTimer)
  },
  methods: {
    async fetchNotifications() {
      if (!this.userId) return
      
      this.loading = true
      try {
        const res = await getUnreadNotifications(this.userId, this.userType)
        this.notifications = res.data || []
        this.unreadCount = this.notifications.filter(n => !n.read).length
      } catch (error) {
        console.error('获取通知失败:', error)
      } finally {
        this.loading = false
      }
    },
    
    async markAsRead(notificationId) {
      try {
        await markNotificationAsRead(notificationId)
        const notification = this.notifications.find(n => n.id === notificationId)
        if (notification) {
          notification.read = true
          this.unreadCount = this.notifications.filter(n => !n.read).length
        }
      } catch (error) {
        this.$message.error(error.message || '标记已读失败')
      }
    },
    
    handleEvaluation(notification) {
      this.currentAppointmentId = notification.appointmentId
      this.currentNotificationId = notification.id
      this.showEvaluationForm = true
      this.showNotifications = false
    },
    
    onEvaluationSubmitted() {
      this.showEvaluationForm = false
      this.fetchNotifications()
    },
    
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return date.toLocaleString()
    },
    
    // 跳转到预约详情
    gotoAppointment(appointmentId) {
      this.showNotifications = false
      this.$router.push({ 
        path: this.role === 'student' ? '/student/course-booking' : '/coach/appointment-manage',
        query: { id: appointmentId }
      })
    },
    
    // 跳转到更换教练申请处理页面
    gotoChangeRequest(requestId) {
      this.showNotifications = false
      console.log("currole " + this.role)
      if (this.role === 'student') {
        this.$router.push({ path: '/coach_change' })
      } else if (this.role === 'coach') {
        this.$router.push({ 
          path: '/coach_change_manage',
          query: { id: requestId }
        })
      } else if (this.role === 'admin' || this.role === 'super_admin') {
        this.$router.push({ 
          path: '/admin/coach_change_manage',
          query: { id: requestId }
        })
      }
    }
  }
}
</script>

<style scoped>
.notification-badge {
  margin-right: 15px;
}

.notification-list {
  padding: 10px 0;
  height: calc(100vh - 100px);
}

.notification-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.notification-item.unread {
  background-color: #f5f7fa;
}

.notification-item.read {
  color: #999;
}

.notification-content {
  margin-bottom: 10px;
  line-height: 1.5;
}

.notification-time {
  color: #999;
  font-size: 12px;
  margin-bottom: 10px;
}

.notification-actions {
  text-align: right;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 50px 0;
  color: #999;
}

.loading-state .el-loading-spinner {
  margin-bottom: 15px;
}

/* 调整空状态图标大小（可选） */
.empty-state .el-icon-bell-off {
  font-size: 24px;
  margin-bottom: 10px;
}
</style>