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
        @cell-mouse-enter="handleCellHover"
      >
        <!-- 原有列不变... -->
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

        <!-- 新增：评论列 -->
        <el-table-column label="评论" align="center" min-width="220">
          <template slot-scope="scope">
            <!-- 非已完成状态：提示未完成 -->
            <div v-if="scope.row.status !== 'COMPLETED'" class="comment-status disabled">
              课程未完成
            </div>

            <!-- 已完成状态：显示评论相关内容 -->
            <div v-else class="comment-wrapper">
              <!-- 加载中 -->
              <div v-if="commentLoading[scope.row.id]" class="comment-loading">
                <el-icon size="14"><Loading /></el-icon>
                <span>加载中...</span>
              </div>

              <!-- 已加载评论 -->
              <div v-else>
                <!-- 无任何评论：显示“去评论”按钮 -->
                <div v-if="!comments[scope.row.id] || comments[scope.row.id].length === 0" class="comment-empty">
                  <el-button 
                    size="mini" 
                    type="text" 
                    class="comment-btn"
                    @click="handleCommentClick(scope.row, null)"
                  >
                    暂时未有评论，去评论
                  </el-button>
                </div>

                <!-- 有评论：分开展示自己和教练的评论 -->
                <div v-else class="comment-list">
                  <!-- 1. 自己的评论 -->
                  <div v-for="(com, idx) in comments[scope.row.id].filter(c => c.evaluatorId === userId)" :key="idx" class="comment-item own-comment">
                    <div class="comment-header">
                      <span class="commentor">我的评论</span>
                      <span class="comment-time">{{ formatFullTime(com.updateTime) }}</span>
                    </div>
                    <div class="comment-content">{{ com.content }}</div>
                    <div class="comment-actions">
                      <el-button 
                        size="mini" 
                        type="text" 
                        class="edit-btn"
                        @click="handleCommentClick(scope.row, com)"
                      >
                        编辑
                      </el-button>
                      <el-button 
                        size="mini" 
                        type="text" 
                        class="delete-btn"
                        @click="handleCommentDelete(scope.row.id, com.id)"
                      >
                        删除
                      </el-button>
                    </div>
                  </div>

                  <!-- 2. 教练的评论（仅查看） -->
                  <div v-for="(com, idx) in comments[scope.row.id].filter(c => c.evaluatorType === 'COACH')" :key="idx" class="comment-item coach-comment">
                    <div class="comment-header">
                      <span class="commentor">{{ scope.row.coachName }} 的评论</span>
                      <span class="comment-time">{{ formatFullTime(com.createTime) }}</span>
                    </div>
                    <div class="comment-content">{{ com.content }}</div>
                  </div>

                  <!-- 3. 只有教练评论时，显示“去评论”按钮 -->
                  <div v-if="comments[scope.row.id].every(c => c.evaluatorType === 'COACH')" class="add-comment-btn">
                    <el-button 
                      size="mini" 
                      type="text" 
                      class="comment-btn"
                      @click="handleCommentClick(scope.row, null)"
                    >
                      + 发表我的评论
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
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

    <!-- 新增：评论弹窗（支持新增/编辑） -->
    <el-dialog
      :visible.sync="showCommentDialog"
      :title="currentComment ? '编辑评论' : '发表评论'"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="commentForm" ref="commentForm" label-width="80px">
        <el-form-item 
          label="评论内容" 
          :rules="[{ required: true, message: '请输入评论内容', trigger: 'blur' }, { max: 500, message: '评论不超过500字', trigger: 'blur' }]"
          prop="content"
        >
          <el-input
            v-model="commentForm.content"
            type="textarea"
            rows="5"
            placeholder="请输入对本次课程的评论..."
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
          {{ currentComment ? '更新评论' : '提交评论' }}
        </el-button>
      </div>
    </el-dialog>

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
// 新增：导入评论相关API
import { 
  getEvaluationsByAppointment, 
  createEvaluation, 
  updateEvaluation, 
  deleteEvaluation 
} from '@/api/evaluation'
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

// 新增：引入加载图标
// const { Loading: LoadingIcon } = Icon

