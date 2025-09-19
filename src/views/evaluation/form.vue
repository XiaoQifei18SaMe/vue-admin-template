<!-- src/views/evaluation/form.vue -->
<template>
  <el-dialog
    :visible.sync="visible"
    :title="title"
    :close-on-click-modal="false"
    width="500px"
  >
    <el-form
      ref="evaluationForm"
      :model="form"
      :rules="rules"
      label-width="80px"
    >
      <el-form-item label="评价内容" prop="content">
        <el-input
          type="textarea"
          v-model="form.content"
          rows="6"
          placeholder="请输入评价内容"
        ></el-input>
      </el-form-item>
    </el-form>
    <div slot="footer">
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleSubmit">提交评价</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { submitEvaluation } from '@/api/evaluation'
import { markNotificationAsRead } from '@/api/notification'

export default {
  name: 'EvaluationForm',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    appointmentId: {
      type: Number, // 明确类型为Number
      required: true,
      default: 0, // 增加默认值，避免Null
      validator: (value) => value >= 0 // 校验值合法
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
          { min: 10, message: '评价内容至少10个字符', trigger: 'blur' }
        ]
      }
    }
  },
  computed: {
    title() {
      return this.evaluatorType === 'STUDENT' 
        ? '训练课评价 - 学员反馈' 
        : '训练课评价 - 教练点评'
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
            
            await submitEvaluation(params)
            
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