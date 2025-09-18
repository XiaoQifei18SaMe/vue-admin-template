<template>
  <div class="coach-appointment-container">
    <!-- 1. 页面头部（与学生端风格对齐） -->
    <div class="page-header">
      <h2>预约管理</h2>
      <p>查看并处理学员的课程预约请求（未来一周）</p>
    </div>

    <!-- 2. 核心课表：表格化展示（与学生端课表结构一致） -->
    <el-card class="schedule-card">
      <div slot="header">
        <h3>我的课程表（未来一周）</h3>
      </div>

      <!-- 课表表格（border+stripe，与学生端样式统一） -->
      <el-table
        :data="groupedSchedule"
        border
        stripe
        style="width: 100%;"
        v-loading="loadingSchedule"
      >
        <!-- 日期列 -->
        <el-table-column
          label="日期"
          align="center"
          width="120"
        >
          <template slot-scope="scope">
            {{ scope.row.date }}
          </template>
        </el-table-column>

        <!-- 星期列 -->
        <el-table-column
          label="星期"
          align="center"
          width="80"
        >
          <template slot-scope="scope">
            {{ scope.row.weekDay }}
          </template>
        </el-table-column>

        <!-- 预约详情列（核心：区分待确认/已确认） -->
        <el-table-column
          label="预约详情"
          align="center"
          min-width="300"
        >
          <template slot-scope="scope">
            <div v-if="scope.row.appointments.length > 0" class="appointment-list">
              <!-- 遍历当天所有预约 -->
              <div 
                v-for="(appt, idx) in scope.row.appointments" 
                :key="idx" 
                :class="['appointment-item', getAppointmentClass(appt)]"
              >
                <!-- 预约基础信息 -->
                <div class="appt-base">
                  <span class="student-name">学员：{{ appt.studentName }}</span>
                  <span class="time">时间：{{ formatTime(appt.startTime) }} - {{ formatTime(appt.endTime) }}</span>
                  <span class="table">球台：{{ appt.tableId }}</span>
                </div>
                <!-- 预约状态标签 -->
                <div class="appt-status">
                  <el-tag :type="getStatusTagType(appt.status)">
                    {{ getStatusText(appt.status) }}
                  </el-tag>
                </div>
                <!-- 操作区：仅待确认预约显示确认/拒绝按钮 -->
                <div class="appt-actions" v-if="appt.status === 'PENDING_CONFIRM'">
                  <el-button 
                    size="mini" 
                    type="success" 
                    @click="handleApprove(appt.id)"
                    style="margin-right: 4px;"
                  >
                    确认
                  </el-button>
                  <el-button 
                    size="mini" 
                    type="danger" 
                    @click="handleReject(appt.id)"
                  >
                    拒绝
                  </el-button>
                </div>
              </div>
            </div>
            <!-- 空状态提示（与学生端一致） -->
            <div v-else class="empty-tip">暂无预约</div>
          </template>
        </el-table-column>

        <!-- 操作列：仅显示额外操作（如已确认预约的取消） -->
        <el-table-column
          label="操作"
          align="center"
          width="120"
        >
          <template slot-scope="scope">
            <!-- 仅对已确认的预约显示“取消”按钮 -->
            <div v-if="scope.row.appointments.length > 0">
              <div v-for="appt in scope.row.appointments" :key="appt.id">
                <el-button 
                  size="mini" 
                  type="danger" 
                  @click="handleCoachCancel(appt.id)"
                  :disabled="!canCoachCancel(appt)"
                  v-if="appt.status === 'CONFIRMED'"
                >
                  取消预约
                </el-button>
              </div>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 3. 取消申请处理（放在课表下方，与学生端“我的预约”位置对应） -->
    <el-card class="cancel-requests-card">
      <div slot="header">
        <h3>待处理取消申请</h3>
      </div>
      <el-table
        v-if="cancelRequests.length > 0"
        :data="cancelRequests"
        border
        stripe
        style="width: 100%;"
      >
        <el-table-column prop="id" label="申请ID" width="80" align="center"></el-table-column>
        <el-table-column prop="appointmentId" label="预约ID" width="80" align="center"></el-table-column>
        <el-table-column prop="studentName" label="申请人" align="center"></el-table-column>
        <el-table-column prop="createTime" label="申请时间" align="center">
          <template slot-scope="scope">{{ formatFullTime(scope.row.createTime) }}</template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="180">
          <template slot-scope="scope">
            <div style="display: flex; gap: 4px; justify-content: center;">
              <el-button 
                size="mini" 
                type="success" 
                @click="handleCancelApprove(scope.row.id, true)"
              >
                同意取消
              </el-button>
              <el-button 
                size="mini" 
                type="danger" 
                @click="handleCancelApprove(scope.row.id, false)"
              >
                拒绝取消
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
      <div v-else class="empty">
        <el-empty description="暂无待处理的取消申请"></el-empty>
      </div>
    </el-card>
  </div>