export default {
  name: 'CourseBooking',
  
  computed: {
    ...mapGetters(['userId', 'role', 'schoolId']),
    groupedSchedule() {
      // 原有逻辑不变...
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
      // 原有数据不变...
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
      coachCancelRequests: [],
      remainingCancelCount: 3,
      maxCancelCount: 3,

      // 新增：评论相关状态
      comments: {}, // 存储评论：key=appointmentId，value=评论数组
      commentLoading: {}, // 评论加载状态：key=appointmentId
      showCommentDialog: false, // 评论弹窗显示状态
      currentComment: null, // 当前编辑的评论（null为新增）
      currentAppointmentId: null, // 当前操作的预约ID
      commentForm: { // 评论表单
        content: ''
      },
      submitCommentLoading: false, // 评论提交加载状态
      hoveredRowId: null // 表格行hover状态（优化样式）
    }
  },
  created() {
    this.fetchRelatedCoaches();
    this.checkAndFetchSchoolSchedule();
    this.fetchCoachCancelRequests();
    this.fetchRemainingCancelCount();
  },
  methods: {
    // 原有方法不变...

    // 新增：表格行hover事件（优化评论区样式）
    handleCellHover(row) {
      this.hoveredRowId = row.id;
    },

    // 新增：获取指定预约的评论
    async fetchAppointmentComments(appointmentId) {
      // 标记加载中
      this.$set(this.commentLoading, appointmentId, true);
      try {
        const res = await getEvaluationsByAppointment(appointmentId);
        // 存储评论（按预约ID分组）
        this.$set(this.comments, appointmentId, res.data || []);
      } catch (err) {
        Message.error(err.message || '加载评论失败');
        this.$set(this.comments, appointmentId, []);
      } finally {
        // 取消加载状态
        this.$set(this.commentLoading, appointmentId, false);
      }
    },

    // 新增：评论点击事件（打开弹窗，区分新增/编辑）
    handleCommentClick(appointment, comment) {
      this.currentAppointmentId = appointment.id;
      this.currentComment = comment;

      // 初始化表单：编辑时填原有内容，新增时清空
      this.commentForm = {
        content: comment ? comment.content : ''
      };

      // 打开弹窗
      this.showCommentDialog = true;
    },

    // 4. 修复评论提交时的API调用（确保用appt.id作为appointmentId）
    async submitComment() {
    const commentFormRef = this.$refs.commentForm;
    if (!commentFormRef) return;
    
    commentFormRef.validate(async (isValid) => {
      if (!isValid) return;
      this.submitCommentLoading = true;
      try {
        if (this.currentComment) {
          // 编辑评论：传递evaluationId、content、evaluatorId
          await updateEvaluation({
            evaluationId: this.currentComment.id,
            content: this.commentForm.content, // 后端接口参数是content
            evaluatorId: this.userId // 对应后端Controller是evaluator参数
          });
          Message.success('评论更新成功');
        } else {
          // 新增评论：用currentAppointmentId（即appt.id）作为appointmentId
          await createEvaluation({ // 后端API是createEvaluation
            appointmentId: this.currentAppointmentId,
            evaluatorId: this.userId,
            evaluatorType: 'STUDENT',
            content: this.commentForm.content
          });
          Message.success('评论提交成功');
        }
        this.showCommentDialog = false;
        this.fetchAppointmentComments(this.currentAppointmentId);
      } catch (err) {
        Message.error(err.message || (this.currentComment ? '更新评论失败' : '提交评论失败'));
      } finally {
        this.submitCommentLoading = false;
      }
    });
    },

    // 5. 修复删除评论的API参数（传递userId）
    async handleCommentDelete(appointmentId, commentId) {
      this.$confirm('确定要删除这条评论吗？删除后不可恢复', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteEvaluation({
            evaluationId: commentId,
            evaluatorId: this.userId // 后端需要userId做权限校验
          });
          Message.success('评论删除成功');
          this.fetchAppointmentComments(appointmentId);
        } catch (err) {
          Message.error(err.message || '删除评论失败');
        }
      }).catch(() => {
        Message.info('已取消删除');
      });
    },


    async fetchMyAppointments() {
      console.log("11111111111111111111111111111")
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

        console.log("为什么失败")
        // 预加载已完成预约的评论（关键逻辑）
        this.myAppointments.forEach(appt => {
          if (appt.status === 'COMPLETED') {
            console.log(appt.id)
            this.fetchAppointmentComments(appt.id); // 用appt.id（后端返回的id）作为预约ID
          }
        });
      } catch (err) {
        Message.error(err.message || '获取我的预约失败');
      }
    },

    // 以下原有方法不变...
    async fetchRemainingCancelCount() {
      try {
        const res = await getRemainingCancelCount(this.userId, 'STUDENT');
        this.remainingCancelCount = res.data;
      } catch (err) {
        Message.error(err.message || '获取剩余取消次数失败');
      }
    },
    async fetchRelatedCoaches() {
      try {
        const res = await getRelatedCoaches(this.userId);
        this.relatedCoaches = res.data || [];
        if (this.relatedCoaches.length > 0) {
          this.selectedCoachId = this.relatedCoaches[0].id;
          this.handleCoachChange(this.selectedCoachId);
        }
        this.fetchMyAppointments(); // 原有逻辑：获取预约后会自动加载评论
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
   
    async fetchCoachCancelRequests() {
      try {
        const res = await getPendingCancelRecords(this.userId, 'COACH');
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
          await this.fetchRemainingCancelCount();
        } catch (err) {
          Message.error(err.message || '取消申请失败');
        }
      }).catch(() => {
        Message.info('已取消操作');
      });
    },
    async handleCancelApprove(cancelRecordId, approve) {
      const loading = Loading.service({ text: '处理中...' });
      try {
        await handleCancelRequest(cancelRecordId, approve);
        Message.success(approve ? '已同意取消' : '已拒绝取消');
        this.fetchCoachCancelRequests();
        this.fetchMyAppointments();
        this.fetchCoachSchedule();
      } catch (err) {
        Message.error(err.message || '处理失败');
      } finally {
        loading.close();
      }
    },
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
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(dateObj);
      targetDate.setHours(0, 0, 0, 0);
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
        'CANCELLED': '已取消',
        'COMPLETED': '已完成'
      };
      return map[status] || status;
    },
    getStatusTagType(status) {
      const map = {
        'PENDING_CONFIRM': 'warning',
        'CONFIRMED': 'success',
        'REJECTED': 'danger',
        'CANCEL_REQUESTED': 'info',
        'CANCELLED': 'default',
        'COMPLETED': 'success'
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
/* 原有样式不变，新增以下评论相关样式 */

// 评论列基础样式
.comment-wrapper {
  width: 100%;
  padding: 4px 0;
}

// 评论加载状态
.comment-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
  gap: 4px;
  padding: 8px 0;
}

// 无评论状态
.comment-empty {
  text-align: center;
  padding: 8px 0;
}

// 评论按钮通用样式
.comment-btn {
  color: #409eff !important;
  font-size: 12px !important;
  padding: 4px 8px !important;
  &:hover {
    color: #2563eb !important;
    background-color: #e6f7ff !important;
  }
}

// 评论列表容器
.comment-list {
  width: 100%;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
  margin-bottom: 8px;
  // 自定义滚动条
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 2px;
  }
}

