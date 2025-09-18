<template>
  <div class="course-booking-container">
    <!-- 页面头部：标题区 -->
    <div class="page-header">
      <h2>课程预约</h2>
      <p>选择已建立双选关系的教练进行课程预约</p>
    </div>

    <!-- 1. 选择教练：搜索卡片 -->
    <el-card class="search-card">
      <el-form :model="searchForm" ref="searchForm" label-width="80px" inline>
        <el-form-item label="选择教练">
          <el-select 
            v-model="searchForm.coachId" 
            placeholder="请选择教练" 
            @change="handleCoachChange"
            style="width: 240px;"
          >
            <el-option 
              v-for="coach in relatedCoaches" 
              :key="coach.id" 
              :label="coach.name" 
              :value="coach.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 2. 教练课表：表格化展示 -->
    <el-card v-if="selectedCoachId" class="schedule-card">
      <div slot="header">
        <h3>{{ selectedCoachName }} 教练的课程表（未来一周）</h3>
      </div>

      <!-- 课表表格 -->
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

        <!-- 已预约课程列 -->
        <el-table-column
          label="已预约课程"
          align="center"
          min-width="200"
        >
          <template slot-scope="scope">
            <div v-if="scope.row.appointments.length > 0" class="appointment-list">
              <div 
                v-for="(appt, idx) in scope.row.appointments" 
                :key="idx" 
                :class="['appointment-item', getAppointmentClass(appt)]"
              >
                <div class="time">{{ formatTime(appt.startTime) }} - {{ formatTime(appt.endTime) }}</div>
                <div class="table">球台: {{ appt.tableId }}</div>
                <el-tag 
                  v-if="appt.studentId === userId"
                  :type="getStatusTagType(appt.status)" 
                  size="mini"
                  style="margin-top: 2px;"
                >
                  {{ getStatusText(appt.status) }}
                </el-tag>
                <div v-if="appt.studentId === userId" class="owner-tag">我的预约</div>
                <div v-else class="other-tag">他人预约</div>
              </div>
            </div>
            <div v-else class="empty-tip">暂无预约</div>
          </template>
        </el-table-column>

        <!-- 可预约时段列 -->
        <el-table-column
          label="可预约时段"
          align="center"
          min-width="300"
        >
          <template slot-scope="scope">
            <!-- 已过期日期：禁用 -->
            <div v-if="isPastDate(scope.row.dateObj)" class="status-tip">
              {{ scope.row.dateObj.toDateString() === new Date().toDateString() ? '今日不可预约' : '已过期' }}
            </div>
            
            <!-- 有校区课表：展示可预约按钮 -->
            <div v-else-if="hasSchoolSchedule" class="available-slots">
              <template v-for="slot in schoolTimeSlots.filter(s => s.dayOfWeek === scope.row.dayOfWeekNum)">
                <el-button 
                  :key="slot.id"  
                  size="mini" 
                  type="text" 
                  :class="getSlotClass(scope.row.dateObj, slot.startTime, slot.endTime)"
                  @click="handleBookClick(scope.row.dateObj, slot.startTime, slot.endTime)"
                  :disabled="hasAppointmentConflict(scope.row.dateObj, slot.startTime, slot.endTime)"
                  style="margin: 2px 4px;"
                >
                  {{ slot.startTime.slice(0, 5) }}-{{ slot.endTime.slice(0, 5) }} 
                  {{ hasAppointmentConflict(scope.row.dateObj, slot.startTime, slot.endTime) ? '(已预约)' : '(可预约)' }}
                </el-button>
              </template>
              
              <div v-if="schoolTimeSlots.filter(s => s.dayOfWeek === scope.row.dayOfWeekNum).length === 0" class="empty-tip">
                暂无可用时段
              </div>
            </div>
            
            <!-- 无校区课表：提示 -->
            <div v-else class="status-tip">{{ scheduleCheckError || '暂无校区课表' }}</div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 3. 待处理教练取消申请（新增部分） -->
    <el-card class="cancel-requests-card">
      <div slot="header">
        <h3>待处理教练取消申请</h3>
      </div>
      <el-table
        v-if="coachCancelRequests.length > 0"
        :data="coachCancelRequests"
        border
        stripe
        style="width: 100%;"
      >
        <el-table-column prop="id" label="申请ID" width="80" align="center"></el-table-column>
        <el-table-column prop="appointmentId" label="预约ID" width="80" align="center"></el-table-column>
        <el-table-column prop="coachName" label="教练" align="center"></el-table-column>
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
        <el-empty description="暂无待处理的教练取消申请"></el-empty>
      </div>
    </el-card>

    <!-- 4. 我的预约列表 -->
    <el-card class="appointments-card">
      <div slot="header">
        <h3>我的预约</h3>
        <div class="cancel-count-info">
          本月剩余取消次数：<span :class="remainingCancelCount <= 0 ? 'count-exhausted' : 'count-available'">
            {{ remainingCancelCount }}/{{ maxCancelCount }}
          </span>
        </div>
      </div>
      <el-table
        :data="myAppointments"
        border
        stripe
        style="width: 100%;"
      >
        <el-table-column prop="id" label="预约ID" width="80" align="center"></el-table-column>
        <el-table-column prop="coachName" label="教练" align="center"></el-table-column>
        <el-table-column prop="startTime" label="开始时间" align="center">
          <template slot-scope="scope">{{ formatFullTime(scope.row.startTime) }}</template>
        </el-table-column>
        <el-table-column prop="endTime" label="结束时间" align="center">
          <template slot-scope="scope">{{ formatFullTime(scope.row.endTime) }}</template>
        </el-table-column>
        <el-table-column prop="tableId" label="球台" align="center"></el-table-column>
        <el-table-column prop="status" label="状态" align="center">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="120">
          <template slot-scope="scope">
            <el-button 
              size="mini" 
              type="danger" 
              @click="handleCancelRequest(scope.row.id)"
              :disabled="!canCancel(scope.row)"
            >
              取消预约
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 5. 预约弹窗 -->
    <el-dialog
      :visible.sync="showBookDialog"
      title="预约课程"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="bookForm" ref="bookForm" label-width="100px">
        <el-form-item label="教练" :label-width="formLabelWidth">
          <el-input v-model="selectedCoachName" disabled></el-input>
        </el-form-item>
        <el-form-item label="日期" :label-width="formLabelWidth">
          <el-date-picker
            v-model="bookForm.date"
            type="date"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
            disabled
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="开始时间" :label-width="formLabelWidth">
          <el-time-picker
            v-model="bookForm.startTime"
            format="HH:mm"
            value-format="HH:mm"
            disabled
          ></el-time-picker>
        </el-form-item>
        <el-form-item label="结束时间" :label-width="formLabelWidth">
          <el-time-picker
            v-model="bookForm.endTime"
            format="HH:mm"
            value-format="HH:mm"
            disabled
          ></el-time-picker>
        </el-form-item>
        <el-form-item label="球台分配" :label-width="formLabelWidth">
          <el-radio-group v-model="bookForm.autoAssign" @change="handleAutoAssignChange">
            <el-radio :label="true">系统自动分配</el-radio>
            <el-radio :label="false">手动选择</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item 
          label="选择球台" 
          :label-width="formLabelWidth"
          v-if="!bookForm.autoAssign"
        >
          <el-select v-model="bookForm.tableId" placeholder="请选择球台">
            <el-option 
              v-for="table in availableTables" 
              :key="table.id" 
              :label="`球台 ${table.id}`" 
              :value="table.id"
            ></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="showBookDialog = false">取消</el-button>
        <el-button type="primary" @click="submitBooking">确认预约</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { 
  getCoachSchedule, 
  bookCourse, 
  getStudentAppointments,
  requestCancel,
  handleCancelRequest,
  getPendingCancelRecords,
  getRemainingCancelCount
} from '@/api/appointment'
import { getRelatedCoaches } from '@/api/student'
import { Message, Loading } from 'element-ui'
import { mapGetters } from 'vuex'
import { 
  checkSchoolHasSchedule, 
  getSchoolSchedule 
} from '@/api/schedule'

