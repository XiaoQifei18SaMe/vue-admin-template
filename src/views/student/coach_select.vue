<template>
  <div class="coach-query-container">
    <div class="page-header">
      <h2>教练查询</h2>
      <p>您可以查询本校区教练并申请成为其学员</p>
    </div>

    <!-- 查询条件表单 -->
    <el-card class="search-card">
      <el-form :model="searchForm" ref="searchForm" label-width="80px" inline>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="searchForm.name" placeholder="请输入教练姓名" clearable></el-input>
        </el-form-item>
        
        <el-form-item label="性别" prop="isMale">
          <el-select v-model="searchForm.isMale" placeholder="请选择性别" clearable>
            <el-option label="男" value="true"></el-option>
            <el-option label="女" value="false"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="年龄范围">
          <el-row :gutter="5">
            <el-col :span="11">
              <el-input v-model.number="searchForm.age_low" type="number" placeholder="最小年龄"></el-input>
            </el-col>
            <el-col :span="2" style="text-align: center;">-</el-col>
            <el-col :span="11">
              <el-input v-model.number="searchForm.age_high" type="number" placeholder="最大年龄"></el-input>
            </el-col>
          </el-row>
        </el-form-item>
        
        <el-form-item label="等级" prop="level">
          <el-select v-model="searchForm.level" placeholder="请选择等级" clearable>
            <el-option label="初级教练员" value="10"></el-option>
            <el-option label="中级教练员" value="100"></el-option>
            <el-option label="高级教练员" value="1000"></el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
          <el-button type="success" @click="browseAll">浏览全部</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 教练列表 -->
    <el-table
      v-if="!loading && coachList.length > 0"
      :data="coachList"
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
      <el-table-column label="操作" align="center" width="200">
        <template #default="scope">
          <el-button size="mini" type="primary" @click="handleViewDetail(scope.row.id)">查看详情</el-button>
          <el-button size="mini" type="success" @click="handleSelectCoach(scope.row.id)">选择教练</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空状态 -->
    <div v-else-if="!loading && coachList.length === 0" class="empty">
        <el-empty description="未找到符合条件的教练"></el-empty>
        <p class="empty-text">没有找到与查询条件相匹配的教练员，请尝试调整查询条件后重新查询。</p>
    </div>

    <!-- 加载状态 -->
    <el-loading v-if="loading" target=".coach-query-container" text="加载中..."></el-loading>

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
        <el-button type="success" @click="handleSelectCoach(currentCoach.id)">选择该教练</el-button>
      </div>
    </el-dialog>
    </div>
</template>

<script>
import { getCoachList, getCoachDetail, selectCoach } from '@/api/student';
import { Message } from 'element-ui';
import { getToken, getUserInfo } from '@/utils/auth';
import { mapGetters } from 'vuex';

export default {
  name: 'CoachQuery',
  computed: {
    ...mapGetters(['userId','schoolId'])
  },
  data() {
    return {
      searchForm: {
        name: '',
        isMale: null,
        age_low: null,
        age_high: null,
        level: null
      },
      coachList: [],
      loading: false,
      showDetail: false,
      currentCoach: null,
      currentCoachId: null,
      detailLoading: false,
      studentId: null, // 当前登录学员ID
      //schoolId: null   // 当前学员所属校区ID
    };
  },
  created() {
    // 从登录信息获取学员ID和所属校区ID
    this.studentId = this.userId
    console.log("userId" + this.userId)
    if (this.userId && this.schoolId) {
      this.browseAll(); // 默认显示所有教练
    } else {
      Message.error('获取用户信息失败，请重新登录');
    }
  },
  methods: {
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
    },
    // 搜索教练
    async handleSearch() {
      // 验证至少填写一项查询条件
      const hasCondition = Object.values(this.searchForm).some(v => 
        v !== null && v !== '' && v !== undefined
      );
      
      if (!hasCondition) {
        Message.warning('请至少填写一项查询条件');
        return;
      }
      
      await this.fetchCoachList();
    },
    // 浏览全部教练
    async browseAll() {
      this.resetSearch();
      await this.fetchCoachList();
    },
    // 重置查询条件
    resetSearch() {
      this.searchForm = {
        name: '',
        isMale: null,
        age_low: null,
        age_high: null,
        level: null
      };
      this.$refs.searchForm?.resetFields();
      this.fetchCoachList();
    },
    // 获取教练列表
    async fetchCoachList() {
      this.loading = true;
      try {
        const params = {
          ...this.searchForm,
          schoolId: this.schoolId // 必传当前学员所属校区
        };
        // 转换布尔值类型（后端需要布尔类型）
        if (params.isMale === 'true') params.isMale = true;
        if (params.isMale === 'false') params.isMale = false;
        
        const res = await getCoachList(params);
        this.coachList = res.data || [];
      } catch (err) {
        Message.error(err.message || '获取教练列表失败');
        console.error('获取教练列表错误:', err);
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
        console.log("currentCoach.name " + this.currentCoach.name)
      } catch (err) {
        Message.error(err.message || '获取教练详情失败');
      } finally {
        this.detailLoading = false;
      }
    },
    // 选择教练（提交申请）
    async handleSelectCoach(coachId) {
      if (!this.studentId) {
        Message.error('未获取到学员信息');
        return;
      }
      
      this.$confirm(`确定要申请教练【${this.currentCoach?.name || ''}】吗？`, '申请确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(async () => {
        try {
          await selectCoach({
            coachId,
            studentId: this.studentId
          });
          Message.success('申请已提交，请等待教练审核');
          this.showDetail = false;
        } catch (err) {
          Message.error(err.message || '申请提交失败');
          console.error('申请教练错误:', err);
        }
      }).catch(() => {
        Message.info('已取消申请');
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.coach-query-container {
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

.search-card {
  margin-bottom: 20px;
  padding: 15px;
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
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  background-color: rgba(240, 247, 255, 0.8);
  border-radius: 12px;
  padding: 12px 16px;
  display: flex;
  align-items: flex-start;
}

.item-label {
  flex-shrink: 0;
  width: 90px;
  font-weight: 600;
  color: #1890ff;
  margin-right: 12px;
  padding-right: 12px;
  border-right: 1px solid rgba(24, 144, 255, 0.2);
}

.item-value {
  color: #333;
  line-height: 1.5;
}

.description-item {
  align-items: flex-start;
  padding-bottom: 16px;
}

.description-content {
  color: #333;
  line-height: 1.6;
  flex-grow: 1;
  word-break: break-word;
  padding-top: 2px;
}

.error {
  text-align: center;
  padding: 40px;
  color: #f5222d;
}
</style>