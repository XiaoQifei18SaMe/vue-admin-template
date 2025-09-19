<!--src/views/evaluation/form.vue !-->
<template>
  <el-dialog
    :visible.sync="visible"
    :title="title"
    :close-on-click-modal="false"
    width="500px"
    custom-class="evaluation-dialog"
  >
    <!-- 气泡样式容器 -->
    <div class="bubble-container">
      <div class="bubble-pointer"></div>
      <el-form
        ref="evaluationForm"
        :model="form"
        :rules="rules"
        label-width="80px"
        class="evaluation-form"
      >
        <el-form-item label="评价内容" prop="content" class="form-item">
          <el-input
            type="textarea"
            v-model="form.content"
            rows="6"
            :placeholder="placeholderText"
            class="evaluation-textarea"
          ></el-input>
          <div class="char-count">{{ form.content.length }}/500</div>
        </el-form-item>
      </el-form>
    </div>
    
    <div slot="footer" class="dialog-footer">
      <el-button @click="visible = false" class="cancel-btn">取消</el-button>
      <el-button type="primary" @click="handleSubmit" class="submit-btn">提交评价</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { createEvaluation } from '@/api/evaluation'
import { markNotificationAsRead } from '@/api/notification'

export default {
  name: 'EvaluationForm',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    appointmentId: {
      type: Number,
      required: true,
      default: 0,
      validator: (value) => value >= 0
    },
    evaluatorId: {
      type: Number,
      required: true
    },
    evaluatorType: {
      type: String,
      required: true,
      validator: value => ['STUDENT', 'COACH'].includes(value)
    },
    notificationId: {
      type: Number,
      default: null
    }
  },
  data() {
    return {
      form: {
        content: ''
      },
      rules: {
        content: [
          { required: true, message: '请输入评价内容', trigger: 'blur' },
          { min: 10, message: '评价内容至少10个字符', trigger: 'blur' },
          { max: 500, message: '评价内容不能超过500个字符', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    title() {
      return this.evaluatorType === 'STUDENT' 
        ? '训练课评价 - 学员反馈' 
        : '训练课评价 - 教练点评'
    },
    placeholderText() {
      return this.evaluatorType === 'STUDENT'
        ? '请录入此次训练课的收获和教训...'
        : '请录入学生的表现和进一步提高的建议...'
    }
  },
  methods: {
    async handleSubmit() {
      this.$refs.evaluationForm.validate(async (valid) => {
        if (valid) {
          try {
            const params = {
              appointmentId: this.appointmentId,
              evaluatorId: this.evaluatorId,
              evaluatorType: this.evaluatorType,
              content: this.form.content
            }
            
            await createEvaluation(params)
            
            // 如果有通知ID，标记为已读
            if (this.notificationId) {
              await markNotificationAsRead(this.notificationId)
            }
            
            this.$message.success('评价提交成功')
            this.visible = false
            this.$emit('evaluationSubmitted')
          } catch (error) {
            this.$message.error(error.message || '评价提交失败')
          }
        }
      })
    }
  }
}
</script>

<style scoped lang="scss">
.evaluation-dialog {
  .el-dialog__header {
    padding: 18px 20px;
    border-bottom: 1px solid #f0f0f0;
    
    .el-dialog__title {
      font-size: 16px;
      color: #303133;
      font-weight: 500;
    }
  }
  
  .el-dialog__body {
    padding: 25px 20px;
  }
}

// 气泡样式
.bubble-container {
  position: relative;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  }
}

// 气泡指针
.bubble-pointer {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 10px solid transparent;
  border-right: 10px solid transparent;
  border-bottom: 10px solid #f8f9fa;
}

.evaluation-form {
  width: 100%;
}

.form-item {
  margin-bottom: 15px;
  
  .el-form-item__label {
    color: #606266;
    font-weight: 500;
  }
}

.evaluation-textarea {
  width: 100%;
  border-radius: 8px;
  border-color: #dcdfe6;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }
}

// 字符计数
.char-count {
  text-align: right;
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

// 底部按钮样式
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 10px 20px 15px;
  border-top: 1px solid #f0f0f0;
  
  .cancel-btn {
    transition: all 0.2s ease;
    
    &:hover {
      background-color: #f5f7fa;
    }
  }
  
  .submit-btn {
    transition: all 0.2s ease;
    
    &:hover {
      background-color: #66b1ff;
      border-color: #66b1ff;
    }
  }
}
</style>
