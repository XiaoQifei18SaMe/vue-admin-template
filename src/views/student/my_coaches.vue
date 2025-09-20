<template>
  <div class="my-coaches-container">
    <div class="page-header">
      <h2>我的教练</h2>
      <p>已建立关联的教练列表</p>
    </div>

    <!-- 教练列表 -->
    <el-table
      v-if="!loading && coaches.length > 0"
      :data="coaches"
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
      <el-table-column prop="level" label="等级" align="center">
        <template #default="scope">
          <el-tag :type="getLevelTagType(scope.row.level)">
            {{ getLevelText(scope.row.level) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120">
        <template #default="scope">
          <el-button size="mini" type="primary" @click="handleViewDetail(scope.row.id)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <div v-else-if="!loading && coaches.length === 0" class="empty">
      <el-empty description="暂无关联的教练"></el-empty>
      <p class="empty-text">您目前没有关联的教练，可以前往教练查询页面申请</p>
      <el-button 
        type="primary" 
        style="margin-top: 15px;"
        @click="$router.push('/student/coach_select')"
      >
        去申请教练
      </el-button>
    </div>

    <!-- 加载状态 -->
    <el-loading v-if="loading" target=".my-coaches-container" text="加载中..."></el-loading>

    <!-- 教练详情弹窗 -->
    <el-dialog
      :visible.sync="showDetail"
      title="教练详情"
      width="700px"
      :close-on-click-modal="false"
    >
      <div v-loading="detailLoading" class="detail-container">
        <div v-if="currentCoach" class="detail-info">
          <el-row :gutter="20">
            <el-col :span="6">
              <img 
                :src="currentCoach ? `http://localhost:8080/coach-photos/${currentCoach.photoPath}` : '/default-coach.png'" 
                alt="教练照片" 
                class="coach-photo"
                @error="handleImgError"
              >
            </el-col>
            <el-col :span="18">
              <div class="detail-items">
                <div class="detail-item">
                  <span class="item-label">姓名</span>
                  <span class="item-value">{{ currentCoach.name }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">性别</span>
                  <span class="item-value">{{ currentCoach.male ? '男' : '女' }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">年龄</span>
                  <span class="item-value">{{ currentCoach.age }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">联系电话</span>
                  <span class="item-value">{{ currentCoach.phone }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">邮箱</span>
                  <span class="item-value">{{ currentCoach.email }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">所属校区</span>
                  <span class="item-value">{{ currentCoach.schoolId }}</span>
                </div>
                <div class="detail-item">
                  <span class="item-label">教练等级</span>
                  <span class="item-value">{{ getLevelText(currentCoach.level) }}</span>
                </div>
                <div class="detail-item description-item">
                  <span class="item-label">个人简介</span>
                  <div class="description-content">{{ currentCoach.description || '无' }}</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
        <div v-else class="error">未获取到教练详情</div>
      </div>

      <div slot="footer">
        <el-button @click="showDetail = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getRelatedCoaches, getCoachDetail } from '@/api/student';
import { Message } from 'element-ui';
import { mapGetters } from 'vuex';

export default {
  name: 'MyCoaches',
  computed: {
    ...mapGetters(['userId'])
  },
  data() {
    return {
      coaches: [],
      loading: false,
      showDetail: false,
      currentCoach: null,
      currentCoachId: null,
      detailLoading: false
    };
  },
  created() {
    if (this.userId) {
      this.fetchRelatedCoaches();
    } else {
      Message.error('未获取到用户信息，请重新登录');
    }
  },
  methods: {
    // 获取关联的教练列表
    async fetchRelatedCoaches() {
      this.loading = true;
      try {
        const res = await getRelatedCoaches(this.userId);
        this.coaches = res.data || [];
      } catch (err) {
        Message.error(err.message || '获取我的教练列表失败');
        console.error('获取我的教练列表错误:', err);
      } finally {
        this.loading = false;
      }
    },

    // 查看教练详情
    async handleViewDetail(coachId) {
      this.currentCoachId = coachId;
      this.detailLoading = true;
      this.currentCoach = null;
      this.showDetail = true;

      try {
        const res = await getCoachDetail(coachId);
        this.currentCoach = res.data;
      } catch (err) {
        Message.error(err.message || '获取教练详情失败');
      } finally {
        this.detailLoading = false;
      }
    },

    // 获取教练等级文本
    getLevelText(level) {
      switch(level) {
        case 10: return '初级教练员';
        case 100: return '中级教练员';
        case 1000: return '高级教练员';
        default: return '未评级';
      }
    },

    // 获取等级标签样式
    getLevelTagType(level) {
      switch(level) {
        case 10: return 'info';
        case 100: return 'success';
        case 1000: return 'warning';
        default: return 'default';
      }
    },

    // 处理图片加载失败
    handleImgError(e) {
      e.target.src = '/default-coach.png';
    }
  }
};
</script>

<style lang="scss" scoped>
.my-coaches-container {
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

.coach-photo {
  width: 100%;
  height: 240px;
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
  align-items: flex-start;

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

.description-item {
  align-items: flex-start;

  .description-content {
    flex: 1;
    color: #333;
    line-height: 1.6;
    white-space: pre-wrap;
  }
}
</style>