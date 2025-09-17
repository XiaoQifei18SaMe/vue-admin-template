<template>
  <div class="course-booking-container">
    <!-- 页面头部：标题区（与课表管理风格对齐） -->
    <div class="page-header">
      <h2>课程预约</h2>
      <p>选择已建立双选关系的教练进行课程预约</p>
    </div>

    <!-- 1. 选择教练：搜索卡片（保留原功能，样式对齐课表管理） -->
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

    <!-- 2. 教练课表：表格化展示（核心改造，替换原日历） -->
    <el-card v-if="selectedCoachId" class="schedule-card">
      <div slot="header">
        <h3>{{ selectedCoachName }} 教练的课程表（未来一周）</h3>
      </div>

      <!-- 课表表格（与课表管理表格样式统一：border+stripe） -->
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
                <div v-if="appt.studentId === userId" class="owner-tag">自己的预约</div>
              </div>
            </div>
            <div v-else class="empty-tip">暂无预约</div>
          </template>
        </el-table-column>

        <!-- 可预约时段列（核心交互区） -->
        <el-table-column
          label="可预约时段"
          align="center"
          min-width="300"
        >
          <template slot-scope="scope">
            <!-- 已过期日期：禁用 -->
            <div v-if="isPastDate(scope.row.dateObj)" class="status-tip">已过期</div>
            
            <!-- 有校区课表：展示可预约按钮（Vue2 兼容版） -->
            <div v-else-if="hasSchoolSchedule" class="available-slots">
              <!-- 1. 筛选当前行星期对应的时段，Vue2中template的v-for不直接绑定key -->
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
                  <!-- 2. 格式化时间：去掉秒数（HH:mm:ss → HH:mm） -->
                  {{ slot.startTime.slice(0, 5) }}-{{ slot.endTime.slice(0, 5) }} 
                  {{ hasAppointmentConflict(scope.row.dateObj, slot.startTime, slot.endTime) ? '(已预约)' : '(可预约)' }}
                </el-button>
              </template>
              
              <!-- 3. 筛选后无时段：显示提示 -->
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

    <!-- 3. 预约弹窗（保留原功能，样式对齐课表管理） -->
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

    <!-- 4. 我的预约列表（表格化，与课表管理风格统一） -->
    <el-card class="appointments-card">
      <div slot="header">
        <h3>我的预约</h3>
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
  </div>
</template>

