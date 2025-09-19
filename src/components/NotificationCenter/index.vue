<template>
  <div class="notification-center">
    <el-badge :value="unreadCount" class="notification-badge">
      <el-button icon="el-icon-bell" circle @click="showNotifications = true"></el-button>
    </el-badge>
    
    <el-drawer
      title="通知中心"
      :visible.sync="showNotifications"
      direction="rtl"
      size="30%"
    >
      <div v-if="loading" class="loading-state">
        <el-loading-spinner></el-loading-spinner>
        <p>加载中...</p>
      </div>
      
      <div v-else-if="notifications.length === 0" class="empty-state">
        暂无通知
      </div>
      
      <div v-else class="notification-list">
        <el-scrollbar style="height: 500px;">
          <div 
            v-for="notification in notifications" 
            :key="notification.id"
            :class="['notification-item', !notification.read ? 'unread' : '']"
          >
            <div class="notification-content">{{ notification.content }}</div>
            <div class="notification-time">{{ formatTime(notification.createTime) }}</div>
            <div class="notification-actions">
              <el-button 
                size="mini" 
                type="text"
                @click="handleEvaluation(notification)"
                v-if="notification.content.includes('评价')"
              >
                去评价
              </el-button>
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
      </div>
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
import { getUnreadNotifications, markNotificationAsRead } from '@/api/notification'
import EvaluationForm from '@/views/evaluation/form'

export default {
  components: {
    EvaluationForm
  },
  data() {
    return {
      showNotifications: false,
      notifications: [],
      unreadCount: 0,
      loading: false,
      showEvaluationForm: false,
      currentAppointmentId: 0,
      currentNotificationId: 0
    }
  },
  computed: {
    // 移除userInfo计算属性，直接使用已有的getter
    userId() {
      return this.$store.getters.userId
    },
    role() {
      return this.$store.getters.role
    },
    userType() {
      // 基于role直接判断用户类型
      return this.role === 'student' ? 'STUDENT' : 'COACH'
    }
  },
  created() {
    // 定时轮询检查新通知
    this.fetchNotifications()
    this.notificationTimer = setInterval(() => {
      this.fetchNotifications()
    }, 60000) // 每分钟检查一次
  },
  beforeDestroy() {
    clearInterval(this.notificationTimer)
  },
  methods: {
    async fetchNotifications() {
      // 改为检查userId是否存在
      if (!this.userId) return
      
      this.loading = true
      try {
        // 使用userId和userType作为参数
        console.log("fetchNotifications " + this.userType)
        const res = await getUnreadNotifications(this.userId, this.userType)
        this.notifications = res.data || []
        console.log("res = " + this.notifications)
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
      this.fetchNotifications() // 刷新通知列表
    },
    
    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      return date.toLocaleString()
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
}

.notification-item {
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.notification-item.unread {
  background-color: #f5f7fa;
}

.notification-content {
  margin-bottom: 10px;
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
</style>