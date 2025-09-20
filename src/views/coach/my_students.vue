<template>
  <div class="my-students-container">
    <div class="page-header">
      <h2>我的学生</h2>
      <p>已建立关联的学员列表</p>
    </div>

    <!-- 学生列表 -->
    <el-table
      v-if="!loading && students.length > 0"
      :data="students"
      border
      stripe
      style="width: 100%; margin-top: 20px;"
    >
      <el-table-column prop="id" label="ID" width="80" align="center"></el-table-column>
      <el-table-column prop="name" label="姓名" align="center"></el-table-column>
      <el-table-column label="性别" align="center">
        <template #default="scope">{{ scope.row.male ? '男' : '女' }}</template>
      </el-table-column>
      <el-table-column prop="age" label="年龄" align="center"></el-table-column>
      <el-table-column prop="phone" label="联系电话" align="center"></el-table-column>
      <el-table-column label="操作" align="center" width="120">
        <template #default="scope">
          <el-button size="mini" type="primary" @click="handleViewDetail(scope.row.id)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <div v-else-if="!loading && students.length === 0" class="empty">
      <el-empty description="暂无关联的学员"></el-empty>
      <p class="empty-text">您目前没有关联的学员，等待学员申请或查看申请列表</p>
      <el-button 
        type="primary" 
        style="margin-top: 15px;"
        @click="$router.push('/coach/student_audit')"
      >
        查看学员申请
      </el-button>
    </div>

    <!-- 加载状态 -->
    <el-loading v-if="loading" target=".my-students-container" text="加载中..."></el-loading>

    <!-- 学员详情弹窗 -->
    <el-dialog
      :visible.sync="showDetail"
      title="学员详情"
      width="600px"
      :close-on-click-modal="false"
    >
      <div v-loading="detailLoading" class="detail-container">
        <div v-if="currentStudent" class="detail-info">
          <el-row :gutter="20">
            <el-col :span="6">
              <img 
                :src="currentStudent.avatar ? `http://localhost:8080/student-avatars/${currentStudent.avatar}` : '/default-avatar.gif'" 
                alt="学员头像" 
                class="student-avatar"
                @error="handleImgError"
              >
            </el-col>
            <el-col :span="18">
              <div class="detail-items">
                <div class="detail-item">
                  <span class="item-label">用户名</span>
                  <span class="item-value">{{ currentStudent.username }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">姓名</span>
                  <span class="item-value">{{ currentStudent.name }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">性别</span>
                  <span class="item-value">{{ currentStudent.male ? '男' : '女' }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">年龄</span>
                  <span class="item-value">{{ currentStudent.age }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">联系电话</span>
                  <span class="item-value">{{ currentStudent.phone }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">邮箱</span>
                  <span class="item-value">{{ currentStudent.email }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">所属校区</span>
                  <span class="item-value">{{ currentStudent.schoolId }}</span>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
        <div v-else class="error">未获取到学员详情</div>
      </div>

      <div slot="footer">
        <el-button @click="showDetail = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getRelatedStudents } from '@/api/coach';
import { getStudentDetail } from '@/api/coach';
import { Message } from 'element-ui';
import { mapGetters } from 'vuex';

export default {
  name: 'MyStudents',
  computed: {
    ...mapGetters(['userId', 'role'])
  },
  data() {
    return {
      students: [],
      loading: false,
      showDetail: false,
      currentStudent: null,
      currentStudentId: null,
      detailLoading: false
    };
  },
  created() {
    if (this.userId && this.role === 'coach') {
      this.fetchRelatedStudents();
    } else {
      Message.error('未获取到登录状态或权限不足，请重新登录');
    }
  },
  methods: {
    // 获取关联的学员列表
    async fetchRelatedStudents() {
      this.loading = true;
      try {
        const res = await getRelatedStudents(this.userId);
        this.students = res.data || [];
      } catch (err) {
        Message.error(err.message || '获取我的学员列表失败');
        console.error('获取我的学员列表错误:', err);
      } finally {
        this.loading = false;
      }
    },

    // 查看学员详情
    async handleViewDetail(studentId) {
      this.currentStudentId = studentId;
      this.detailLoading = true;
      this.currentStudent = null;
      this.showDetail = true;

      try {
        const res = await getStudentDetail(studentId);
        this.currentStudent = res.data;
      } catch (err) {
        Message.error(err.message || '获取学员详情失败');
      } finally {
        this.detailLoading = false;
      }
    },

    // 处理图片加载失败
    handleImgError(e) {
      e.target.src = '/default-avatar.gif';
    }
  }
};
</script>

<style lang="scss" scoped>
.my-students-container {
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
  }
}

.empty {
  margin-top: 40px;
  text-align: center;

  .empty-text {
    margin-top: 15px;
    color: #666;
    font-size: 14px;
  }
}

.detail-container {
  padding: 10px 0;
}

.detail-info {
  margin-top: 10px;
}

.student-avatar {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.detail-items {
  padding-left: 10px;
}

.detail-item {
  margin-bottom: 15px;
  display: flex;
  align-items: center;

  .item-label {
    width: 100px;
    color: #666;
    font-weight: 500;
  }

  .item-value {
    flex: 1;
    color: #333;
  }
}
</style>