// 单个评论项
.comment-item {
  width: 100%;
  padding: 8px;
  margin-bottom: 6px;
  border-radius: 4px;
  font-size: 12px;
  background-color: #f9fafb;
}

// 自己的评论样式（蓝色调）
.own-comment {
  border-left: 3px solid #409eff;
  background-color: #f0f7ff;
}

// 教练的评论样式（绿色调）
.coach-comment {
  border-left: 3px solid #22c55e;
  background-color: #f0fdf4;
}

// 评论头部（评论人+时间）
.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  color: #666;
  .commentor {
    font-weight: 500;
    &.own {
      color: #409eff;
    }
    &.coach {
      color: #22c55e;
    }
  }
  .comment-time {
    color: #999;
    font-size: 11px;
  }
}

// 评论内容
.comment-content {
  color: #333;
  line-height: 1.4;
  margin-bottom: 6px;
  word-break: break-all;
}

// 评论操作区（编辑/删除）
.comment-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  .edit-btn {
    color: #409eff !important;
    font-size: 11px !important;
    &:hover {
      color: #2563eb !important;
    }
  }
  .delete-btn {
    color: #f5222d !important;
    font-size: 11px !important;
    &:hover {
      color: #dc2626 !important;
    }
  }
}

// 新增评论按钮（仅教练有评论时显示）
.add-comment-btn {
  text-align: center;
  margin-top: 6px;
}

// 非已完成状态的评论列样式
.comment-status.disabled {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 8px 0;
}

// 评论弹窗样式
.word-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

// 表格行hover时评论区背景优化
.el-table__row:hover .comment-item {
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

/* 原有样式不变... */
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
.course-booking-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
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
.search-card {
  margin-bottom: 20px;
  padding: 15px;
}
.schedule-card {
  margin-bottom: 30px;
}
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
.available-slots {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding: 4px 0;
}
.status-tip, .empty-tip {
  font-size: 12px;
  color: #999;
  padding: 8px 0;
}
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
.cancel-requests-card {
  margin-bottom: 30px;
}
.appointments-card {
  margin-top: 30px;
}
.empty {
  margin: 40px 0;
  text-align: center;
}
.el-table__cell {
  vertical-align: middle !important;
}
</style>