</template>

<script>
import { 
  getCoachAppointments, 
  handleCoachConfirmation,
  requestCancel,
  handleCancelRequest,
  getPendingCancelRecords
} from '@/api/appointment'
import { getRelatedStudents } from '@/api/coach' // 新增：获取教练关联的学员列表（用于匹配姓名）
import { Message, Loading } from 'element-ui'
import { mapGetters } from 'vuex'

export default {
  name: 'CoachAppointmentManage',
  computed: {
    ...mapGetters(['userId', 'role', 'schoolId']),
    /**
     * 核心：按未来一周日期分组课表（与学生端groupedSchedule逻辑一致）
     * 返回格式：[{ date: '2024-05-20', weekDay: '周一', dateObj: Date, appointments: [] }, ...]
     */
    groupedSchedule() {
      const futureWeek = [];
      // 生成未来7天日期基础信息
      for (let i = 0; i < 7; i++) {
        const dateObj = new Date();
        dateObj.setDate(dateObj.getDate() + i);
        // 计算星期数值（1-7，与后端对齐）
        const getDayNum = dateObj.getDay();
        const dayOfWeekNum = getDayNum === 0 ? 7 : getDayNum;
        
        futureWeek.push({
          date: this.formatDate(dateObj),
          weekDay: this.getWeekDay(dateObj),
          dateObj: dateObj,
          dayOfWeekNum: dayOfWeekNum,
          appointments: [] // 用于存放当天的预约
        });
      }

      // 为每天匹配对应的预约（关联学员姓名）
      return futureWeek.map(day => ({
        ...day,
        appointments: this.allAppointments.map(appt => {
          // 匹配日期：预约的startTime日期 = 当前行日期
          const apptDate = this.formatDate(new Date(appt.startTime));
          if (apptDate === day.date) {
            // 关联学员姓名（从relatedStudents中匹配）
            const student = this.relatedStudents.find(s => s.id === appt.studentId);
            return {
              ...appt,
              studentName: student ? student.name : `未知学员(${appt.studentId})` // 优化兜底信息
            };
          }
          return null;
        }).filter(Boolean) // 过滤掉null（非当天的预约）
      }));
    }
  },
  data() {
    return {
      allAppointments: [], // 教练的所有预约（原始数据）
      relatedStudents: [], // 教练关联的学员列表（用于匹配姓名）
      cancelRequests: [], // 待处理取消申请
      loadingSchedule: false, // 课表加载中
      cancelCount: 0, // 教练取消预约次数
      maxCancelCount: 3 // 教练取消次数上限
    }
  },
  created() {
    // 加载顺序：先加载关联学员（用于匹配姓名），再加载预约和取消申请
    this.fetchRelatedStudents()
      .then(() => {
        this.fetchAllAppointments();
        this.fetchCancelRequests();
      });
  },
  methods: {
    // ---------------------- 基础数据加载 ----------------------
    /**
     * 加载教练关联的学员列表（已建立双选关系的学员）
     * 用于匹配预约中的studentId → studentName
     */
    async fetchRelatedStudents() {
      try {
        const res = await getRelatedStudents(this.userId); // 需后端提供该接口
        this.relatedStudents = res.data || [];
        console.log(this.relatedStudents)
      } catch (err) {
        Message.error(err.message || '获取学员列表失败');
      }
    },

    /**
     * 加载教练的所有预约（未来一周）
     */
    async fetchAllAppointments() {
      this.loadingSchedule = true;
      try {
        const res = await getCoachAppointments(this.userId); // 调用教练预约列表接口
        this.allAppointments = res.data || [];
      } catch (err) {
        Message.error(err.message || '获取预约列表失败');
      } finally {
        this.loadingSchedule = false;
      }
    },

    /**
     * 加载待处理的取消申请
     */
    async fetchCancelRequests() {
      try {
        const res = await getPendingCancelRecords(this.userId, 'STUDENT');
        // 为取消申请添加申请人姓名
        this.cancelRequests = res.data.map(req => {
          const student = this.relatedStudents.find(
            s => String(s.id) === String(req.studentId)
          );
          return {
            ...req,
            studentName: student ? student.name : `未知学员(${req.studentId})`
          };
        });
      } catch (err) {
        Message.error(err.message || '获取取消申请失败');
      }
    },


    // ---------------------- 预约处理逻辑 ----------------------
    /**
     * 确认学员预约
     */
    async handleApprove(appointmentId) {
      const loading = Loading.service({ text: '处理中...' });
      try {
        await handleCoachConfirmation(appointmentId, true); // 第二个参数true=确认
        Message.success('已确认预约');
        this.fetchAllAppointments(); // 刷新课表
      } catch (err) {
        Message.error(err.message || '确认失败');
      } finally {
        loading.close();
      }
    },

    /**
     * 拒绝学员预约
     */
    async handleReject(appointmentId) {
      const loading = Loading.service({ text: '处理中...' });
      try {
        await handleCoachConfirmation(appointmentId, false); // 第二个参数false=拒绝
        Message.success('已拒绝预约');
        this.fetchAllAppointments(); // 刷新课表
      } catch (err) {
        Message.error(err.message || '拒绝失败');
      } finally {
        loading.close();
      }
    },

    /**
     * 教练主动取消已确认的预约
     */
    async handleCoachCancel(appointmentId) {
      this.$confirm('确定要取消该预约吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await requestCancel(appointmentId, this.userId, 'COACH'); // userType=COACH
          Message.success('取消申请已提交');
          this.cancelCount += 1;
          this.fetchAllAppointments();
          this.fetchCancelRequests();
        } catch (err) {
          Message.error(err.message || '取消失败');
        }
      }).catch(() => {
        Message.info('已取消操作');
      });
    },

    /**
     * 处理学员的取消申请（同意/拒绝）
     */
    async handleCancelApprove(cancelRecordId, approve) {
      const loading = Loading.service({ text: '处理中...' });
      try {
        await handleCancelRequest(cancelRecordId, approve);
        Message.success(approve ? '已同意取消' : '已拒绝取消');
        this.fetchCancelRequests(); // 刷新取消申请列表
        this.fetchAllAppointments(); // 刷新课表
      } catch (err) {
        Message.error(err.message || '处理失败');
      } finally {
        loading.close();
      }
    },

    // ---------------------- 工具方法（与学生端复用相同逻辑） ----------------------
    // 格式化日期：yyyy-MM-dd
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    // 格式化时间：HH:mm
    formatTime(timeStr) {
      const date = new Date(timeStr);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    // 格式化完整时间：yyyy-MM-dd HH:mm
    formatFullTime(timeStr) {
      const date = new Date(timeStr);
      return `${this.formatDate(date)} ${this.formatTime(timeStr)}`;
    },

    // 获取星期文本：周一~周日
    getWeekDay(date) {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekDays[date.getDay()];
    },

    // ---------------------- 样式相关方法 ----------------------
    // 获取预约项样式（待确认/已确认/已拒绝等）
    getAppointmentClass(appt) {
      switch (appt.status) {
        case 'PENDING_CONFIRM':
          return 'pending-appointment'; // 待确认：黄色底色
        case 'CONFIRMED':
          return 'confirmed-appointment'; // 已确认：绿色底色
        case 'REJECTED':
          return 'rejected-appointment'; // 已拒绝：红色底色
        case 'CANCELLED':
          return 'cancelled-appointment'; // 已取消：灰色底色
        default:
          return '';
      }
    },

    // 获取状态文本（与学生端一致，补充教练端所需状态）
    getStatusText(status) {
      const statusMap = {
        'PENDING_CONFIRM': '待确认',
        'CONFIRMED': '已确认',
        'REJECTED': '已拒绝',
        'CANCEL_REQUESTED': '已申请取消',
        'CANCELLED': '已取消'
      };
      return statusMap[status] || status;
    },

    // 获取状态标签类型（颜色与学生端统一）
    getStatusTagType(status) {
      const typeMap = {
        'PENDING_CONFIRM': 'warning',
        'CONFIRMED': 'success',
        'REJECTED': 'danger',
        'CANCEL_REQUESTED': 'info',
        'CANCELLED': 'default'
      };
      return typeMap[status] || 'default';
    },

    // 判断教练是否可取消预约（已确认+提前24小时+未超次数）
    canCoachCancel(appt) {
      if (appt.status !== 'CONFIRMED') return false;
      // 提前24小时判断
      const startTime = new Date(appt.startTime);
      const now = new Date();
      const hoursDiff = (startTime - now) / (1000 * 60 * 60);
      return hoursDiff >= 24 && this.cancelCount < this.maxCancelCount;
    }
  }
}
</script>