export default {
  name: 'CourseBooking',
  computed: {
    ...mapGetters(['userId', 'role', 'schoolId']),
    groupedSchedule() {
      const futureWeek = [];
      for (let i = 0; i < 7; i++) {
        const dateObj = new Date();
        dateObj.setDate(dateObj.getDate() + i);
        const getDayNum = dateObj.getDay();
        const dayOfWeekNum = getDayNum === 0 ? 7 : getDayNum;
        
        futureWeek.push({
          date: this.formatDate(dateObj),
          weekDay: this.getWeekDay(dateObj),
          dateObj: dateObj,
          dayOfWeekNum: dayOfWeekNum
        });
      }

      return futureWeek.map(day => ({
        ...day,
        appointments: this.schedule.filter(appt => 
          this.formatDate(new Date(appt.startTime)) === day.date
        )
      }));
    }
  },
  data() {
    return {
      searchForm: { coachId: null },
      relatedCoaches: [],
      selectedCoachId: null,
      selectedCoachName: '',
      schedule: [],
      schoolTimeSlots: [],
      loadingSchedule: false,
      showBookDialog: false,
      bookForm: {
        date: '',
        startTime: '',
        endTime: '',
        autoAssign: true,
        tableId: null
      },
      availableTables: [],
      formLabelWidth: '100px',
      myAppointments: [],
      hasSchoolSchedule: false,
      scheduleCheckError: '',
      coachCancelRequests: [], // 新增：存储教练发起的取消申请
      remainingCancelCount: 3, // 剩余取消次数
      maxCancelCount: 3,       // 最大取消次数
    }
  },
  created() {
    this.fetchRelatedCoaches();
    this.checkAndFetchSchoolSchedule();
    this.fetchCoachCancelRequests(); // 新增：加载教练取消申请
    this.fetchRemainingCancelCount(); // 新增：获取剩余取消次数
  },
  methods: {
    // 新增：获取剩余取消次数
    async fetchRemainingCancelCount() {
      try {
        const res = await getRemainingCancelCount(this.userId, 'STUDENT');
        this.remainingCancelCount = res.data;
      } catch (err) {
        Message.error(err.message || '获取剩余取消次数失败');
      }
    },

    // 基础数据加载
    async fetchRelatedCoaches() {
      try {
        const res = await getRelatedCoaches(this.userId);
        this.relatedCoaches = res.data || [];
        // 新增：如果有教练，默认选中第一个并加载其课表
        if (this.relatedCoaches.length > 0) {
          this.selectedCoachId = this.relatedCoaches[0].id;
          this.handleCoachChange(this.selectedCoachId); // 触发课表加载
        }
        this.fetchMyAppointments();
      } catch (err) {
        Message.error(err.message || '获取教练列表失败');
      }
    },

    async checkAndFetchSchoolSchedule() {
      const loading = Loading.service({ text: '校验校区课表中...' });
      try {
        const checkRes = await checkSchoolHasSchedule(this.schoolId, this.role === 'SUPER_ADMIN');
        if (!checkRes.data) {
          this.scheduleCheckError = '当前校区未配置课表，无法预约';
          this.hasSchoolSchedule = false;
          Message.warning(this.scheduleCheckError);
          return;
        }

        const scheduleRes = await getSchoolSchedule(this.schoolId, this.role === 'super_admin');
        this.schoolTimeSlots = scheduleRes.data || [];
        if (this.schoolTimeSlots.length === 0) {
          this.scheduleCheckError = '当前校区无可用预约时段';
          Message.warning(this.scheduleCheckError);
        }
        this.hasSchoolSchedule = true;
      } catch (err) {
        this.scheduleCheckError = err.message || '校区课表加载失败';
        this.hasSchoolSchedule = false;
        Message.error(this.scheduleCheckError);
      } finally {
        loading.close();
      }
    },

    async handleCoachChange(coachId) {
      if (!coachId) return;
      this.selectedCoachId = coachId;
      this.selectedCoachName = this.relatedCoaches.find(c => c.id === coachId)?.name || '';
      await this.fetchCoachSchedule();
    },

    async fetchCoachSchedule() {
      if(this.selectedCoachId != null){
        this.loadingSchedule = true;
        try {
          const res = await getCoachSchedule(this.selectedCoachId);
          this.schedule = res.data || [];
        } catch (err) {
          Message.error(err.message || '获取教练课表失败');
        } finally {
          this.loadingSchedule = false;
        }
      }
    },

    async fetchMyAppointments() {
      try {
        const res = await getStudentAppointments(this.userId);
        const appointments = res.data || [];
        
        this.myAppointments = appointments.map(appt => {
          const coach = this.relatedCoaches.find(c => c.id === appt.coachId);
          return {
            ...appt,
            coachName: coach ? coach.name : "未知教练"
          };
        });
      } catch (err) {
        Message.error(err.message || '获取我的预约失败');
      }
    },

    // 新增：加载教练发起的取消申请
    async fetchCoachCancelRequests() {
      try {
        // 获取用户类型为COACH的待处理取消申请
        const res = await getPendingCancelRecords(this.userId, 'COACH');
        // 为取消申请添加教练姓名
        this.coachCancelRequests = res.data.map(req => {
          const coach = this.relatedCoaches.find(
            c => String(c.id) === String(req.coachId)
          );
          return {
            ...req,
            coachName: coach ? coach.name : `未知教练(${req.coachId})`
          };
        });
      } catch (err) {
        Message.error(err.message || '获取教练取消申请失败');
      }
    },

    // 预约交互逻辑
    handleBookClick(dateObj, startTime, endTime) {
      this.bookForm = {
        date: this.formatDate(dateObj),
        startTime: startTime,
        endTime: endTime,
        autoAssign: true,
        tableId: null
      };
      this.fetchAvailableTables(dateObj, startTime, endTime);
      this.showBookDialog = true;
    },

    async fetchAvailableTables(dateObj, startTime, endTime) {
      this.availableTables = [
        { id: 1 }, { id: 2 }, { id: 3 }
      ];
    },

    handleAutoAssignChange(val) {
      if (val) this.bookForm.tableId = null;
    },

    async submitBooking() {
      const loading = Loading.service({ text: '提交预约中...' });
      try {
        const startTime = `${this.bookForm.date}T${this.bookForm.startTime}`;
        const endTime = `${this.bookForm.date}T${this.bookForm.endTime}`;

        await bookCourse({
          coachId: this.selectedCoachId,
          studentId: this.userId,
          startTime,
          endTime,
          tableId: this.bookForm.tableId,
          autoAssign: this.bookForm.autoAssign
        });

        Message.success('预约申请已提交，请等待教练确认');
        this.showBookDialog = false;
        await this.fetchCoachSchedule();
        await this.fetchMyAppointments();
      } catch (err) {
        Message.error(err.message || '预约失败');
      } finally {
        loading.close();
      }
    },

    async handleCancelRequest(appointmentId) {
      this.$confirm('确定要取消预约吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await requestCancel(appointmentId, this.userId, 'STUDENT');
          Message.success('取消申请已提交');
          await this.fetchMyAppointments();
          await this.fetchCoachSchedule();
          await this.fetchRemainingCancelCount(); // 新增：刷新剩余次数
        } catch (err) {
          Message.error(err.message || '取消申请失败');
        }
      }).catch(() => {
        Message.info('已取消操作');
      });
    },

    // 新增：处理教练发起的取消申请
    async handleCancelApprove(cancelRecordId, approve) {
      const loading = Loading.service({ text: '处理中...' });
      try {
        await handleCancelRequest(cancelRecordId, approve);
        Message.success(approve ? '已同意取消' : '已拒绝取消');
        this.fetchCoachCancelRequests(); // 刷新取消申请列表
        this.fetchMyAppointments(); // 刷新预约列表
        this.fetchCoachSchedule(); // 刷新课表
      } catch (err) {
        Message.error(err.message || '处理失败');
      } finally {
        loading.close();
      }
    },

    // 工具方法
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    formatTime(timeStr) {
      const date = new Date(timeStr);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    formatFullTime(timeStr) {
      const date = new Date(timeStr);
      return `${this.formatDate(date)} ${this.formatTime(timeStr)}`;
    },

    getWeekDay(date) {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekDays[date.getDay()];
    },

    isPastDate(dateObj) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 今天0点
      const targetDate = new Date(dateObj);
      targetDate.setHours(0, 0, 0, 0); // 目标日期0点
      // 当天及之前的日期都视为已过期
      return targetDate <= today;
    },

    hasAppointmentConflict(dateObj, startTime, endTime) {
      const targetDate = this.formatDate(dateObj);
      const targetStart = new Date(`${targetDate}T${startTime}`);
      const targetEnd = new Date(`${targetDate}T${endTime}`);

      return this.schedule.some(appt => {
        const apptStart = new Date(appt.startTime);
        const apptEnd = new Date(appt.endTime);
        return apptStart < targetEnd && apptEnd > targetStart;
      });
    },

    // 样式相关方法
    getAppointmentClass(appointment) {
      return appointment.studentId === this.userId 
        ? 'own-appointment' 
        : 'other-appointment';
    },

    getSlotClass(dateObj, startTime, endTime) {
      if (!this.hasAppointmentConflict(dateObj, startTime, endTime)) {
        return 'available-slot';
      }

      const targetDate = this.formatDate(dateObj);
      const targetStart = new Date(`${targetDate}T${startTime}`);
      const targetEnd = new Date(`${targetDate}T${endTime}`);
      const isOwn = this.schedule.some(appt => {
        const apptStart = new Date(appt.startTime);
        const apptEnd = new Date(appt.endTime);
        return appt.studentId === this.userId && apptStart < targetEnd && apptEnd > targetStart;
      });

      return isOwn ? 'own-slot' : 'other-slot';
    },

    getStatusText(status) {
      const map = {
        'PENDING_CONFIRM': '待教练确认',
        'CONFIRMED': '已确认',
        'REJECTED': '已拒绝',
        'CANCEL_REQUESTED': '已申请取消',
        'CANCELLED': '已取消'
      };
      return map[status] || status;
    },

    getStatusTagType(status) {
      const map = {
        'PENDING_CONFIRM': 'warning',
        'CONFIRMED': 'success',
        'REJECTED': 'danger',
        'CANCEL_REQUESTED': 'info',
        'CANCELLED': 'default'
      };
      return map[status] || 'default';
    },

    canCancel(appointment) {
      if (appointment.status !== 'CONFIRMED') return false;
      const startTime = new Date(appointment.startTime);
      const now = new Date();
      const hoursDiff = (startTime - now) / (1000 * 60 * 60);
      return hoursDiff >= 24 && this.remainingCancelCount > 0;
    }
  }
}
</script>