<script>
import { 
  getCoachSchedule, 
  bookCourse, 
  getStudentAppointments,
  requestCancel
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
    /**
     * 核心改造：将教练课表按「未来一周日期」分组，用于表格渲染
     * 返回格式：[{ date: '2024-05-20', weekDay: '周一', dateObj: Date, appointments: [] }, ...]
     */
    groupedSchedule() {
      const futureWeek = [];
      for (let i = 0; i < 7; i++) {
        const dateObj = new Date();
        dateObj.setDate(dateObj.getDate() + i);
        // 关键新增：计算星期数值（1-7，与后端 dayOfWeek 对齐）
        const getDayNum = dateObj.getDay(); // 原生 getDay() 返回 0-6（0=周日）
        const dayOfWeekNum = getDayNum === 0 ? 7 : getDayNum; // 转换为 1-7
        
        futureWeek.push({
          date: this.formatDate(dateObj),
          weekDay: this.getWeekDay(dateObj),
          dateObj: dateObj,
          dayOfWeekNum: dayOfWeekNum // 新增：用于匹配后端时段的星期
        });
      }

      // 为每天匹配已预约课程（原有逻辑不变）
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
      relatedCoaches: [], // 双选教练列表
      selectedCoachId: null, // 当前选中教练ID
      selectedCoachName: '', // 当前选中教练名称
      schedule: [], // 教练已预约课表
      schoolTimeSlots: [], // 校区可预约时段
      loadingSchedule: false, // 课表加载中
      showBookDialog: false, // 预约弹窗显隐
      bookForm: { // 预约表单
        date: '',
        startTime: '',
        endTime: '',
        autoAssign: true,
        tableId: null
      },
      availableTables: [], // 可选球台
      formLabelWidth: '100px',
      myAppointments: [], // 我的预约列表
      cancelCount: 0, // 取消次数
      maxCancelCount: 3, // 最大取消次数
      hasSchoolSchedule: false, // 校区是否有课表
      scheduleCheckError: '' // 课表错误提示
    }
  },
  created() {
    this.fetchRelatedCoaches(); // 加载双选教练
    this.checkAndFetchSchoolSchedule(); // 校验校区课表
  },
  methods: {
    // ---------------------- 基础数据加载 ----------------------
    // 加载双选教练列表
    async fetchRelatedCoaches() {
      try {
        const res = await getRelatedCoaches(this.userId);
        this.relatedCoaches = res.data || [];
        this.fetchMyAppointments(); // 同步更新我的预约
      } catch (err) {
        Message.error(err.message || '获取教练列表失败');
      }
    },

    // 校验并加载校区课表
    async checkAndFetchSchoolSchedule() {
      const loading = Loading.service({ text: '校验校区课表中...' });
      try {
        // 1. 先校验校区是否有课表
        const checkRes = await checkSchoolHasSchedule(this.schoolId, this.role === 'SUPER_ADMIN');
        if (!checkRes.data) {
          this.scheduleCheckError = '当前校区未配置课表，无法预约';
          this.hasSchoolSchedule = false;
          Message.warning(this.scheduleCheckError);
          return;
        }

        // 2. 校验通过，加载校区可预约时段
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

    // 选择教练后加载其课表
    async handleCoachChange(coachId) {
      if (!coachId) return;
      this.selectedCoachId = coachId;
      this.selectedCoachName = this.relatedCoaches.find(c => c.id === coachId)?.name || '';
      await this.fetchCoachSchedule();
    },

    // 加载教练已预约课表
    async fetchCoachSchedule() {
      this.loadingSchedule = true;
      try {
        const res = await getCoachSchedule(this.selectedCoachId);
        this.schedule = res.data || [];
      } catch (err) {
        Message.error(err.message || '获取教练课表失败');
      } finally {
        this.loadingSchedule = false;
      }
    },

    // 加载我的预约列表
    async fetchMyAppointments() {
      try {
        const res = await getStudentAppointments(this.userId);
        const appointments = res.data || [];
        
        // 关键逻辑：为每个预约项添加 coachName 字段
        this.myAppointments = appointments.map(appt => {
          // 在 relatedCoaches 中查找对应教练
          const coach = this.relatedCoaches.find(c => c.id === appt.coachId);
          return {
            ...appt,
            // 若找到教练则取姓名，否则显示"未知教练"
            coachName: coach ? coach.name : "未知教练"
          };
        });
      } catch (err) {
        Message.error(err.message || '获取我的预约失败');
      }
    },

    // ---------------------- 预约交互逻辑 ----------------------
    // 点击可预约时段，打开弹窗
    handleBookClick(dateObj, startTime, endTime) {
      this.bookForm = {
        date: this.formatDate(dateObj),
        startTime: startTime,
        endTime: endTime,
        autoAssign: true,
        tableId: null
      };
      this.fetchAvailableTables(dateObj, startTime, endTime); // 加载可选球台
      this.showBookDialog = true;
    },

    // 获取可选球台（实际项目需对接后端）
    async fetchAvailableTables(dateObj, startTime, endTime) {
      // 模拟：忽略时段冲突，返回3个球台（实际需后端查询未占用球台）
      this.availableTables = [
        { id: 1 }, { id: 2 }, { id: 3 }
      ];
    },

    // 切换自动/手动分配球台
    handleAutoAssignChange(val) {
      if (val) this.bookForm.tableId = null;
    },

    // 提交预约
    async submitBooking() {
      const loading = Loading.service({ text: '提交预约中...' });
      try {
        // 格式化时间为后端需要的格式（yyyy-MM-ddTHH:mm）
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
        await this.fetchCoachSchedule(); // 刷新课表
        await this.fetchMyAppointments(); // 新增：刷新「我的预约」列表
      } catch (err) {
        Message.error(err.message || '预约失败');
      } finally {
        loading.close();
      }
    },

    // 申请取消预约
    async handleCancelRequest(appointmentId) {
      this.$confirm('确定要取消预约吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await requestCancel(appointmentId, this.userId, 'STUDENT');
          Message.success('取消申请已提交');
          this.cancelCount += 1;
          await this.fetchMyAppointments();
          await this.fetchCoachSchedule();
        } catch (err) {
          Message.error(err.message || '取消申请失败');
        }
      }).catch(() => {
        Message.info('已取消操作');
      });
    },

    // ---------------------- 工具方法 ----------------------
    // 格式化日期：yyyy-MM-dd
    formatDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },

    // 格式化时间：HH:mm（仅时间）
    formatTime(timeStr) {
      const date = new Date(timeStr);
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    },

    // 格式化完整时间：yyyy-MM-dd HH:mm（用于我的预约列表）
    formatFullTime(timeStr) {
      const date = new Date(timeStr);
      return `${this.formatDate(date)} ${this.formatTime(timeStr)}`;
    },

    // 获取星期文本（周一~周日）
    getWeekDay(date) {
      const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return weekDays[date.getDay()];
    },

    // 判断日期是否已过期（今天之前）
    isPastDate(dateObj) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // 今天0点
      return dateObj < today; // 目标日期 < 今天0点 → 已过期
    },

    // 检查时段是否有预约冲突
    hasAppointmentConflict(dateObj, startTime, endTime) {
      const targetDate = this.formatDate(dateObj);
      const targetStart = new Date(`${targetDate}T${startTime}`);
      const targetEnd = new Date(`${targetDate}T${endTime}`);

      // 遍历已预约课程，判断是否重叠
      return this.schedule.some(appt => {
        const apptStart = new Date(appt.startTime);
        const apptEnd = new Date(appt.endTime);
        // 冲突规则：目标时段与已预约时段有重叠（不包含首尾衔接）
        return apptStart < targetEnd && apptEnd > targetStart;
      });
    },

    // ---------------------- 样式相关方法 ----------------------
    // 获取已预约课程的样式（自己/他人）
    getAppointmentClass(appointment) {
      return appointment.studentId === this.userId 
        ? 'own-appointment' 
        : 'other-appointment';
    },

    // 获取可预约按钮的样式（可预约/已预约/自己预约）
    getSlotClass(dateObj, startTime, endTime) {
      if (!this.hasAppointmentConflict(dateObj, startTime, endTime)) {
        return 'available-slot'; // 可预约
      }

      // 已预约：判断是否是自己的预约
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

    // 获取预约状态文本（待确认/已确认等）
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

    // 获取预约状态标签类型（warning/success等）
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

    // 判断是否可取消预约（已确认+提前24小时+未超取消次数）
    canCancel(appointment) {
      if (appointment.status !== 'CONFIRMED') return false;
      // 提前24小时判断
      const startTime = new Date(appointment.startTime);
      const now = new Date();
      const hoursDiff = (startTime - now) / (1000 * 60 * 60);
      return hoursDiff >= 24 && this.cancelCount < this.maxCancelCount;
    }
  }
}
</script>

<style lang="scss" scoped>
/* 基础容器样式（与课表管理对齐） */
.course-booking-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

/* 页面头部（标题+说明） */
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

/* 搜索卡片（选择教练） */
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

/* 状态提示（已过期/无课表） */
.status-tip, .empty-tip {
  font-size: 12px;
  color: #999;
  padding: 8px 0;
}

/* 按钮样式（与课表管理对齐） */
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

/* 我的预约列表卡片 */
.appointments-card {
  margin-top: 30px;
}

/* 表格单元格垂直居中 */
.el-table__cell {
  vertical-align: middle !important;
}
</style>