<style lang="scss" scoped>
/* 基础容器样式（与学生端完全一致） */
.coach-appointment-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面头部（复用学生端样式） */
.page-header {
  margin-bottom: 20px;
  h2 {
    margin: 0 0 10px 0;
    font-size: 18px;
    color: #333;
  }
  p {
    margin: 0;
    color: #666;
    font-size: 14px;
  }
}

/* 课表卡片（与学生端一致） */
.schedule-card {
  margin-bottom: 30px;
}

/* 预约列表样式（细化状态区分） */
.appointment-list {
  padding: 4px 0;
}
/* 预约项整体居中 */
.appointment-item {
  font-size: 12px;
  padding: 8px;
  margin-bottom: 6px;
  border-radius: 4px;
  border-left: 3px solid transparent;
  text-align: center; /* 新增：整体文本居中 */
}

/* 预约基础信息区居中 */
.appt-base {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
  justify-content: center; /* 新增：内部元素水平居中 */
}

/* 操作按钮区居中 */
.appt-actions {
  display: flex;
  justify-content: center; /* 修改：从flex-start改为center */
  gap: 4px;
  margin-top: 4px; /* 增加一点间距 */
}

/* 状态标签区居中 */
.appt-status {
  margin-bottom: 4px;
  text-align: center; /* 确保状态标签居中 */
}

/* 待确认预约：黄色底色+橙色边框 */
.pending-appointment {
  background-color: #fff8e6;
  border-left-color: #faad14;
}
/* 已确认预约：绿色底色+绿色边框 */
.confirmed-appointment {
  background-color: #f0f9eb;
  border-left-color: #52c41a;
}
/* 已拒绝预约：红色底色+红色边框 */
.rejected-appointment {
  background-color: #fff1f0;
  border-left-color: #f5222d;
}
/* 已取消预约：灰色底色+灰色边框 */
.cancelled-appointment {
  background-color: #f5f5f5;
  border-left-color: #999;
}


.student-name, .time, .table {
  padding: 2px 4px;
  border-radius: 2px;
  background-color: rgba(255,255,255,0.6);
}


/* 空状态提示（与学生端一致） */
.empty-tip, .empty {
  font-size: 12px;
  color: #999;
  padding: 8px 0;
  text-align: center;
}
.empty {
  margin: 40px 0;
}

/* 取消申请卡片（与课表卡片样式统一） */
.cancel-requests-card {
  margin-bottom: 30px;
}

/* 表格单元格垂直居中（强制对齐） */
.el-table__cell {
  vertical-align: middle !important;
}
</style>