<style lang="scss" scoped>


.cancel-count-info {
  margin-top: 8px;
  font-size: 14px;
  color: #666;
  
  .count-available {
    color: #52c41a;
    font-weight: bold;
  }
  
  .count-exhausted {
    color: #f5222d;
    font-weight: bold;
  }
}
/* 基础容器样式 */
.course-booking-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面头部 */
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

/* 搜索卡片 */
.search-card {
  margin-bottom: 20px;
  padding: 15px;
}

/* 课表卡片 */
.schedule-card {
  margin-bottom: 30px;
}

/* 已预约课程列表样式 */
.appointment-list {
  padding: 4px 0;
}
.appointment-item {
  font-size: 12px;
  padding: 3px 6px;
  margin-bottom: 4px;
  border-radius: 3px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.own-appointment {
  background-color: #e6f7e9;
  color: #2a9d54;
  border-left: 3px solid #52c41a;
}
.other-appointment {
  background-color: #fee;
  color: #d9534f;
  border-left: 3px solid #f5222d;
}
.owner-tag {
  font-size: 11px;
  color: #52c41a;
  margin-top: 2px;
}

/* 可预约时段按钮容器 */
.available-slots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding: 4px 0;
}

/* 状态提示 */
.status-tip, .empty-tip {
  font-size: 12px;
  color: #999;
  padding: 8px 0;
}

/* 按钮样式 */
.available-slot {
  color: #1890ff;
  &:hover {
    color: #40a9ff;
    background-color: #e6f7ff;
  }
}
.own-slot {
  color: #52c41a;
  cursor: not-allowed;
}
.other-slot {
  color: #f5222d;
  cursor: not-allowed;
}

/* 取消申请卡片（新增） */
.cancel-requests-card {
  margin-bottom: 30px;
}

/* 我的预约列表卡片 */
.appointments-card {
  margin-top: 30px;
}

/* 空状态样式（新增） */
.empty {
  margin: 40px 0;
  text-align: center;
}

/* 表格单元格垂直居中 */
.el-table__cell {
  vertical-align: middle !important;
}
</style>