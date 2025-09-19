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
        <div class="cancel-count-info">
          本月剩余取消次数：<span :class="remainingCancelCount <= 0 ? 'count-exhausted' : 'count-available'">
            {{ remainingCancelCount }}/{{ maxCancelCount }}
          </span>
        </div>
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
              <div class="appt-operation-group">
                <div v-for="appt in scope.row.appointments" :key="appt.id" class="appt-operation-item">
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

    <el-card class="coach-my-appointments-card">
      <div slot="header">
        <h3>我的预约</h3>
      </div>

      <!-- 预约表格（与学生端列结构一致，适配教练视角） -->
      <el-table
        :data="myAppointments"
        border
        stripe
        style="width: 100%;"
        @cell-mouse-enter="handleCellHover"
        v-loading="loadingMyAppointments"
      >
        <!-- 基础列：预约ID、学员、时间、球台、状态 -->
        <el-table-column prop="id" label="预约ID" width="80" align="center"></el-table-column>
        <el-table-column prop="studentName" label="学员" align="center"></el-table-column>
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

        <!-- 核心：评论列（与学生端逻辑一致，适配教练视角） -->
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

                <!-- 有评论：分开展示自己（教练）和学员的评论 -->
                <div v-else class="comment-list">
                  <!-- 1. 教练自己的评论（可编辑/删除） -->
                  <div v-for="(com, idx) in comments[scope.row.id].filter(c => c.evaluatorType === 'COACH')" :key="idx" class="comment-item own-comment">
                    <div class="comment-header">
                      <span class="commentor">我的评论</span>
                      <span class="comment-time">{{ formatFullTime(com.updateTime || com.createTime) }}</span>
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

                  <!-- 2. 学员的评论（仅查看） -->
                  <div v-for="(com, idx) in comments[scope.row.id].filter(c => c.evaluatorType === 'STUDENT')" :key="idx" class="comment-item coach-comment">
                    <div class="comment-header">
                      <span class="commentor">{{ scope.row.studentName }} 的评论</span>
                      <span class="comment-time">{{ formatFullTime(com.createTime) }}</span>
                    </div>
                    <div class="comment-content">{{ com.content }}</div>
                  </div>

                  <!-- 3. 只有学员评论时，显示“去评论”按钮 -->
                  <div v-if="comments[scope.row.id].every(c => c.evaluatorType === 'STUDENT')" class="add-comment-btn">
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

        
      </el-table>

      <!-- 空状态提示 -->
      <div v-if="myAppointments.length === 0 && !loadingMyAppointments" class="empty">
        <el-empty description="暂无预约记录"></el-empty>
      </div>
    </el-card>

     <!-- 新增：评论弹窗（与学生端完全一致） -->
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
  </div>
</template>

<script>

// 导入依赖（新增评论相关API，与学生端一致）
import { 
  getEvaluationsByAppointment, 
  createEvaluation, 
  updateEvaluation, 
  deleteEvaluation 
} from '@/api/evaluation'

import { 
  getCoachAppointments, 
  getCoachSchedule,
  handleCoachConfirmation,
  requestCancel,
  handleCancelRequest,
  getPendingCancelRecords,
  getRemainingCancelCount
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
      remainingCancelCount: 0,  // 变更：存储剩余取消次数
      maxCancelCount: 3,  // 最大取消次数

      // 新增：教练“我的预约”相关状态
      myAppointments: [], // 教练的预约列表
      loadingMyAppointments: false, // 预约列表加载状态

      // 新增：评论相关状态（与学生端完全一致）
      comments: {}, // 存储评论：key=appointmentId，value=评论数组
      commentLoading: {}, // 评论加载状态：key=appointmentId
      showCommentDialog: false, // 评论弹窗显示状态
      currentComment: null, // 当前编辑的评论（null为新增）
      currentAppointmentId: null, // 当前操作的预约ID
      commentForm: { content: '' }, // 评论表单
      submitCommentLoading: false, // 评论提交加载状态
      hoveredRowId: null // 表格行hover状态（优化样式）
    }
  },
  created() {
    // 加载顺序：先加载关联学员（用于匹配姓名），再加载预约和取消申请
    this.fetchRelatedStudents()
      .then(() => {
        this.fetchAllAppointments();
        this.fetchCancelRequests();
        this.fetchRemainingCancelCount();  // 新增：获取剩余取消次数
        this.fetchMyAppointments(); // 新增：初始化加载“我的预约”
      });
  },
  methods: {

    // ---------------------- 新增：教练“我的预约”相关方法 ----------------------
    /**
     * 加载教练的“我的预约”列表（包含已完成/待确认等状态）
     */
    async fetchMyAppointments() {
      this.loadingMyAppointments = true;
      try {
        // 调用教练端获取预约列表接口（若复用getCoachSchedule需过滤状态，建议单独接口）
        const res = await getCoachAppointments(this.userId);
        const appointments = res.data || [];
        
        // 关联学员姓名（从relatedStudents匹配）
        this.myAppointments = appointments.map(appt => {
          const student = this.relatedStudents.find(s => s.id === appt.studentId);
          return {
            ...appt,
            studentName: student ? student.name : `未知学员(${appt.studentId})`
          };
        });

        // 预加载已完成预约的评论（核心逻辑，与学生端一致）
        this.myAppointments.forEach(appt => {
          if (appt.status === 'COMPLETED') {
            this.fetchAppointmentComments(appt.id);
          }
        });
      } catch (err) {
        Message.error(err.message || '获取我的预约失败');
      } finally {
        this.loadingMyAppointments = false;
      }
    },

    // ---------------------- 新增：评论相关方法（与学生端逻辑一致，适配教练视角） ----------------------
    /**
     * 加载指定预约的评论
     */
    async fetchAppointmentComments(appointmentId) {
      this.$set(this.commentLoading, appointmentId, true);
      try {
        const res = await getEvaluationsByAppointment(appointmentId);
        this.$set(this.comments, appointmentId, res.data || []);
      } catch (err) {
        Message.error(err.message || '加载评论失败');
        this.$set(this.comments, appointmentId, []);
      } finally {
        this.$set(this.commentLoading, appointmentId, false);
      }
    },

    /**
     * 打开评论弹窗（区分新增/编辑）
     */
    handleCommentClick(appointment, comment) {
      this.currentAppointmentId = appointment.id;
      this.currentComment = comment;
      // 初始化表单：编辑填原有内容，新增清空
      this.commentForm = { content: comment ? comment.content : '' };
      this.showCommentDialog = true;
    },

    /**
     * 提交评论（新增/编辑）
     */
    async submitComment() {
      const commentFormRef = this.$refs.commentForm;
      if (!commentFormRef) return;

      commentFormRef.validate(async (isValid) => {
        if (!isValid) return;
        this.submitCommentLoading = true;
        try {
          if (this.currentComment) {
            // 编辑评论：传递evaluationId、content、evaluatorId（教练ID）
            await updateEvaluation({
              evaluationId: this.currentComment.id,
              content: this.commentForm.content,
              evaluatorId: this.userId // 教练ID
            });
            Message.success('评论更新成功');
          } else {
            // 新增评论：指定evaluatorType为COACH（教练视角）
            await createEvaluation({
              appointmentId: this.currentAppointmentId,
              evaluatorId: this.userId,
              evaluatorType: 'COACH', // 学生端为STUDENT，教练端为COACH
              content: this.commentForm.content
            });
            Message.success('评论提交成功');
          }
          this.showCommentDialog = false;
          // 刷新当前预约的评论
          this.fetchAppointmentComments(this.currentAppointmentId);
        } catch (err) {
          Message.error(err.message || (this.currentComment ? '更新评论失败' : '提交评论失败'));
        } finally {
          this.submitCommentLoading = false;
        }
      });
    },

    /**
     * 删除评论
     */
    async handleCommentDelete(appointmentId, commentId) {
      this.$confirm('确定要删除这条评论吗？删除后不可恢复', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await deleteEvaluation({
            evaluationId: commentId,
            evaluatorId: this.userId // 教练ID（后端校验权限）
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

    // ---------------------- 新增：辅助方法（与学生端一致） ----------------------
    /**
     * 表格行hover事件（优化评论区样式）
     */
    handleCellHover(row) {
      this.hoveredRowId = row.id;
    },

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
        //const res = await getCoachAppointments(this.userId); // 旧接口：会返回CANCELLED状态
        const res = await getCoachSchedule(this.userId); // 新接口：已过滤CANCELLED状态
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

     // 新增：获取本月剩余取消次数
    async fetchRemainingCancelCount() {
      try {
        const res = await getRemainingCancelCount(this.userId, 'COACH');
        this.remainingCancelCount = res.data || 0;
      } catch (err) {
        Message.error(err.message || '获取剩余取消次数失败');
        this.remainingCancelCount = 0;  // 失败时默认0次
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
          this.fetchAllAppointments();
          this.fetchCancelRequests();
          this.fetchRemainingCancelCount();  // 新增：刷新剩余次数
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
        //this.fetchRemainingCancelCount();  // 新增：刷新剩余次数//感觉不用
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
        'CANCELLED': '已取消',
        'COMPLETED': '已完成',
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
        'CANCELLED': 'default',
        'COMPLETED': 'success',
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
      return hoursDiff >= 24 && this.remainingCancelCount > 0;
    }
  }
}
</script>

<style lang="scss" scoped>

/* 新增：剩余取消次数样式 */
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

/* 操作列按钮布局优化 */
.appt-operation-group {
  // 让按钮组高度自适应内容
  min-height: 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 16px; // 关键：设置按钮之间的垂直间距
}

.appt-operation-item {
  // 确保每个按钮容器占满列宽，按钮居中显示
  width: 100%;
  text-align: center;
}

.coach-my-appointments-card {
  margin-bottom: 30px;
}

/* 新增：评论相关样式（与学生端完全一致） */
.comment-wrapper {
  width: 100%;
  padding: 4px 0;
}
.comment-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
  gap: 4px;
  padding: 8px 0;
}
.comment-empty {
  text-align: center;
  padding: 8px 0;
}
.comment-btn {
  color: #409eff !important;
  font-size: 12px !important;
  padding: 4px 8px !important;
  &:hover {
    color: #2563eb !important;
    background-color: #e6f7ff !important;
  }
}
.comment-list {
  width: 100%;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 4px;
  margin-bottom: 8px;
  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background-color: #ddd;
    border-radius: 2px;
  }
}
.comment-item {
  width: 100%;
  padding: 8px;
  margin-bottom: 6px;
  border-radius: 4px;
  font-size: 12px;
  background-color: #f9fafb;
}
.own-comment {
  border-left: 3px solid #409eff;
  background-color: #f0f7ff;
}
.coach-comment {
  border-left: 3px solid #22c55e;
  background-color: #f0fdf4;
}
.comment-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  color: #666;
  .commentor {
    font-weight: 500;
  }
  .comment-time {
    color: #999;
    font-size: 11px;
  }
}
.comment-content {
  color: #333;
  line-height: 1.4;
  margin-bottom: 6px;
  word-break: break-all;
}
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
.add-comment-btn {
  text-align: center;
  margin-top: 6px;
}
.comment-status.disabled {
  text-align: center;
  color: #999;
  font-size: 12px;
  padding: 8px 0;
}
.word-count {
  text-align: right;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}
.el-table__row:hover .comment-item {
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
</style>